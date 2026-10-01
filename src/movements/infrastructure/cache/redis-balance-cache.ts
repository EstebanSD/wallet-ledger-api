import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { BalanceCachePort } from '../../application/ports/balance-cache.port';
import { REDIS_CLIENT } from './redis-client.provider';

// TTL como red de seguridad, no como mecanismo primario de invalidación
// (ADR-0003) — la invalidación activa post-commit es lo que mantiene
// la caché fresca en el camino feliz; el TTL cubre el caso donde esa
// invalidación no ocurrió (bug, Redis caído en el momento del write).
const TTL_SECONDS = 5 * 60;
const keyFor = (accountId: string) => `balance:${accountId}`;

@Injectable()
export class RedisBalanceCache implements BalanceCachePort {
  private readonly logger = new Logger(RedisBalanceCache.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(accountId: string): Promise<number | null> {
    try {
      const value = await this.redis.get(keyFor(accountId));
      return value === null ? null : Number(value);
    } catch (error) {
      this.logger.warn(
        `Redis GET falló para cuenta ${accountId}, se recalcula desde Postgres: ${error}`,
      );
      return null;
    }
  }

  async set(accountId: string, balance: number): Promise<void> {
    try {
      await this.redis.set(
        keyFor(accountId),
        String(balance),
        'EX',
        TTL_SECONDS,
      );
    } catch (error) {
      this.logger.warn(
        `Redis SET falló para cuenta ${accountId}, se ignora (no es crítico): ${error}`,
      );
    }
  }

  async invalidate(accountId: string): Promise<void> {
    try {
      await this.redis.del(keyFor(accountId));
    } catch (error) {
      this.logger.warn(
        `Redis DEL falló para cuenta ${accountId}, el TTL la va a expirar eventualmente: ${error}`,
      );
    }
  }
}

import Redis from 'ioredis';
import { redisConfig } from '../../../config/redis.config';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisClientProvider = {
  provide: REDIS_CLIENT,
  useFactory: () => new Redis(redisConfig),
};

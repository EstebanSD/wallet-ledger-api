import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movement } from '../../domain/entities/movement.entity';
import {
  MovementListFilters,
  MovementRepositoryPort,
  PaginatedMovements,
  Pagination,
} from '../../application/ports/movement-repository.port';
import { MovementOrmEntity } from './movement.orm-entity';

@Injectable()
export class TypeOrmMovementRepository implements MovementRepositoryPort {
  constructor(
    @InjectRepository(MovementOrmEntity)
    private readonly repository: Repository<MovementOrmEntity>,
  ) {}

  async save(movement: Movement): Promise<void> {
    const row = this.repository.create({
      id: movement.id,
      accountId: movement.accountId,
      type: movement.type,
      amount: movement.amount,
      createdAt: movement.createdAt,
    });
    await this.repository.save(row);
  }

  async getBalance(accountId: string): Promise<number> {
    const rows = await this.repository.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0) AS balance
       FROM movements
       WHERE account_id = $1`,
      [accountId],
    );
    // SUM(integer) en Postgres devuelve bigint, pg lo entrega como string.
    // Seguro de convertir: los montos están muy por debajo de MAX_SAFE_INTEGER.
    return Number(rows[0].balance);
  }

  async findByAccount(
    accountId: string,
    filters: MovementListFilters,
    pagination: Pagination,
  ): Promise<PaginatedMovements> {
    const qb = this.repository
      .createQueryBuilder('movement')
      .where('movement.account_id = :accountId', { accountId });

    if (filters.type) {
      qb.andWhere('movement.type = :type', { type: filters.type });
    }
    if (filters.from) {
      qb.andWhere('movement.created_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('movement.created_at <= :to', { to: filters.to });
    }

    const [rows, total] = await qb
      .orderBy('movement.created_at', 'DESC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    const items = rows.map((row) =>
      Movement.reconstitute({
        id: row.id,
        accountId: row.accountId,
        type: row.type,
        amount: row.amount,
        createdAt: row.createdAt,
      }),
    );

    return { items, total };
  }
}

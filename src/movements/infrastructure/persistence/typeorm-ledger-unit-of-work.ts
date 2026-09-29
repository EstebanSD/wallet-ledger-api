import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Account } from '../../../accounts/domain/entities/account.entity';
import { AccountOrmEntity } from '../../../accounts/infrastructure/persistence/account.orm-entity';
import { Movement } from '../../domain/entities/movement.entity';
import {
  LedgerTransaction,
  LedgerUnitOfWork,
} from '../../application/ports/ledger-unit-of-work.port';
import { MovementOrmEntity } from './movement.orm-entity';

@Injectable()
export class TypeOrmLedgerUnitOfWork implements LedgerUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  // Nivel de aislamiento: el default de Postgres (READ COMMITTED). Es
  // deliberado: el lock de fila + READ COMMITTED garantiza que, tras
  // esperar el lock, el SUM vea lo que commiteó la transacción anterior.
  // Con REPEATABLE READ el snapshot se tomaría antes de esperar y no lo vería.
  run<T>(work: (tx: LedgerTransaction) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work(new TypeOrmLedgerTransaction(manager)),
    );
  }
}

class TypeOrmLedgerTransaction implements LedgerTransaction {
  constructor(private readonly manager: EntityManager) {}

  async lockAccount(accountId: string): Promise<Account | null> {
    const row = await this.manager.findOne(AccountOrmEntity, {
      where: { id: accountId },
      lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE
    });
    if (!row) return null;

    return Account.reconstitute({
      id: row.id,
      ownerRef: row.ownerRef,
      currency: row.currency,
      createdAt: row.createdAt,
    });
  }

  async getBalance(accountId: string): Promise<number> {
    const rows = await this.manager.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0) AS balance
       FROM movements
       WHERE account_id = $1`,
      [accountId],
    );
    // SUM(integer) en Postgres devuelve bigint, y `pg` entrega bigint como
    // string (el gotcha que anotamos antes). Seguro de convertir: el monto
    // máximo de una fila es ~2.1e9, muy lejos de Number.MAX_SAFE_INTEGER.
    return Number(rows[0].balance);
  }

  // insert (no save): un movimiento es inmutable, si el id ya existe
  // tiene que fallar, nunca actualizarse.
  async saveMovement(movement: Movement): Promise<void> {
    await this.manager.insert(MovementOrmEntity, {
      id: movement.id,
      accountId: movement.accountId,
      type: movement.type,
      amount: movement.amount,
      createdAt: movement.createdAt,
    });
  }
}

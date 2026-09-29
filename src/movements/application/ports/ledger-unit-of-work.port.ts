import { Account } from '../../../accounts/domain/entities/account.entity';
import { Movement } from '../../domain/entities/movement.entity';

// Primitivas disponibles DENTRO de una transacción. Solo exponen datos y
// escritura: la regla de negocio (saldo >= monto) vive en el use case.
export interface LedgerTransaction {
  // SELECT ... FOR UPDATE sobre la cuenta. Serializa operaciones
  // concurrentes sobre la misma cuenta hasta que la transacción termine.
  lockAccount(accountId: string): Promise<Account | null>;
  // SUM(CREDIT) - SUM(DEBIT), en unidad mínima (ADR-0001: balance derivado).
  getBalance(accountId: string): Promise<number>;
  saveMovement(movement: Movement): Promise<void>;
}

export interface LedgerUnitOfWork {
  // Commit si `work` resuelve, rollback si lanza.
  run<T>(work: (tx: LedgerTransaction) => Promise<T>): Promise<T>;
}

export const LEDGER_UNIT_OF_WORK = Symbol('LEDGER_UNIT_OF_WORK');

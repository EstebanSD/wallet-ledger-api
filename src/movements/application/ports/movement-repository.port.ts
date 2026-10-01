import { Movement } from '../../domain/entities/movement.entity';

export interface MovementRepositoryPort {
  save(movement: Movement): Promise<void>;
  // Lectura simple, sin lock — distinto de LedgerTransaction.getBalance,
  // que corre con la fila de la cuenta bloqueada dentro de una transacción.
  getBalance(accountId: string): Promise<number>;
}

export const MOVEMENT_REPOSITORY = Symbol('MOVEMENT_REPOSITORY');

import { Movement, MovementType } from '../../domain/entities/movement.entity';

export interface MovementListFilters {
  type?: MovementType;
  from?: Date;
  to?: Date;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedMovements {
  items: Movement[];
  total: number;
}

export interface MovementRepositoryPort {
  save(movement: Movement): Promise<void>;
  // Lectura simple, sin lock — distinto de LedgerTransaction.getBalance,
  // que corre con la fila de la cuenta bloqueada dentro de una transacción.
  getBalance(accountId: string): Promise<number>;
  findByAccount(
    accountId: string,
    filters: MovementListFilters,
    pagination: Pagination,
  ): Promise<PaginatedMovements>;
}

export const MOVEMENT_REPOSITORY = Symbol('MOVEMENT_REPOSITORY');

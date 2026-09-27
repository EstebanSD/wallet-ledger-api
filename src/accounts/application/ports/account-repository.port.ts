import { Account } from '../../domain/entities/account.entity';

export interface AccountRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
}

// Token de inyección: NestJS no puede usar una interfaz como token de DI
// (se borra en tiempo de compilación), así que usamos un Symbol.
export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

import { Account } from '../../../accounts/domain/entities/account.entity';
import { AccountRepositoryPort } from '../../../accounts/application/ports/account-repository.port';
import { Movement, MovementType } from '../../domain/entities/movement.entity';
import {
  MovementListFilters,
  MovementRepositoryPort,
  Pagination,
} from '../ports/movement-repository.port';
import { AccountNotFoundError } from '../errors';
import { ListMovementsUseCase } from './list-movements.use-case';

class InMemoryAccountRepository implements AccountRepositoryPort {
  constructor(private readonly accounts: Account[]) {}
  async save(): Promise<void> {}
  async findById(id: string): Promise<Account | null> {
    return this.accounts.find((a) => a.id === id) ?? null;
  }
}

// Fake que aplica los mismos filtros que la query real, en memoria,
// para no depender de Postgres en el test unitario del use case.
class FakeMovementRepository implements MovementRepositoryPort {
  constructor(private readonly movements: Movement[]) {}
  async save(): Promise<void> {}
  async getBalance(): Promise<number> {
    return 0;
  }
  async findByAccount(
    accountId: string,
    filters: MovementListFilters,
    pagination: Pagination,
  ) {
    let filtered = this.movements.filter((m) => m.accountId === accountId);
    if (filters.type)
      filtered = filtered.filter((m) => m.type === filters.type);
    if (filters.from)
      filtered = filtered.filter((m) => m.createdAt >= filters.from!);
    if (filters.to)
      filtered = filtered.filter((m) => m.createdAt <= filters.to!);

    const total = filtered.length;
    const start = (pagination.page - 1) * pagination.limit;
    const items = filtered.slice(start, start + pagination.limit);
    return { items, total };
  }
}

const account = Account.create({
  id: 'acc-1',
  ownerRef: 'user-123',
  currency: 'USD',
});
const movement = (type: MovementType, amount: number, daysAgo: number) =>
  Movement.reconstitute({
    id: `m-${type}-${amount}-${daysAgo}`,
    accountId: 'acc-1',
    type,
    amount,
    createdAt: new Date(Date.now() - daysAgo * 86_400_000),
  });

describe('ListMovementsUseCase', () => {
  it('pagina los movimientos de una cuenta', async () => {
    const movements = [
      movement(MovementType.CREDIT, 100, 3),
      movement(MovementType.DEBIT, 50, 2),
      movement(MovementType.CREDIT, 200, 1),
    ];
    const useCase = new ListMovementsUseCase(
      new InMemoryAccountRepository([account]),
      new FakeMovementRepository(movements),
    );

    const result = await useCase.execute({
      accountId: 'acc-1',
      page: 1,
      limit: 2,
    });

    expect(result.movements).toHaveLength(2);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it('filtra por type', async () => {
    const movements = [
      movement(MovementType.CREDIT, 100, 2),
      movement(MovementType.DEBIT, 50, 1),
    ];
    const useCase = new ListMovementsUseCase(
      new InMemoryAccountRepository([account]),
      new FakeMovementRepository(movements),
    );

    const result = await useCase.execute({
      accountId: 'acc-1',
      type: MovementType.DEBIT,
      page: 1,
      limit: 20,
    });

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].type).toBe('DEBIT');
  });

  it('rechaza cuenta inexistente', async () => {
    const useCase = new ListMovementsUseCase(
      new InMemoryAccountRepository([]),
      new FakeMovementRepository([]),
    );

    await expect(
      useCase.execute({ accountId: 'no-existe', page: 1, limit: 20 }),
    ).rejects.toThrow(AccountNotFoundError);
  });
});

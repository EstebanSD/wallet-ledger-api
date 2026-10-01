import { Account } from '../../../accounts/domain/entities/account.entity';
import { AccountRepositoryPort } from '../../../accounts/application/ports/account-repository.port';
import { AccountNotFoundError } from '../errors';
import { BalanceCachePort } from '../ports/balance-cache.port';
import { MovementRepositoryPort } from '../ports/movement-repository.port';
import { GetBalanceUseCase } from './get-balance.use-case';

class InMemoryAccountRepository implements AccountRepositoryPort {
  constructor(private readonly accounts: Account[]) {}
  async save(): Promise<void> {}
  async findById(id: string): Promise<Account | null> {
    return this.accounts.find((a) => a.id === id) ?? null;
  }
}

class FakeMovementRepository implements MovementRepositoryPort {
  public getBalanceCalls = 0;
  constructor(private readonly balance: number) {}
  async save(): Promise<void> {}
  async getBalance(): Promise<number> {
    this.getBalanceCalls += 1;
    return this.balance;
  }
}

class FakeCache implements BalanceCachePort {
  private readonly store = new Map<string, number>();
  async get(accountId: string): Promise<number | null> {
    return this.store.has(accountId) ? this.store.get(accountId)! : null;
  }
  async set(accountId: string, balance: number): Promise<void> {
    this.store.set(accountId, balance);
  }
  async invalidate(accountId: string): Promise<void> {
    this.store.delete(accountId);
  }
}

const account = Account.create({
  id: 'acc-1',
  ownerRef: 'user-123',
  currency: 'USD',
});

describe('GetBalanceUseCase', () => {
  it('en cache miss, calcula desde el repo y recachea', async () => {
    const movementRepo = new FakeMovementRepository(1500);
    const cache = new FakeCache();
    const useCase = new GetBalanceUseCase(
      new InMemoryAccountRepository([account]),
      movementRepo,
      cache,
    );

    const result = await useCase.execute({ accountId: 'acc-1' });

    expect(result).toEqual({
      accountId: 'acc-1',
      currency: 'USD',
      balance: 1500,
      source: 'database',
    });
    expect(movementRepo.getBalanceCalls).toBe(1);
    expect(await cache.get('acc-1')).toBe(1500); // quedó cacheado
  });

  it('en cache hit, no toca el repo de movimientos', async () => {
    const movementRepo = new FakeMovementRepository(9999); // no debería usarse
    const cache = new FakeCache();
    await cache.set('acc-1', 1500);
    const useCase = new GetBalanceUseCase(
      new InMemoryAccountRepository([account]),
      movementRepo,
      cache,
    );

    const result = await useCase.execute({ accountId: 'acc-1' });

    expect(result).toEqual({
      accountId: 'acc-1',
      currency: 'USD',
      balance: 1500,
      source: 'cache',
    });
    expect(movementRepo.getBalanceCalls).toBe(0);
  });

  it('rechaza cuenta inexistente', async () => {
    const useCase = new GetBalanceUseCase(
      new InMemoryAccountRepository([]),
      new FakeMovementRepository(0),
      new FakeCache(),
    );

    await expect(useCase.execute({ accountId: 'no-existe' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });
});

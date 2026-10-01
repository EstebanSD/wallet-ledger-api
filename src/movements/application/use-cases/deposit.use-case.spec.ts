import { Account } from '../../../accounts/domain/entities/account.entity';
import { AccountRepositoryPort } from '../../../accounts/application/ports/account-repository.port';
import { Movement } from '../../domain/entities/movement.entity';
import { MovementRepositoryPort } from '../ports/movement-repository.port';
import { BalanceCachePort } from '../ports/balance-cache.port';
import { AccountNotFoundError } from '../errors';
import { DepositUseCase } from './deposit.use-case';

class InMemoryAccountRepository implements AccountRepositoryPort {
  constructor(private readonly accounts: Account[] = []) {}

  async save(account: Account): Promise<void> {
    this.accounts.push(account);
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.find((a) => a.id === id) ?? null;
  }
}

class InMemoryMovementRepository implements MovementRepositoryPort {
  public readonly saved: Movement[] = [];

  async save(movement: Movement): Promise<void> {
    this.saved.push(movement);
  }

  async getBalance(): Promise<number> {
    return this.saved.reduce((sum, m) => sum + m.amount, 0);
  }
}

class FakeCache implements BalanceCachePort {
  public readonly invalidated: string[] = [];
  async get(): Promise<number | null> {
    return null;
  }
  async set(): Promise<void> {}
  async invalidate(accountId: string): Promise<void> {
    this.invalidated.push(accountId);
  }
}

describe('DepositUseCase', () => {
  it('crea un movimiento CREDIT para una cuenta existente e invalida la cache', async () => {
    const account = Account.create({
      id: 'acc-1',
      ownerRef: 'user-123',
      currency: 'USD',
    });
    const cache = new FakeCache();
    const useCase = new DepositUseCase(
      new InMemoryAccountRepository([account]),
      new InMemoryMovementRepository(),
      cache,
    );

    const result = await useCase.execute({ accountId: 'acc-1', amount: 1500 });

    expect(result.type).toBe('CREDIT');
    expect(result.amount).toBe(1500);
    expect(result.accountId).toBe('acc-1');
    expect(cache.invalidated).toEqual(['acc-1']);
  });

  it('rechaza depositar en una cuenta inexistente', async () => {
    const useCase = new DepositUseCase(
      new InMemoryAccountRepository([]),
      new InMemoryMovementRepository(),
      new FakeCache(),
    );

    await expect(
      useCase.execute({ accountId: 'no-existe', amount: 1000 }),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('rechaza montos no enteros o no positivos', async () => {
    const account = Account.create({
      id: 'acc-1',
      ownerRef: 'user-123',
      currency: 'USD',
    });
    const useCase = new DepositUseCase(
      new InMemoryAccountRepository([account]),
      new InMemoryMovementRepository(),
      new FakeCache(),
    );

    await expect(
      useCase.execute({ accountId: 'acc-1', amount: 10.5 }),
    ).rejects.toThrow();
    await expect(
      useCase.execute({ accountId: 'acc-1', amount: -5 }),
    ).rejects.toThrow();
    await expect(
      useCase.execute({ accountId: 'acc-1', amount: 0 }),
    ).rejects.toThrow();
  });
});

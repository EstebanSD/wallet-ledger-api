import { Account } from '../../../accounts/domain/entities/account.entity';
import { Movement, MovementType } from '../../domain/entities/movement.entity';
import { AccountNotFoundError, InsufficientFundsError } from '../errors';
import {
  LedgerTransaction,
  LedgerUnitOfWork,
} from '../ports/ledger-unit-of-work.port';
import { WithdrawUseCase } from './withdraw.use-case';
import { BalanceCachePort } from '../ports/balance-cache.port';

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

// Fake en memoria. OJO: NO simula bloqueos ni concurrencia, así que estos
// tests verifican la LÓGICA del use case, no la garantía anti-carrera
// (esa se verifica contra Postgres real, ver prueba con requests paralelos).
class InMemoryLedger implements LedgerUnitOfWork {
  constructor(
    private readonly accounts: Account[],
    public readonly movements: Movement[] = [],
  ) {}

  run<T>(work: (tx: LedgerTransaction) => Promise<T>): Promise<T> {
    return work({
      lockAccount: async (id) => this.accounts.find((a) => a.id === id) ?? null,
      getBalance: async (id) =>
        this.movements
          .filter((m) => m.accountId === id)
          .reduce(
            (sum, m) =>
              sum + (m.type === MovementType.CREDIT ? m.amount : -m.amount),
            0,
          ),
      saveMovement: async (m) => {
        this.movements.push(m);
      },
    });
  }
}

const account = Account.create({
  id: 'acc-1',
  ownerRef: 'user-123',
  currency: 'USD',
});
const credit = (amount: number) =>
  Movement.create({
    id: `c-${amount}`,
    accountId: 'acc-1',
    type: MovementType.CREDIT,
    amount,
  });

describe('WithdrawUseCase', () => {
  it('crea un DEBIT cuando el saldo alcanza, e invalida la cache post-commit', async () => {
    const ledger = new InMemoryLedger([account], [credit(1000)]);
    const cache = new FakeCache();
    const result = await new WithdrawUseCase(ledger, cache).execute({
      accountId: 'acc-1',
      amount: 400,
    });

    expect(result.type).toBe('DEBIT');
    expect(result.amount).toBe(400);
    expect(ledger.movements).toHaveLength(2);
    expect(cache.invalidated).toEqual(['acc-1']);
  });

  it('permite retirar exactamente el saldo (borde: saldo == monto)', async () => {
    const ledger = new InMemoryLedger([account], [credit(1000)]);
    const cache = new FakeCache();

    await expect(
      new WithdrawUseCase(ledger, cache).execute({
        accountId: 'acc-1',
        amount: 1000,
      }),
    ).resolves.toBeDefined();
  });

  it('rechaza si el saldo no alcanza, no inserta nada y NO invalida la cache', async () => {
    const ledger = new InMemoryLedger([account], [credit(1000)]);
    const cache = new FakeCache();

    await expect(
      new WithdrawUseCase(ledger, cache).execute({
        accountId: 'acc-1',
        amount: 1001,
      }),
    ).rejects.toThrow(InsufficientFundsError);
    expect(ledger.movements).toHaveLength(1);
    // Clave: si esto fallara, significaría que invalidate() se está
    // llamando sin que haya habido commit real — justo lo que el ADR-0003
    // prohíbe.
    expect(cache.invalidated).toEqual([]);
  });

  it('rechaza retirar de una cuenta sin movimientos (saldo 0)', async () => {
    const ledger = new InMemoryLedger([account]);
    const cache = new FakeCache();

    await expect(
      new WithdrawUseCase(ledger, cache).execute({
        accountId: 'acc-1',
        amount: 1,
      }),
    ).rejects.toThrow(InsufficientFundsError);
  });

  it('rechaza cuenta inexistente', async () => {
    const ledger = new InMemoryLedger([]);
    const cache = new FakeCache();

    await expect(
      new WithdrawUseCase(ledger, cache).execute({
        accountId: 'no-existe',
        amount: 100,
      }),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it('rechaza montos no enteros o no positivos', async () => {
    const ledger = new InMemoryLedger([account], [credit(1000)]);
    const useCase = new WithdrawUseCase(ledger, new FakeCache());

    await expect(
      useCase.execute({ accountId: 'acc-1', amount: 10.5 }),
    ).rejects.toThrow();
    await expect(
      useCase.execute({ accountId: 'acc-1', amount: 0 }),
    ).rejects.toThrow();
    await expect(
      useCase.execute({ accountId: 'acc-1', amount: -5 }),
    ).rejects.toThrow();
  });
});

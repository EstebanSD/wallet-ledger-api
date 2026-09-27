import { CreateAccountUseCase } from './create-account.use-case';
import { AccountRepositoryPort } from '../ports/account-repository.port';
import { Account } from '../../domain/entities/account.entity';

class InMemoryAccountRepository implements AccountRepositoryPort {
  public readonly saved: Account[] = [];

  async save(account: Account): Promise<void> {
    this.saved.push(account);
  }

  async findById(id: string): Promise<Account | null> {
    return this.saved.find((a) => a.id === id) ?? null;
  }
}

describe('CreateAccountUseCase', () => {
  it('crea una cuenta y normaliza la currency a mayúsculas', async () => {
    const repo = new InMemoryAccountRepository();
    const useCase = new CreateAccountUseCase(repo);

    const result = await useCase.execute({
      ownerRef: 'user-123',
      currency: 'usd',
    });

    expect(result.currency).toBe('USD');
    expect(repo.saved).toHaveLength(1);
    expect(repo.saved[0].id).toBe(result.id);
  });

  it('rechaza ownerRef vacío o solo espacios', async () => {
    const repo = new InMemoryAccountRepository();
    const useCase = new CreateAccountUseCase(repo);

    await expect(
      useCase.execute({ ownerRef: '   ', currency: 'USD' }),
    ).rejects.toThrow('ownerRef no puede estar vacío');
    expect(repo.saved).toHaveLength(0);
  });
});

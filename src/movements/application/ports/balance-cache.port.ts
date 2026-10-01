// ADR-0003: Redis es asistencia, no dependencia dura. Por eso el contrato
// no tiene forma de expresar "Redis está caído" como un error — get()
// devuelve null tanto si no hay valor cacheado como si Redis no respondió.
// El use case reacciona igual en los dos casos: recalcula desde Postgres.
export interface BalanceCachePort {
  get(accountId: string): Promise<number | null>;
  set(accountId: string, balance: number): Promise<void>;
  invalidate(accountId: string): Promise<void>;
}

export const BALANCE_CACHE = Symbol('BALANCE_CACHE');

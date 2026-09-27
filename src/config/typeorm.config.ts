import { DataSourceOptions } from 'typeorm';
import { AccountOrmEntity } from '../accounts/infrastructure/persistence/account.orm-entity';

// Una sola definición de conexión, importada tanto por app.module.ts (runtime)
// como por data-source.ts (CLI de migraciones). Evita que las dos configs
// se desincronicen con el tiempo (ej: alguien agrega una entidad y se olvida
// de listarla en uno de los dos lados).
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'wallet_user',
  password: process.env.POSTGRES_PASSWORD ?? 'wallet_pass',
  database: process.env.POSTGRES_DB ?? 'wallet_ledger',
  entities: [AccountOrmEntity],
  migrations: ['src/migrations/*.ts'],
  // NUNCA true en este proyecto: ver el ADR de migraciones vs synchronize.
  synchronize: false,
};

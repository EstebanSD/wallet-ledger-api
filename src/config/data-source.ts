import 'dotenv/config';
import { DataSource } from 'typeorm';
import { typeOrmConfig } from './typeorm.config';

// Este archivo lo consume ÚNICAMENTE el CLI de TypeORM (migration:generate,
// migration:run, migration:revert). No lo importa el resto de la app —
// Nest usa TypeOrmModule.forRoot(typeOrmConfig) directamente en app.module.ts.
export default new DataSource(typeOrmConfig);

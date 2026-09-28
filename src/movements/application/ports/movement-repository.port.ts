import { Movement } from '../../domain/entities/movement.entity';

export interface MovementRepositoryPort {
  save(movement: Movement): Promise<void>;
}

export const MOVEMENT_REPOSITORY = Symbol('MOVEMENT_REPOSITORY');

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AccountOrmEntity } from '../../../accounts/infrastructure/persistence/account.orm-entity';
import { MovementType } from '../../domain/entities/movement.entity';

@Entity({ name: 'movements' })
export class MovementOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  // Columna plana: el resto del código (repo, dominio) sigue usando accountId
  // como string, sin tocar la relación.
  @Index()
  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  // Declara la FK para que TypeORM la genere y la mantenga en el diff.
  // No carga nada salvo que se pida explícitamente con `relations`.
  // RESTRICT: no se puede borrar una cuenta que tenga movimientos.
  @ManyToOne(() => AccountOrmEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account: AccountOrmEntity;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  // integer, no bigint: ver ADR en el chat — techo consciente de
  // ~2.1 mil millones de la unidad mínima, evita que `pg` devuelva
  // el monto como string en vez de number.
  @Column({ type: 'integer' })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'accounts' })
export class AccountOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  // Índice porque ConsultarSaldo/ConsultarMovimientos van a buscar
  // cuentas por owner_ref. Sin auth todavía, así que no es un FK a
  // ninguna tabla de usuarios, solo un string indexado.
  @Index()
  @Column({ name: 'owner_ref', type: 'varchar' })
  ownerRef: string;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

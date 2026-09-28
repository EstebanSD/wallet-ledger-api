import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMovementsTable1790596062600 implements MigrationInterface {
  name = 'CreateMovementsTable1790596062600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."movements_type_enum" AS ENUM('CREDIT', 'DEBIT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "movements" ("id" uuid NOT NULL, "account_id" uuid NOT NULL, "type" "public"."movements_type_enum" NOT NULL, "amount" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a8e3da15ab8f2ce353e7f58f67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2444e46e3f443c8af973b3614" ON "movements"  ("account_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "movements" ADD CONSTRAINT "FK_c2444e46e3f443c8af973b36146" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "movements" DROP CONSTRAINT "FK_c2444e46e3f443c8af973b36146"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c2444e46e3f443c8af973b3614"`,
    );
    await queryRunner.query(`DROP TABLE "movements"`);
    await queryRunner.query(`DROP TYPE "public"."movements_type_enum"`);
  }
}

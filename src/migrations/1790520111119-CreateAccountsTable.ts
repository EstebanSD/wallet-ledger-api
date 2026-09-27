import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountsTable1790520111119 implements MigrationInterface {
  name = 'CreateAccountsTable1790520111119';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL, "owner_ref" character varying NOT NULL, "currency" character varying(3) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "accounts"`);
  }
}

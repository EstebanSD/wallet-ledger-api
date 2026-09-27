import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerRefIndex1790521246484 implements MigrationInterface {
  name = 'AddOwnerRefIndex1790521246484';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_503fd4db3fe11b05c224ab5f06" ON "accounts"  ("owner_ref") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_503fd4db3fe11b05c224ab5f06"`,
    );
  }
}

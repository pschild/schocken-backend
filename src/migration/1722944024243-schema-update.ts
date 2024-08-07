import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1722944024243 implements MigrationInterface {
    name = 'SchemaUpdate1722944024243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hoptimisten"."finals" ("roundId" uuid NOT NULL, "playerId" uuid NOT NULL, CONSTRAINT "PK_920769631d821663d1f2f4fad98" PRIMARY KEY ("roundId", "playerId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ba10e9a7bbc086a6892500ad7" ON "hoptimisten"."finals" ("roundId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a1e2f0ff438904d27ffea16ccc" ON "hoptimisten"."finals" ("playerId") `);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" ADD CONSTRAINT "FK_0ba10e9a7bbc086a6892500ad7d" FOREIGN KEY ("roundId") REFERENCES "hoptimisten"."round"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" ADD CONSTRAINT "FK_a1e2f0ff438904d27ffea16ccc2" FOREIGN KEY ("playerId") REFERENCES "hoptimisten"."player"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" DROP CONSTRAINT "FK_a1e2f0ff438904d27ffea16ccc2"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" DROP CONSTRAINT "FK_0ba10e9a7bbc086a6892500ad7d"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_a1e2f0ff438904d27ffea16ccc"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_0ba10e9a7bbc086a6892500ad7"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."finals"`);
    }

}

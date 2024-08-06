import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1722943539201 implements MigrationInterface {
    name = 'SchemaUpdate1722943539201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hoptimisten"."attendances" ("roundId" uuid NOT NULL, "playerId" uuid NOT NULL, CONSTRAINT "PK_045f6dca5876893862d1328dcfe" PRIMARY KEY ("roundId", "playerId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a691e29b3431f127e0b0a1464f" ON "hoptimisten"."attendances" ("roundId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ceb6790545a68f3cd9d883322f" ON "hoptimisten"."attendances" ("playerId") `);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" ADD CONSTRAINT "FK_a691e29b3431f127e0b0a1464f4" FOREIGN KEY ("roundId") REFERENCES "hoptimisten"."round"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" ADD CONSTRAINT "FK_ceb6790545a68f3cd9d883322f2" FOREIGN KEY ("playerId") REFERENCES "hoptimisten"."player"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" DROP CONSTRAINT "FK_ceb6790545a68f3cd9d883322f2"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" DROP CONSTRAINT "FK_a691e29b3431f127e0b0a1464f4"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_ceb6790545a68f3cd9d883322f"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_a691e29b3431f127e0b0a1464f"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."attendances"`);
    }

}

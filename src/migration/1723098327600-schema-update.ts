import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1723098327600 implements MigrationInterface {
    name = 'SchemaUpdate1723098327600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hoptimisten"."round" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "datetime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "gameId" uuid, CONSTRAINT "PK_34bd959f3f4a90eb86e4ae24d2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hoptimisten"."game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "datetime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completed" boolean NOT NULL DEFAULT false, "placeOfAwayGame" character varying(64), "hostedById" uuid, CONSTRAINT "CHK_9abaa1447658046c9997471f4e" CHECK (NOT ("placeOfAwayGame" IS NOT NULL AND "hostedById" is NOT NULL)), CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hoptimisten"."player" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "name" character varying(32) NOT NULL, "registered" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_7baa5220210c74f8db27c06f8b4" UNIQUE ("name"), CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hoptimisten"."attendances" ("roundId" uuid NOT NULL, "playerId" uuid NOT NULL, CONSTRAINT "PK_045f6dca5876893862d1328dcfe" PRIMARY KEY ("roundId", "playerId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a691e29b3431f127e0b0a1464f" ON "hoptimisten"."attendances" ("roundId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ceb6790545a68f3cd9d883322f" ON "hoptimisten"."attendances" ("playerId") `);
        await queryRunner.query(`CREATE TABLE "hoptimisten"."finals" ("roundId" uuid NOT NULL, "playerId" uuid NOT NULL, CONSTRAINT "PK_920769631d821663d1f2f4fad98" PRIMARY KEY ("roundId", "playerId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ba10e9a7bbc086a6892500ad7" ON "hoptimisten"."finals" ("roundId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a1e2f0ff438904d27ffea16ccc" ON "hoptimisten"."finals" ("playerId") `);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."round" ADD CONSTRAINT "FK_e4d9372889dee36f0a4be7f25e6" FOREIGN KEY ("gameId") REFERENCES "hoptimisten"."game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" ADD CONSTRAINT "FK_dc73f954be371a533380c2ae626" FOREIGN KEY ("hostedById") REFERENCES "hoptimisten"."player"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" ADD CONSTRAINT "FK_a691e29b3431f127e0b0a1464f4" FOREIGN KEY ("roundId") REFERENCES "hoptimisten"."round"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" ADD CONSTRAINT "FK_ceb6790545a68f3cd9d883322f2" FOREIGN KEY ("playerId") REFERENCES "hoptimisten"."player"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" ADD CONSTRAINT "FK_0ba10e9a7bbc086a6892500ad7d" FOREIGN KEY ("roundId") REFERENCES "hoptimisten"."round"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" ADD CONSTRAINT "FK_a1e2f0ff438904d27ffea16ccc2" FOREIGN KEY ("playerId") REFERENCES "hoptimisten"."player"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" DROP CONSTRAINT "FK_a1e2f0ff438904d27ffea16ccc2"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."finals" DROP CONSTRAINT "FK_0ba10e9a7bbc086a6892500ad7d"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" DROP CONSTRAINT "FK_ceb6790545a68f3cd9d883322f2"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."attendances" DROP CONSTRAINT "FK_a691e29b3431f127e0b0a1464f4"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" DROP CONSTRAINT "FK_dc73f954be371a533380c2ae626"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."round" DROP CONSTRAINT "FK_e4d9372889dee36f0a4be7f25e6"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_a1e2f0ff438904d27ffea16ccc"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_0ba10e9a7bbc086a6892500ad7"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."finals"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_ceb6790545a68f3cd9d883322f"`);
        await queryRunner.query(`DROP INDEX "hoptimisten"."IDX_a691e29b3431f127e0b0a1464f"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."attendances"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."player"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."game"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."round"`);
    }

}

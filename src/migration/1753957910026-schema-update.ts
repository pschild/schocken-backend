import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1753957910026 implements MigrationInterface {
    name = 'SchemaUpdate1753957910026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payment_penaltyunit_enum" AS ENUM('EURO', 'BEER_CRATE')`);
        await queryRunner.query(`CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "penaltyUnit" "public"."payment_penaltyunit_enum", "penaltyValue" real NOT NULL, "outstandingValue" real NOT NULL, "confirmed" boolean NOT NULL DEFAULT false, "confirmedAt" TIMESTAMP WITH TIME ZONE, "confirmedBy" character varying(64), "playerId" uuid NOT NULL, "gameId" uuid NOT NULL, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8de8a192d00e33568fc1e64463" ON "payment" ("playerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b014b2138aa30910989bfb6c31" ON "payment" ("gameId") `);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_8de8a192d00e33568fc1e644634" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_b014b2138aa30910989bfb6c317" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_b014b2138aa30910989bfb6c317"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_8de8a192d00e33568fc1e644634"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b014b2138aa30910989bfb6c31"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8de8a192d00e33568fc1e64463"`);
        await queryRunner.query(`DROP TABLE "payment"`);
        await queryRunner.query(`DROP TYPE "public"."payment_penaltyunit_enum"`);
    }

}

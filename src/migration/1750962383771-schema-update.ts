import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1750962383771 implements MigrationInterface {
    name = 'SchemaUpdate1750962383771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."event_type_revision_type_enum" AS ENUM('INSERT', 'UPDATE', 'REMOVE')`);
        await queryRunner.query(`CREATE TYPE "public"."event_type_revision_context_enum" AS ENUM('GAME', 'ROUND')`);
        await queryRunner.query(`CREATE TYPE "public"."event_type_revision_trigger_enum" AS ENUM('VERLOREN', 'SCHOCK_AUS', 'SCHOCK_AUS_STRAFE', 'ZWEI_ZWEI_EINS', 'LUSTWURF')`);
        await queryRunner.query(`CREATE TYPE "public"."event_type_revision_penaltyunit_enum" AS ENUM('EURO', 'BEER_CRATE')`);
        await queryRunner.query(`CREATE TABLE "event_type_revision" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "type" "public"."event_type_revision_type_enum" NOT NULL, "description" character varying(64) NOT NULL, "context" "public"."event_type_revision_context_enum" NOT NULL, "trigger" "public"."event_type_revision_trigger_enum", "penaltyValue" real, "penaltyUnit" "public"."event_type_revision_penaltyunit_enum", "multiplicatorUnit" character varying(32), "hasComment" boolean NOT NULL DEFAULT false, "eventTypeId" uuid NOT NULL, CONSTRAINT "PK_682935d45462ee1b25a2078ee75" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_60d2011c0e98575b63e604ac21" ON "event_type_revision" ("eventTypeId") `);
        await queryRunner.query(`CREATE TYPE "public"."event_type_context_enum" AS ENUM('GAME', 'ROUND')`);
        await queryRunner.query(`CREATE TYPE "public"."event_type_trigger_enum" AS ENUM('VERLOREN', 'SCHOCK_AUS', 'SCHOCK_AUS_STRAFE', 'ZWEI_ZWEI_EINS', 'LUSTWURF')`);
        await queryRunner.query(`CREATE TYPE "public"."event_type_penaltyunit_enum" AS ENUM('EURO', 'BEER_CRATE')`);
        await queryRunner.query(`CREATE TABLE "event_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "description" character varying(64) NOT NULL, "context" "public"."event_type_context_enum" NOT NULL, "trigger" "public"."event_type_trigger_enum", "penaltyValue" real, "penaltyUnit" "public"."event_type_penaltyunit_enum", "multiplicatorUnit" character varying(32), "hasComment" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_5bde7aeb2c7fb3a421b175871ee" UNIQUE ("description"), CONSTRAINT "PK_d968f34984d7d85d96f782872fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "round" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "datetime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "gameId" uuid NOT NULL, CONSTRAINT "PK_34bd959f3f4a90eb86e4ae24d2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e4d9372889dee36f0a4be7f25e" ON "round" ("gameId") `);
        await queryRunner.query(`CREATE TYPE "public"."event_penaltyunit_enum" AS ENUM('EURO', 'BEER_CRATE')`);
        await queryRunner.query(`CREATE TYPE "public"."event_context_enum" AS ENUM('GAME', 'ROUND')`);
        await queryRunner.query(`CREATE TABLE "event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "datetime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "multiplicatorValue" real NOT NULL DEFAULT '1', "penaltyValue" real, "penaltyUnit" "public"."event_penaltyunit_enum", "comment" character varying(128), "context" "public"."event_context_enum" NOT NULL, "gameId" uuid, "roundId" uuid, "playerId" uuid NOT NULL, "eventTypeId" uuid NOT NULL, CONSTRAINT "CHK_ba7ccee91e437c7c99dc55e850" CHECK (("context" = 'GAME' AND "gameId" IS NOT NULL) OR ("context" = 'ROUND' AND "roundId" IS NOT NULL)), CONSTRAINT "CHK_0f5c85775723f68fd5b5cbb9bc" CHECK (NOT ("gameId" IS NOT NULL AND "roundId" is NOT NULL)), CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7797f9c3f1bf2d2e724bd11138" ON "event" ("gameId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2337549cc7373917f9d3712f46" ON "event" ("roundId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7fe4019a52040ef4c089086b4f" ON "event" ("playerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3b674f340d59a5fc144f222976" ON "event" ("eventTypeId") `);
        await queryRunner.query(`CREATE TYPE "public"."game_placetype_enum" AS ENUM('HOME', 'AWAY', 'REMOTE')`);
        await queryRunner.query(`CREATE TABLE "game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "datetime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completed" boolean NOT NULL DEFAULT false, "excludeFromStatistics" boolean NOT NULL DEFAULT false, "placeType" "public"."game_placetype_enum" NOT NULL, "placeOfAwayGame" character varying(64), "hostedById" uuid, CONSTRAINT "CHK_9abaa1447658046c9997471f4e" CHECK (NOT ("placeOfAwayGame" IS NOT NULL AND "hostedById" is NOT NULL)), CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a194980dc2c79368514215875" ON "game" ("datetime") `);
        await queryRunner.query(`CREATE INDEX "IDX_dc73f954be371a533380c2ae62" ON "game" ("hostedById") `);
        await queryRunner.query(`CREATE TABLE "player" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedDateTime" TIMESTAMP, "name" character varying(32) NOT NULL, "registered" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "active" boolean NOT NULL DEFAULT true, "auth0UserId" character varying(64), CONSTRAINT "UQ_7baa5220210c74f8db27c06f8b4" UNIQUE ("name"), CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendances" ("roundId" uuid NOT NULL, "playerId" uuid NOT NULL, CONSTRAINT "PK_045f6dca5876893862d1328dcfe" PRIMARY KEY ("roundId", "playerId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a691e29b3431f127e0b0a1464f" ON "attendances" ("roundId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ceb6790545a68f3cd9d883322f" ON "attendances" ("playerId") `);
        await queryRunner.query(`CREATE TABLE "finals" ("roundId" uuid NOT NULL, "playerId" uuid NOT NULL, CONSTRAINT "PK_920769631d821663d1f2f4fad98" PRIMARY KEY ("roundId", "playerId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ba10e9a7bbc086a6892500ad7" ON "finals" ("roundId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a1e2f0ff438904d27ffea16ccc" ON "finals" ("playerId") `);
        await queryRunner.query(`ALTER TABLE "event_type_revision" ADD CONSTRAINT "FK_60d2011c0e98575b63e604ac214" FOREIGN KEY ("eventTypeId") REFERENCES "event_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "round" ADD CONSTRAINT "FK_e4d9372889dee36f0a4be7f25e6" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_7797f9c3f1bf2d2e724bd111380" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_2337549cc7373917f9d3712f462" FOREIGN KEY ("roundId") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_7fe4019a52040ef4c089086b4f6" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_3b674f340d59a5fc144f2229763" FOREIGN KEY ("eventTypeId") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_dc73f954be371a533380c2ae626" FOREIGN KEY ("hostedById") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_a691e29b3431f127e0b0a1464f4" FOREIGN KEY ("roundId") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_ceb6790545a68f3cd9d883322f2" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "finals" ADD CONSTRAINT "FK_0ba10e9a7bbc086a6892500ad7d" FOREIGN KEY ("roundId") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "finals" ADD CONSTRAINT "FK_a1e2f0ff438904d27ffea16ccc2" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "finals" DROP CONSTRAINT "FK_a1e2f0ff438904d27ffea16ccc2"`);
        await queryRunner.query(`ALTER TABLE "finals" DROP CONSTRAINT "FK_0ba10e9a7bbc086a6892500ad7d"`);
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_ceb6790545a68f3cd9d883322f2"`);
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_a691e29b3431f127e0b0a1464f4"`);
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_dc73f954be371a533380c2ae626"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_3b674f340d59a5fc144f2229763"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_7fe4019a52040ef4c089086b4f6"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_2337549cc7373917f9d3712f462"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_7797f9c3f1bf2d2e724bd111380"`);
        await queryRunner.query(`ALTER TABLE "round" DROP CONSTRAINT "FK_e4d9372889dee36f0a4be7f25e6"`);
        await queryRunner.query(`ALTER TABLE "event_type_revision" DROP CONSTRAINT "FK_60d2011c0e98575b63e604ac214"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a1e2f0ff438904d27ffea16ccc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ba10e9a7bbc086a6892500ad7"`);
        await queryRunner.query(`DROP TABLE "finals"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ceb6790545a68f3cd9d883322f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a691e29b3431f127e0b0a1464f"`);
        await queryRunner.query(`DROP TABLE "attendances"`);
        await queryRunner.query(`DROP TABLE "player"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc73f954be371a533380c2ae62"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a194980dc2c79368514215875"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TYPE "public"."game_placetype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b674f340d59a5fc144f222976"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fe4019a52040ef4c089086b4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2337549cc7373917f9d3712f46"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7797f9c3f1bf2d2e724bd11138"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TYPE "public"."event_context_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_penaltyunit_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e4d9372889dee36f0a4be7f25e"`);
        await queryRunner.query(`DROP TABLE "round"`);
        await queryRunner.query(`DROP TABLE "event_type"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_penaltyunit_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_trigger_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_context_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60d2011c0e98575b63e604ac21"`);
        await queryRunner.query(`DROP TABLE "event_type_revision"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_revision_penaltyunit_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_revision_trigger_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_revision_context_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_revision_type_enum"`);
    }

}

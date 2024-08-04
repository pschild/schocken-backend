import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1722795340130 implements MigrationInterface {
    name = 'SchemaUpdate1722795340130'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hoptimisten"."game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "datetime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hoptimisten"."round" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastChangedDateTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "datetime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "gameId" uuid NOT NULL, CONSTRAINT "PK_34bd959f3f4a90eb86e4ae24d2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."round" ADD CONSTRAINT "FK_e4d9372889dee36f0a4be7f25e6" FOREIGN KEY ("gameId") REFERENCES "hoptimisten"."game"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."round" DROP CONSTRAINT "FK_e4d9372889dee36f0a4be7f25e6"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."round"`);
        await queryRunner.query(`DROP TABLE "hoptimisten"."game"`);
    }

}

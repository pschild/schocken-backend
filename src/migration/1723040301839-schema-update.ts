import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1723040301839 implements MigrationInterface {
    name = 'SchemaUpdate1723040301839'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" ADD "placeOfAwayGame" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" ADD "hostedById" uuid`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" ADD CONSTRAINT "FK_dc73f954be371a533380c2ae626" FOREIGN KEY ("hostedById") REFERENCES "hoptimisten"."player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" DROP CONSTRAINT "FK_dc73f954be371a533380c2ae626"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" DROP COLUMN "hostedById"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" DROP COLUMN "placeOfAwayGame"`);
    }

}

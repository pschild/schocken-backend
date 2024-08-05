import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1722851094091 implements MigrationInterface {
    name = 'SchemaUpdate1722851094091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."player" ADD "deletedDateTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."round" ADD "deletedDateTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" ADD "deletedDateTime" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hoptimisten"."game" DROP COLUMN "deletedDateTime"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."round" DROP COLUMN "deletedDateTime"`);
        await queryRunner.query(`ALTER TABLE "hoptimisten"."player" DROP COLUMN "deletedDateTime"`);
    }

}

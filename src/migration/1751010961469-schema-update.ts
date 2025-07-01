import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaUpdate1751010961469 implements MigrationInterface {
    name = 'SchemaUpdate1751010961469'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_settings" ("auth0UserId" character varying(64) NOT NULL, "enablePushNotifications" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_837380985ac885dc5c44305b82a" PRIMARY KEY ("auth0UserId"))`);
        await queryRunner.query(`CREATE TABLE "push_subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auth0UserId" character varying(64) NOT NULL, "endpoint" character varying NOT NULL, "p256dhKey" character varying NOT NULL, "authKey" character varying NOT NULL, CONSTRAINT "PK_07fc861c0d2c38c1b830fb9cb5d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "push_subscription"`);
        await queryRunner.query(`DROP TABLE "user_settings"`);
    }

}

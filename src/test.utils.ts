import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';
import { EventTypeContext } from './event-type/enum/event-type-context.enum';
import { EventTypeRevisionType } from './event-type/enum/event-type-revision-type.enum';
import { EventTypeTrigger } from './event-type/enum/event-type-trigger.enum';
import { EventContext } from './event/enum/event-context.enum';
import { PlaceType } from './game/enum/place-type.enum';
import { BaseEntity } from './model/base.entity';
import { EventTypeRevision } from './model/event-type-revision.entity';
import { EventType } from './model/event-type.entity';
import { Event } from './model/event.entity';
import { Game } from './model/game.entity';
import { Player } from './model/player.entity';
import { Round } from './model/round.entity';
import { PenaltyUnit } from './penalty/enum/penalty-unit.enum';

export type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

export const UUID_V4_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
export const RANDOM_UUID = () => v4();

export const RANDOM_STRING = (length: number) => [...Array(length)].map(() => Math.random().toString(36)[2]).join('');

let dataSource: DataSource;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDockerDataSource = async () => {
  if (dataSource) {
    return dataSource;
  }
  dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_DB,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    entities: [Game, Round, Player, Event, EventType, EventTypeRevision],
  });
  await dataSource.initialize();
  await dataSource.synchronize();
  return dataSource;
};

/**
 * Setup a data source for in-memory postgres used by integration tests.
 * @param entities Pass your entities
 * @param withMigration If `true` the migrations are run, otherwise entity syncing is enabled.
 * @deprecated
 */
export const setupDataSource = async (entities: unknown[], withMigration = false) => {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database',
  });

  db.public.registerFunction({
    name: 'version',
    implementation: () => 'user',
  });

  db.public.registerFunction({
    name: 'obj_description',
    args: [DataType.text, DataType.text],
    returns: DataType.text,
    implementation: () => 'test',
  });

  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: v4,
      impure: true,
    });
  });

  const source = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    ...(withMigration ? {
      migrations: ['src/migration/*.ts']
    } : {}),
    entities,
  });

  await source.initialize();

  if (withMigration) {
    await source.runMigrations();
  } else {
    await source.synchronize();
  }

  return source;
};

export const truncateAllTables = async (source: DataSource) => {
  /**
   * We cannot use TRUNCATE because that leads to deadlock errors...
   * TODO: think about using https://github.com/node-ex/showcase--nx-nestjs--typeorm-postgresql--api-tests-with-testcontainers-db/blob/4c0e5ff6f986e9347b16bae481aca63f54d58a1a/apps/app-nest-1/jest/standalone/setupFilesAfterEnv/setupDatabaseConnection.ts#L58
   */
  await source.query(`DELETE FROM "finals"`);
  await source.query(`DELETE FROM "attendances"`);
  await source.query(`DELETE FROM "event"`);
  await source.query(`DELETE FROM "event_type_revision"`);
  await source.query(`DELETE FROM "event_type"`);
  await source.query(`DELETE FROM "round"`);
  await source.query(`DELETE FROM "game"`);
  await source.query(`DELETE FROM "player"`);
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TestData {
  function createBaseEntity(deleted = false): BaseEntity {
    return {
      id: RANDOM_UUID(),
      createDateTime: new Date(),
      lastChangedDateTime: new Date(),
      deletedDateTime: deleted ? new Date() : null,
    };
  }

  export function player(active: boolean = true, deleted: boolean = false): Player {
    return {
      ...createBaseEntity(deleted),
      name: 'John',
      active,
      auth0UserId: null,
      registered: new Date(),
      hostedGames: []
    };
  }

  export function activePlayer(): Player {
    return player();
  }

  export function inactivePlayer(): Player {
    return player(false);
  }

  export function deletedPlayer(): Player {
    return player(false, true);
  }

  export function game(): Game {
    return {
      ...createBaseEntity(false),
      datetime: new Date(),
      excludeFromStatistics: false,
      completed: false,
      placeType: PlaceType.AWAY,
      placeOfAwayGame: 'anywhere',
      events: [],
      hostedBy: null,
      rounds: [],
    };
  }

  export function round(): Round {
    return {
      ...createBaseEntity(false),
      datetime: new Date(),
      game: null,
      attendees: [],
      finalists: [],
      events: [],
    };
  }

  export function eventType(): EventType {
    return {
      ...createBaseEntity(false),
      description: 'some event',
      context: EventTypeContext.ROUND,
      hasComment: false,
      multiplicatorUnit: 'some unit',
      trigger: EventTypeTrigger.VERLOREN,
      penaltyValue: 0.5,
      penaltyUnit: PenaltyUnit.EURO,
      revisions: []
    };
  }

  export function eventTypeRevision(type: EventTypeRevisionType = EventTypeRevisionType.INSERT): EventTypeRevision {
    return {
      ...createBaseEntity(false),
      type,
      description: 'some event',
      context: EventTypeContext.ROUND,
      hasComment: false,
      multiplicatorUnit: 'some unit',
      trigger: EventTypeTrigger.VERLOREN,
      penaltyValue: 0.5,
      penaltyUnit: PenaltyUnit.EURO,
      eventType: null,
    };
  }

  export function gameEvent(): Event {
    return {
      ...createBaseEntity(false),
      datetime: new Date(),
      eventType: null,
      context: EventContext.GAME,
      game: null,
      round: null,
      player: null,
      comment: 'some comment',
      multiplicatorValue: 2,
      penaltyValue: 0.5,
      penaltyUnit: PenaltyUnit.EURO,
    };
  }

  export function roundEvent(): Event {
    return {
      ...createBaseEntity(false),
      datetime: new Date(),
      eventType: null,
      context: EventContext.ROUND,
      game: null,
      round: null,
      player: null,
      comment: 'some comment',
      multiplicatorValue: 2,
      penaltyValue: 0.5,
      penaltyUnit: PenaltyUnit.EURO,
    };
  }
}

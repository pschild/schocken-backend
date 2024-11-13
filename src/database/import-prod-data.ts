import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { EventTypeRevisionType } from '../event-type/enum/event-type-revision-type.enum';
import { EventTypeTrigger } from '../event-type/enum/event-type-trigger.enum';
import { EventContext } from '../event/enum/event-context.enum';
import { PlaceType } from '../game/enum/place-type.enum';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import * as importData from './import.json';

dotenv.config();

const seed = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: +process.env.DATABASE_PORT,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DB,
    schema: process.env.DATABASE_SCHEMA,
    entities: [Game, Round, Player, Event, EventType, EventTypeRevision],
  });

  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const ID_MAP = {};
  const PLAYER_NAME_MAP = [];
  const EVENT_TYPE_HISTORY_MAP = new Map<string, { validFrom: Date; penaltyValue: number; penaltyUnit: string }[]>();

  let rows, insertResults, mappingList;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importedRows = (importData as any).rows;

  console.log(`import-Datei ermittelt durch GET .../couchdb/schocken-remote-prod/_all_docs?include_docs=true`);
  console.log(`Stand der import-Datei: 02.11.2024`);
  console.log(`Importing event types...`);
  rows = importedRows.filter(row => row.id.startsWith('EVENT_TYPE__'));
  insertResults = rows.map(async row => {
    const insertResult = await queryRunner.manager.insert(EventType, mapToEventType(row));

    const historyList = row.doc.history
      .map(historyItem => ({ validFrom: new Date(historyItem.validFrom), penaltyValue: historyItem.eventType.penalty?.value, penaltyUnit: historyItem.eventType.penalty?.unit }))
      .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime()); // neuster Eintrag steht oben!
    EVENT_TYPE_HISTORY_MAP.set(insertResult.identifiers[0].id, historyList);

    return { [row.id]: insertResult.identifiers[0].id };
  });
  mappingList = await Promise.all(insertResults);
  console.log(`Created ${mappingList.length} event types!`);
  mappingList.map(i => Object.assign(ID_MAP, i));

  console.log(`Importing event type revisions...`);
  rows = importedRows.filter(row => row.id.startsWith('EVENT_TYPE__'));
  const promises = rows.map(async row => {
    const historyList = row.doc.history
      .sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime()); // neuster Eintrag steht oben!
    const insert = queryRunner.manager.insert(EventTypeRevision, mapToEventTypeRevision(row, historyList.pop(), EventTypeRevisionType.INSERT, ID_MAP));
    const updates = historyList.map(async historyItem => {
      return queryRunner.manager.insert(EventTypeRevision, mapToEventTypeRevision(row, historyItem, EventTypeRevisionType.UPDATE, ID_MAP));
    });
    return [insert, ...updates];
  });
  const result = await Promise.all(promises);
  console.log(`Created ${result.length} event type revisions!`);

  console.log(`Importing players...`);
  rows = importedRows.filter(row => row.id.startsWith('PLAYER__'));
  insertResults = rows.map(async row => {
    const insertResult = await queryRunner.manager.insert(Player, mapToPlayer(row));
    PLAYER_NAME_MAP.push({ id: insertResult.identifiers[0].id, name: row.doc.name });
    return { [row.id]: insertResult.identifiers[0].id };
  });
  mappingList = await Promise.all(insertResults);
  console.log(`Created ${mappingList.length} players!`);
  mappingList.map(i => Object.assign(ID_MAP, i));

  console.log(`Importing games...`);
  rows = importedRows.filter(row => row.id.startsWith('GAME__'));
  insertResults = rows.map(async row => {
    const insertResult = await queryRunner.manager.insert(Game, mapToGame(row, PLAYER_NAME_MAP));
    return { [row.id]: insertResult.identifiers[0].id };
  });
  mappingList = await Promise.all(insertResults);
  console.log(`Created ${mappingList.length} games!`);
  mappingList.map(i => Object.assign(ID_MAP, i));

  console.log(`Importing game events...`);
  rows = importedRows.filter(row => row.id.startsWith('GAME_EVENT__'));
  insertResults = rows.map(async row => {
    const insertResult = await queryRunner.manager.insert(Event, mapToEvent(row, EventContext.GAME, ID_MAP, EVENT_TYPE_HISTORY_MAP));
    return { [row.id]: insertResult.identifiers[0].id };
  });
  mappingList = await Promise.all(insertResults);
  console.log(`Created ${mappingList.length} game events!`);
  mappingList.map(i => Object.assign(ID_MAP, i));

  console.log(`Importing rounds, attendances and finals...`);
  rows = importedRows.filter(row => row.id.startsWith('ROUND__'))/*.slice(0, 5)*/;
  insertResults = rows.map(async row => {
    const insertResult = await queryRunner.manager.save(Round, mapToRound(row, ID_MAP));
    return { [row.id]: insertResult.id };
  });
  mappingList = await Promise.all(insertResults);
  console.log(`Created ${mappingList.length} rounds!`);
  mappingList.map(i => Object.assign(ID_MAP, i));

  console.log(`Importing round events...`);
  rows = importedRows.filter(row => row.id.startsWith('ROUND_EVENT__'));
  insertResults = rows.map(async row => {
    const insertResult = await queryRunner.manager.insert(Event, mapToEvent(row, EventContext.ROUND, ID_MAP, EVENT_TYPE_HISTORY_MAP));
    return { [row.id]: insertResult.identifiers[0].id };
  });
  mappingList = await Promise.all(insertResults);
  console.log(`Created ${mappingList.length} round events!`);
  mappingList.map(i => Object.assign(ID_MAP, i));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToEventType(raw: any): Partial<EventType> {
  return {
    createDateTime: raw.doc.history[raw.doc.history.length - 1].validFrom,
    lastChangedDateTime: raw.doc.history[0].validFrom,
    description: raw.doc.description,
    context: raw.doc.context,
    multiplicatorUnit: raw.doc.multiplicatorUnit,
    trigger: mapToTriggerEnum(raw.doc.trigger),
    hasComment: raw.doc.hasComment,
    penaltyValue: raw.doc.penalty?.value,
    penaltyUnit: mapToPenaltyUnitEnum(raw.doc.penalty?.unit),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToEventTypeRevision(raw: any, historyItem: any, type: EventTypeRevisionType, idMap: { [id: string]: string }): Partial<EventTypeRevision> {
  return {
    type,
    eventType: { id: idMap[raw.id] } as EventType,
    createDateTime: historyItem.validFrom,
    lastChangedDateTime: historyItem.validFrom,
    description: historyItem.eventType.description,
    context: historyItem.eventType.context,
    multiplicatorUnit: historyItem.eventType.multiplicatorUnit,
    trigger: mapToTriggerEnum(historyItem.eventType.trigger),
    hasComment: historyItem.eventType.hasComment,
    penaltyValue: historyItem.eventType.penalty?.value,
    penaltyUnit: mapToPenaltyUnitEnum(historyItem.eventType.penalty?.unit),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToPlayer(raw: any): Partial<Player> {
  return {
    createDateTime: raw.doc.registered,
    lastChangedDateTime: raw.doc.registered,
    name: raw.doc.name,
    active: raw.doc.active,
    registered: raw.doc.registered,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToGame(raw: any, playerNameMap: { id: string, name: string }[]): Partial<Game> {
  const placeType = mapToPlaceType(raw.doc.place);
  const hostId = playerNameMap.find(i => i.name === raw.doc.place)?.id;
  if (placeType === PlaceType.HOME && !hostId) {
    console.warn(`No hostId found!`);
  }
  if (placeType === PlaceType.AWAY && !raw.doc.placeDetail) {
    console.warn(`No placeDetail found!`);
  }

  return {
    createDateTime: raw.doc.datetime,
    lastChangedDateTime: raw.doc.datetime,
    datetime: raw.doc.datetime,
    completed: raw.doc.completed,
    placeType,
    placeOfAwayGame: placeType === PlaceType.AWAY ? raw.doc.placeDetail : null,
    hostedBy: placeType === PlaceType.HOME ? { id: hostId } as Player : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToEvent(raw: any, context: EventContext, idMap: { [id: string]: string }, eventTypeHistory: Map<string, { validFrom: Date; penaltyValue: number; penaltyUnit: string }[]>): Partial<Event> {
  const { penaltyValue, penaltyUnit } = getPenaltyValidAt(new Date(raw.doc.datetime), eventTypeHistory.get(idMap[raw.doc.eventTypeId]));

  return {
    createDateTime: raw.doc.datetime,
    lastChangedDateTime: raw.doc.datetime,
    context,
    datetime: raw.doc.datetime,
    comment: raw.doc.comment || null,
    multiplicatorValue: raw.doc.multiplicatorValue,
    game: context === EventContext.GAME ? { id: idMap[raw.doc.gameId] } as Game : null,
    round: context === EventContext.ROUND ? { id: idMap[raw.doc.roundId] } as Round : null,
    player: { id: idMap[raw.doc.playerId] } as Player,
    eventType: { id: idMap[raw.doc.eventTypeId] } as EventType,
    penaltyValue,
    penaltyUnit: mapToPenaltyUnitEnum(penaltyUnit),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToRound(raw: any, idMap: { [id: string]: string }): Partial<Round> {
  return {
    createDateTime: raw.doc.datetime,
    lastChangedDateTime: raw.doc.datetime,
    datetime: raw.doc.datetime,
    game: { id: idMap[raw.doc.gameId] } as Game,
    attendees: raw.doc.attendeeList ? raw.doc.attendeeList.map(item => ({ id: idMap[item.playerId] })) : [],
    finalists: raw.doc.finalistIds ? raw.doc.finalistIds.map(id => ({ id: idMap[id] })) : [],
  };
}

function getPenaltyValidAt(date: Date, historyItems: { validFrom: Date; penaltyValue: number; penaltyUnit: string }[]): { penaltyValue: number; penaltyUnit: string } {
  for (const historyItem of historyItems) {
    if (date.getTime() >= historyItem.validFrom.getTime()) {
      return { penaltyValue: historyItem.penaltyValue, penaltyUnit: historyItem.penaltyUnit };
    }
  }
  throw new Error('no valid history item found!');
}

function mapToPlaceType(raw: string): PlaceType {
  switch (raw) {
    case 'Auswärts':
      return PlaceType.AWAY;
    case 'Remote':
      return PlaceType.REMOTE;
    default:
      return PlaceType.HOME;
  }
}

function mapToTriggerEnum(raw: string): EventTypeTrigger {
  switch (raw) {
    case 'START_NEW_ROUND':
      return EventTypeTrigger.START_NEW_ROUND;
    case 'SCHOCK_AUS':
      return EventTypeTrigger.SCHOCK_AUS;
    case 'SCHOCK_AUS_PENALTY':
      return EventTypeTrigger.SCHOCK_AUS_PENALTY;
    default:
      return null;
  }
}

function mapToPenaltyUnitEnum(raw: string): PenaltyUnit {
  switch (raw) {
    case '€':
      return PenaltyUnit.EURO;
    case 'Kiste(n)':
      return PenaltyUnit.BEER_CRATE;
    default:
      return null;
  }
}

seed()
  .then(() => console.log('Success'))
  .catch(err => console.error('Error', err));

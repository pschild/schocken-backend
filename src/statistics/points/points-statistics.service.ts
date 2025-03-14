import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { groupBy, orderBy } from 'lodash';
import { DataSource } from 'typeorm';
import { Cached } from '../../decorator/cached.decorator';
import { EventTypeTrigger } from '../../event-type/enum/event-type-trigger.enum';
import { AccumulatedPointsPerGameDto, PointsPerGameDto } from '../dto';
import { EventTypesStatisticsService } from '../event-types/event-types-statistics.service';
import { GameStatisticsService } from '../game/game-statistics.service';
import { PlayerStatisticsService } from '../player/player-statistics.service';
import { addRanking, findPropertyById } from '../statistics.utils';
import { calculateBonusPoints, calculateRoundPoints, calculatePenaltyPoints, calculatePoints } from './points.utils';

@Injectable()
export class PointsStatisticsService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    private playerStatisticsService: PlayerStatisticsService,
    private eventTypesStatisticsService: EventTypesStatisticsService,
    private gameStatisticsService: GameStatisticsService,
  ) {
  }

  @Cached()
  async getDataForPointsCalculation(gameIds: string[]): Promise<{
    gameId: string;
    roundId: string;
    roundHasFinal: boolean;
    roundHasSchockAus: boolean;
    playerId: string;
    isFinalist: boolean;
    lustwurfCount: number;
    zweiZweiEinsCount: number;
    schockAusCount: number;
    hasVerloren: boolean;
  }[]> {
    if (gameIds.length === 0) {
      return Promise.resolve([]);
    }
    const eventTypes = await this.eventTypesStatisticsService.eventTypes();
    const schockAusId = eventTypes.find(t => t.trigger === EventTypeTrigger.SCHOCK_AUS).id;
    const zweiZweiEinsId = eventTypes.find(t => t.trigger === EventTypeTrigger.ZWEI_ZWEI_EINS).id;
    const lustwurfId = eventTypes.find(t => t.trigger === EventTypeTrigger.LUSTWURF).id;
    const verlorenId = eventTypes.find(t => t.trigger === EventTypeTrigger.VERLOREN).id;

    const result = await this.dataSource.query(`
        select
            game.id as "gameId",
            round.id as "roundId",
            exists(
                select 1
                from finals
                where "roundId" = round.id
            ) as "roundHasFinal",
            exists(
                select 1
                from event
                where "roundId" = att."roundId"
                and "eventTypeId" = '${schockAusId}'
            ) as "roundHasSchockAus",
            att."playerId",
            exists(
                select 1
                from finals
                where "roundId" = round.id
                  and "playerId" = att."playerId"
            ) as "isFinalist",
            (
                select count(*)
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${lustwurfId}'
            ) as "lustwurfCount",
            (
                select count(*)
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${zweiZweiEinsId}'
            ) as "zweiZweiEinsCount",
            (
                select count(*)
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${schockAusId}'
            ) as "schockAusCount",
            exists(
                select 1
                from event
                where "playerId" = att."playerId"
                  and "roundId" = att."roundId"
                  and "eventTypeId" = '${verlorenId}'
            ) as "hasVerloren"
        from game
        left join round on game.id = round."gameId"
        left join attendances att on round.id = att."roundId"
        where game.id IN (${gameIds.map(id => `'${id}'`).join(',')})
        order by round.datetime
    `);

    return result.map(row => ({
      ...row,
      zweiZweiEinsCount: +row.zweiZweiEinsCount,
      lustwurfCount: +row.lustwurfCount,
      schockAusCount: +row.schockAusCount,
    }));
  }

  @Cached()
  async pointsPerGame(gameIds: string[], onlyActivePlayers: boolean): Promise<PointsPerGameDto[]> {
    const pkteInfo = await this.getDataForPointsCalculation(gameIds);
    const playerIds = await this.playerStatisticsService.playerIds(onlyActivePlayers);
    const players = await this.playerStatisticsService.players(onlyActivePlayers);
    const games = await this.gameStatisticsService.games(gameIds);

    const groupedByGameId = groupBy(pkteInfo, 'gameId');
    return Object.entries(groupedByGameId).map(([gameId, itemsByGameId]) => {
      const groupedByPlayerId = groupBy(itemsByGameId, 'playerId');
      const pointsByAttendee = Object.entries(groupedByPlayerId).map(([playerId, itemsByPlayerId]) => {
        const { roundPoints, bonusPoints, penaltyPoints, gamePoints } = itemsByPlayerId.map(item => {
          const roundPoints = calculateRoundPoints(item.roundHasFinal, item.roundHasSchockAus, item.isFinalist, item.hasVerloren, item.schockAusCount > 0);
          const bonusPoints = calculateBonusPoints(item.schockAusCount);
          const penaltyPoints = calculatePenaltyPoints(item.hasVerloren, item.lustwurfCount, item.zweiZweiEinsCount);
          return {
            roundPoints,
            bonusPoints,
            penaltyPoints,
            gamePoints: roundPoints + bonusPoints + penaltyPoints,
          }
        })
          .reduce((prev, curr) => {
            return {
              roundPoints: prev.roundPoints + curr.roundPoints,
              bonusPoints: prev.bonusPoints + curr.bonusPoints,
              penaltyPoints: prev.penaltyPoints + curr.penaltyPoints,
              gamePoints: prev.gamePoints + curr.gamePoints,
            }
          });

        return {
          playerId,
          name: findPropertyById(players, playerId, 'name'),
          attended: true,
          roundPoints,
          bonusPoints,
          penaltyPoints,
          gamePoints,
          points: undefined, // calculated in next step
        };
      });

      // add players who did not attend, in order to always show all players in table!
      pointsByAttendee.push(
        ...playerIds
          .filter(id => !pointsByAttendee.find(i => i.playerId === id))
          .map(id => ({
            playerId: id,
            name: findPropertyById(players, id, 'name'),
            attended: false,
            roundPoints: 0,
            bonusPoints: 0,
            penaltyPoints: 0,
            gamePoints: 0,
            points: undefined, // calculated in next step
          }))
      );

      const pointsByAttendeeWithPoints = addRanking(
        pointsByAttendee,
        ['gamePoints', 'roundPoints', 'bonusPoints', 'penaltyPoints'],
        ['desc', 'desc', 'desc', 'asc']
      ).map(pointInfo => ({ ...pointInfo, points: calculatePoints(pointInfo.rank, pointInfo.attended) }));

      return {
        gameId,
        datetime: findPropertyById(games, gameId, 'datetime'),
        points: orderBy(pointsByAttendeeWithPoints, ['points', 'gamePoints', 'roundPoints', 'bonusPoints', 'penaltyPoints', 'name'], ['desc', 'desc', 'desc', 'desc', 'asc', 'asc'])
      };
    });
  }

  async accumulatedPoints(gameIds: string[], onlyActivePlayers: boolean): Promise<AccumulatedPointsPerGameDto[]> {
    const pointsPerGame = await this.pointsPerGame(gameIds, onlyActivePlayers);
    const accumulatedPointsPerGame = pointsPerGame.reduce((prev, curr) => {
      const lastGame = prev.length > 0 ? prev[prev.length - 1] : null;
      const accPoints = curr.points.map(({ playerId, name, roundPoints, bonusPoints, penaltyPoints, gamePoints, points }) => {
        return {
          playerId,
          name,
          roundPoints: roundPoints + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.roundPoints || 0 : 0),
          bonusPoints: bonusPoints + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.bonusPoints || 0 : 0),
          penaltyPoints: penaltyPoints + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.penaltyPoints || 0 : 0),
          gamePoints: gamePoints + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.gamePoints || 0 : 0),
          points: points + (lastGame ? lastGame.points.find(i => i.playerId === playerId)?.points || 0 : 0),
        };
      });
      return [
        ...prev,
        {
          ...curr,
          points: addRanking(accPoints, ['points', 'gamePoints', 'roundPoints', 'bonusPoints', 'penaltyPoints'], ['desc', 'desc', 'desc', 'desc', 'asc'])
        }
      ];
    }, []);

    return accumulatedPointsPerGame.reduce((prev, curr) => {
      const lastGame = prev.length > 0 ? prev[prev.length - 1] : null;
      if (!lastGame) {
        return [...prev, { ...curr, points: curr.points.map(item => ({ ...item, tendency: 0 })) }];
      }
      return [...prev, { ...curr, points: curr.points.map((item) => {
          const prevRank = lastGame.points.find(i => i.playerId === item.playerId)?.rank;
          return {...item, tendency: prevRank - item.rank };
        }) }];
    }, []);
  }

}

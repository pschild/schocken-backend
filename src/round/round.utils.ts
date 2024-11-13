import { EventTypeTrigger } from '../event-type/enum/event-type-trigger.enum';
import { Round } from '../model/round.entity';

export function getWarnings(round: Round): string[] {
  const warnings: string[] = [];

  const hasFinal = round.finalists?.length;
  const attendeeIds = (round.attendees || []).map(p => p.id);
  const finalistIds = (round.finalists || []).map(p => p.id);
  const notFinalistIds = attendeeIds.filter(id => !finalistIds.includes(id));
  const verlorenEvents = round.events?.length ? round.events.filter(e => e.eventType?.trigger === EventTypeTrigger.START_NEW_ROUND) : [];
  const schockAusEvents = round.events?.length ? round.events.filter(e => e.eventType?.trigger === EventTypeTrigger.SCHOCK_AUS) : [];
  const playerIdsWithSchockAus = schockAusEvents.map(e => e.player.id);
  const schockAusStrafeEvents = round.events?.length ? round.events.filter(e => e.eventType?.trigger === EventTypeTrigger.SCHOCK_AUS_PENALTY) : [];

  if (!round.attendees || !round.attendees.length) {
    warnings.push(`Die Runde hat keine Teilnehmer`);
  }

  if (!verlorenEvents.length) {
    warnings.push(`Die Runde hat keinen Verlierer`);
  }

  if (verlorenEvents.length > 1) {
    warnings.push(`Die Runde hat ${verlorenEvents.length} "Verloren"-Ereignisse`);
  }

  if (hasFinal && verlorenEvents[0] && notFinalistIds.includes(verlorenEvents[0].player.id)) {
    warnings.push(`Ein Spieler, der nicht im Finale ist, kann nicht verlieren`);
  }

  if (hasFinal && schockAusEvents.length && schockAusEvents.some(e => !finalistIds.includes(e.player.id))) {
    warnings.push(`Ein Spieler, der nicht im Finale ist, kann keinen Schock-Aus würfeln`);
  }

  if (schockAusEvents.length && !schockAusStrafeEvents.length) {
    warnings.push(`Es gibt ${schockAusEvents.length} Schock-Aus, aber keine Schock-Aus-Strafen`);
  }

  if (schockAusEvents.length > 1 && playerIdsWithSchockAus.length !== new Set(playerIdsWithSchockAus).size) {
    warnings.push(`Es gibt einen oder mehrere Spieler mit mehr als einem Schock-Aus`);
  }

  if (schockAusStrafeEvents.length && !schockAusEvents.length) {
    warnings.push(`Es gibt ${schockAusStrafeEvents.length} Schock-Aus-Strafe(n), aber keinen Schock-Aus`);
  }

  return warnings;
}

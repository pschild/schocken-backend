export function calculatePoints(rank: number): number {
  const POINTS_FOR_RANKS = [7, 5, 4, 3, 2];
  const POINTS_FOR_ATTENDANCE = 1;
  return POINTS_FOR_RANKS[rank - 1] || POINTS_FOR_ATTENDANCE;
}

/**
 * Punkteberechnung erfolgt nach folgendem Schema:
 *
 * Finale?
 * Ja
 * - Verlierer 0P
 * - alle Nicht-Finalisten 3P
 * - alle Finalisten, die nicht verloren haben 1P (egal ob Finale per SA beendet wurde oder nicht)
 *
 * Nein
 * - Verlierer 0P
 * - SA?
 *    Ja
 *    - alle Spieler mit SA 3P
 *    - alle anderen 1P
 *
 *    Nein (nur möglich bei "Verloren mit allen Deckeln")
 *    - alle anderen 3P
 */
export function calculateRoundPoints(
  roundHasFinal: boolean,
  roundHasSchockAus: boolean,
  isFinalist: boolean,
  isVerlierer: boolean,
  playerHasSchockAus: boolean
): number {
  if (isVerlierer) {
    return 0;
  } else if ((roundHasFinal && isFinalist) || (!roundHasFinal && roundHasSchockAus && !playerHasSchockAus)) {
    return 1;
  } else if ((roundHasFinal && !isVerlierer && !isFinalist) || (!roundHasFinal && !isVerlierer && playerHasSchockAus) || (!roundHasFinal && !isVerlierer && !roundHasSchockAus)) {
    return 3;
  } else {
    console.error(`Invalid combination of params: roundHasFinal=${roundHasFinal}, roundHasSchockAus=${roundHasSchockAus}, isFinalist=${isFinalist}, isVerlierer=${isVerlierer}, playerHasSchockAus=${playerHasSchockAus}`);
  }
}

export function calculateBonusPoints(schockAusCount: number): number {
  const SCHOCK_AUS_FACTOR = 1;
  return schockAusCount * SCHOCK_AUS_FACTOR;
}

export function calculatePenaltyPoints(
  isVerlierer: boolean,
  lustwurfCount: number,
  zweiZweiEinsCount: number
): number {
  const VERLOREN_FACTOR = 1;
  const ZWEI_ZWEI_EINS_FACTOR = 1;
  const LUSTWURF_FACTOR = 3;
  return (isVerlierer ? -1 * VERLOREN_FACTOR : 0) - (zweiZweiEinsCount * ZWEI_ZWEI_EINS_FACTOR) - (lustwurfCount * LUSTWURF_FACTOR);
}

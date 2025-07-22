import { addDays } from 'date-fns';

export function calculateDueDate(confirmed: boolean, outstandingValue: number, confirmedAt: Date): string {
  if (!confirmed || outstandingValue <= 0) {
    return null;
  }
  return addDays(confirmedAt, 14).toISOString();
}

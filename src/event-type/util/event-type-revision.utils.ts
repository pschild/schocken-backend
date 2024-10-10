import { compareDesc, isBefore, isEqual } from 'date-fns';
import { EventTypeRevision } from '../../model/event-type-revision.entity';

export function findValidAt(entities: EventTypeRevision[], date: Date): EventTypeRevision {
  const pastRevisions = entities
    .filter(entity => isBefore(entity.createDateTime, date) || isEqual(entity.createDateTime, date))
    .sort((a, b) => compareDesc(a.createDateTime, b.createDateTime)); // neuster Eintrag steht oben!
  return pastRevisions[0];
}

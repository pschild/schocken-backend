import { compareDesc, isBefore, isEqual } from 'date-fns';
import { EventTypeRevisionDto } from '../dto/event-type-revision.dto';

export function findValidAt(entities: EventTypeRevisionDto[], date: Date): EventTypeRevisionDto {
  const pastRevisions = entities
    .filter(entity => isBefore(entity.createDateTime, date) || isEqual(entity.createDateTime, date))
    .sort((a, b) => compareDesc(a.createDateTime, b.createDateTime)); // neuster Eintrag steht oben!
  return pastRevisions[0];
}

import { EventTypeRevisionDto } from '../dto/event-type-revision.dto';
import { findValidAt } from './event-type-revision.utils';

describe('EventTypeRevisionUtils', () => {

  describe('should find the valid revision', () => {
    it('if list of revisions is empty', () => {
      const revisions = [];
      expect(findValidAt(revisions, new Date())).toBeUndefined();
    });

    it('in an unordered list of revisions', () => {
      const revisions = [
        { createDateTime: new Date('2020-01-01').toISOString() },
        { createDateTime: new Date('2020-01-05').toISOString() },
        { createDateTime: new Date('2020-01-03').toISOString() },
        { createDateTime: new Date('2020-01-07').toISOString() },
      ] as EventTypeRevisionDto[];

      expect(findValidAt(revisions, new Date('2020-01-04')).createDateTime).toEqual(new Date('2020-01-03').toISOString());
      expect(findValidAt(revisions, new Date('2020-01-06')).createDateTime).toEqual(new Date('2020-01-05').toISOString());
      expect(findValidAt(revisions, new Date('2020-01-07')).createDateTime).toEqual(new Date('2020-01-07').toISOString());
      expect(findValidAt(revisions, new Date('2020-01-10')).createDateTime).toEqual(new Date('2020-01-07').toISOString());
      expect(findValidAt(revisions, new Date('2019-12-31'))).toBeUndefined();
    });
  });
});

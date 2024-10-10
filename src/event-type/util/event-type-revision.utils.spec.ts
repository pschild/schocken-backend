import { EventTypeRevision } from '../../model/event-type-revision.entity';
import { findValidAt } from './event-type-revision.utils';

describe('EventTypeRevisionUtils', () => {

  describe('should find the valid revision', () => {
    it('if list of revisions is empty', () => {
      const revisions = [];
      expect(findValidAt(revisions, new Date())).toBeUndefined();
    });

    it('in an unordered list of revisions', () => {
      const revisions = [
        { createDateTime: new Date('2020-01-01') },
        { createDateTime: new Date('2020-01-05') },
        { createDateTime: new Date('2020-01-03') },
        { createDateTime: new Date('2020-01-07') },
      ] as EventTypeRevision[];

      expect(findValidAt(revisions, new Date('2020-01-04')).createDateTime.toISOString()).toEqual(new Date('2020-01-03').toISOString());
      expect(findValidAt(revisions, new Date('2020-01-06')).createDateTime.toISOString()).toEqual(new Date('2020-01-05').toISOString());
      expect(findValidAt(revisions, new Date('2020-01-07')).createDateTime.toISOString()).toEqual(new Date('2020-01-07').toISOString());
      expect(findValidAt(revisions, new Date('2020-01-10')).createDateTime.toISOString()).toEqual(new Date('2020-01-07').toISOString());
      expect(findValidAt(revisions, new Date('2019-12-31'))).toBeUndefined();
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const ensureExistence = () => (source$: Observable<unknown>): Observable<unknown> => {
  return source$.pipe(
    map(data => {
      if (!data) {
        throw new NotFoundException();
      }
      return data;
    })
  );
};

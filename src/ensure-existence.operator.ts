import { NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const ensureExistence = <T>() => (source$: Observable<T>): Observable<T> => {
  return source$.pipe(
    map(data => {
      if (!data) {
        throw new NotFoundException();
      }
      return data;
    })
  );
};

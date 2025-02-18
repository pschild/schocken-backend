import { memoizeAsync } from 'utils-decorators';

/**
 * Wrapper decorator for @memoizeAsync to disable caching during tests.
 */
export const Cached = (ms: number = 5000) => {
  return process.env.NODE_ENV === 'test' ? () => {} : memoizeAsync(ms);
};

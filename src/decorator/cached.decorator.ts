/**
 * Based on https://github.com/vlio20/utils-decorators/blob/master/src/memoize-async/memoize-asyncify.ts
 */
export const MemoizeWithCacheManager = (ms: number = 5000) => {
  return function(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    if (process.env.NODE_ENV === 'test') {
      return descriptor;
    }

    const originalMethod = descriptor.value;
    const runningPromises = new Map<string, Promise<unknown>>();

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      if (!this.cacheManager) {
        throw new Error('Class must inject CacheManager!');
      }

      const key = `${propertyKey}:${args.join(',')}`;

      if (runningPromises.has(key)) {
        return runningPromises.get(key);
      }

      const promise = new Promise(async (resolve, reject) => {
        const resultFromCache = await this.cacheManager.get(key);
        if (resultFromCache !== null) {
          resolve(resultFromCache);
        } else {
          try {
            const result = await originalMethod.apply(this, args);
            await this.cacheManager.set(key, result, ms);

            resolve(result);
          } catch (e) {
            reject(e);
          }
        }

        runningPromises.delete(key);
      });

      runningPromises.set(key, promise);

      return promise;
    }

    return descriptor;
  };
};

export const DEFAULT_CACHE_TIMEOUT = 30;
export const DEFAULT_RENEW_TIMEOUT = 0;
export const DEFAULT_KEY_PREFIX = 'cache_';

const MAX_CACHE_TIMEOUT = 604800; // 7 days

const promisify = func => new Promise((resolve, reject) => {
  func((err, result) => {
    if (err) {
      return reject(err);
    }
    resolve(result);
  });
});

const cacheService = (
  redisClient,
  cachePrefix = DEFAULT_KEY_PREFIX,
  defaultTimeout = DEFAULT_CACHE_TIMEOUT,
  renewTimeout = DEFAULT_RENEW_TIMEOUT
) => {
  const cacheServiceInstance = {
    set: (key, data, timeout) => promisify(cb => {
      const multi = redisClient.multi();
      multi.set(key, JSON.stringify(data));
      multi.set(`${key}_renewAt`, renewTimeout && parseInt((Date.now() / 1000) + renewTimeout));
      multi.expire(key, timeout && timeout < MAX_CACHE_TIMEOUT ? timeout : MAX_CACHE_TIMEOUT);

      multi.exec(cb);
    }),
    get: key => promisify(cb => {
      const multi = redisClient.multi();
      multi.get(key);
      multi.get(`${key}_renewAt`);

      multi.exec(cb);
    })
      .then(([value, renewAt]) => {
        try {
          value = JSON.parse(value);
        } catch (error) {
          console.log('Parsing JSON failed');
          value = null;
        }

        return [value, renewAt];
      }),
    cache: async(cacheKey, executor, timeout = defaultTimeout) => {
      const key = `${cachePrefix}${cacheKey}`;

      const [cachedData, renewAt] = await cacheServiceInstance.get(key);
      if (!cachedData) {
        const newData = await executor();
        cacheServiceInstance.set(key, newData, timeout);

        console.log(`Returned values from executor for key ${key}`);
        return newData;
      }
      if (renewAt < (Date.now() / 1000)) {
        try {
          const renewalData = await executor();
          cacheServiceInstance.set(key, renewalData, timeout);

          console.log(`Returned values from executor and renewed cache for key ${key}`);
          return renewalData;
        } catch (error) {
          console.log(`Cache renewal for key ${key} failed`);
        }
      }

      console.log(`Returned values from cache for key ${key}`);
      return cachedData;
    },
  };

  return cacheServiceInstance;
};

export default cacheService;

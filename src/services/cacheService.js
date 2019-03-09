const DEFAULT_CACHE_TIMEOUT = 30;
const DEFAULT_KEY_PREFIX = 'cache_';

const promisify = func => new Promise((resolve, reject) => {
  func((err, result) => {
    if (err) {
      return reject(err);
    }
    resolve(result);
  });
});

const cacheService = (redisClient, cachePrefix = DEFAULT_KEY_PREFIX, defaultTimeout = DEFAULT_CACHE_TIMEOUT) => {

  const cacheServiceInstance = {
    set: (key, data, timeout) => promisify(cb => {
      const multi = redisClient.multi();
      multi.set(key, JSON.stringify(data));
      multi.expire(key, timeout);

      multi.exec(cb);
    }),
    get: key => redisClient.getAsync(key).then(result => {
      try {
        return JSON.parse(result);
      } catch (error) {
        console.log('Parsing JSON failed');
        return null;
      }
    }),
    cache: async(cacheKey, executor, timeout = defaultTimeout) => {
      console.log('Cache requested', cacheKey);
      const key = `${cachePrefix}${cacheKey}`;
      return cacheServiceInstance.get(key)
        .then(results => {
          console.log('Values from cache', results);
          if (!results) {
            return executor()
              .then(results => {
                console.log('Values from executor', results);
                cacheServiceInstance.set(key, results, timeout);

                return results;
              });
          }
          return results;
        });
    },
  };

  return cacheServiceInstance;
};

export default cacheService;

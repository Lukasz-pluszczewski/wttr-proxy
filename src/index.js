import config from './config';
import routes from 'routes';
import errorHandlers from 'errorHandlers';

import createRedis from './services/redisService';
import createCache from './services/cacheService';
import createWttr from './services/wttrService';
import simpleExpress from './services/simpleExpress/simpleExpress';

(async() => {
  const redis = await createRedis();
  const weatherCache = await createCache(redis, 'weather_cache_', config.weatherCacheTTL, config.weatherCacheUpdateTimeout);
  const wttr = await createWttr();

  await simpleExpress({
    port: config.port,
    routes,
    errorHandlers,
    globalMiddlewares: [],
    routeParams: { wttr, redis, weatherCache },
  })
    .then(({ app }) => console.log(`Started on port ${app.server.address().port}`))
    .catch(error => console.error('Error', error));
})();

import config from './config';
import routes from 'routes';

import createRedis from './services/redisService';
import createCache from './services/cacheService';
import createWttr from './services/wttrService';
import simpleExpress from './services/simpleExpress/simpleExpress';

(async() => {
  const redis = await createRedis();
  const cache = await createCache(redis);
  const wttr = await createWttr();

  await simpleExpress({
    port: config.port,
    routes,
    globalMiddlewares: [],
    routeParams: { wttr, redis, cache },
  })
    .then(({ app }) => console.log(`Started on port ${app.server.address().port}`))
    .catch(error => console.error('Error', error));
})();

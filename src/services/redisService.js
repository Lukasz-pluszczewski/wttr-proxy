import redis from 'redis';
import { promisify } from 'util';

import config from '../config';

const promisifiedMethods = [
  'get',
  'set',
  'expire',
];

const redisService = () => {
  const client = redis.createClient({
    host: config.redisHost,
  });

  promisifiedMethods.forEach(method => client[`${method}Async`] = promisify(client[method]).bind(client));

  return client;
};

export default redisService;

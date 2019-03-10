const config = {
  port: process.env.PORT || 8080,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: process.env.REDIS_PORT || 6379,
  weatherCacheTTL: process.env.WEATHER_CACHE_TTL || 3600,
  weatherCacheUpdateTimeout: process.env.WEATHER_CACHE_UPDATE_TIMEOUT || 60,
};

export default config;

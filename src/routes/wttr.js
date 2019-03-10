const wttrRoutes = [
  {
    path: '/favicon.ico',
    handlers: {
      get: () => ({
        status: 404,
        body: { message: 'No favicons here. Use postman.' },
      }),
    },
  },
  {
    path: '/:city',
    handlers: {
      get: async({ body, query, params, originalUrl, protocol, xhr, get, req, wttr, weatherCache }) => {
        const city = encodeURI(params.city);

        const results = await weatherCache.cache(
          `weather_${city}`,
          () => console.log('executing...', originalUrl) || wttr.getWeather(city)
        );

        return {
          format: 'send',
          body: results,
        };
      },
    },
  },
];

export default wttrRoutes;

const healthRoutes = [
  {
    path: '*',
    handlers: {
      get: ({ body, query, params, originalUrl, protocol, xhr, get, req }) => {

        return {
          body: {
            message: 'Route not defined.',
            body,
            query,
            params,
            originalUrl,
            protocol,
            xhr,
          },
        };
      },
    },
  },
];

export default healthRoutes;

const healthRoutes = [
  {
    path: '*',
    handlers: {
      get: () => ({
        status: 404,
        body: {
          message: 'Location not provided',
        },
      }),
    },
  },
];

export default healthRoutes;

import NotFound from '../errors/NotFound';

const notFoundErrorHandlers = [
  async(error, { next }) => {
    if (error instanceof NotFound) {
      console.error(error.details);
      return {
        status: 404,
        body: { message: error.publicMessage },
      };
    }
    next(error);
  },
];

export default notFoundErrorHandlers;

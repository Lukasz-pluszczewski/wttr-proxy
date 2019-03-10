const notFoundErrorHandlers = [
  async(error) => {
    console.error('Unknown error', error);
    return {
      status: 500,
      body: { message: error.publicMessage || 'Unknown error' },
    };
  },
];

export default notFoundErrorHandlers;

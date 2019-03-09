const checkPassword = password => ({ next, getHeader }) => {
  if (getHeader('authentication') === password || !password) {
    return next();
  }
  return {
    status: 401,
    body: { message: 'Password incorrect' },
  };
};

export default checkPassword;

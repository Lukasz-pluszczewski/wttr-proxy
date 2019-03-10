import wttr from './wttr';
import notFound from './404';

const routes = [
  ...wttr,
  ...notFound,
];

export default routes;

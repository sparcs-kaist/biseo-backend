import connectRedis from 'connect-redis';
import express from 'express';
import { createServer } from 'http';
import morgan from 'morgan';
import { redis } from './database/redis-instance';
import session from 'express-session';
import { corsMiddleware } from './middlewares';
import routes from './routes';
import attachSocket from './socket';
import logger from './utils/logger';

// initialize and run http server
const app = express();
const RedisStore = connectRedis(session);
const redisClient = redis.getConnection();
const morganFormat =
  process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
if (process.env.NODE_ENV === 'development') app.use(corsMiddleware);

app.use(morgan(morganFormat, { stream: { write: msg => logger.info(msg) } }));
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET ?? 'keyboard cat',
    store: new RedisStore({
      client: redisClient,
    }),
    cookie: { maxAge: 60000 },
  })
);
redisClient.del('accessors', (err, _) => {
  if (err) {
    console.error(err);
  }
});
redisClient.del('memberStates', (err, _) => {
  if (err) {
    console.error(err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', routes);

const server = createServer(app);
attachSocket(server);

export default server;

import connectRedis from 'connect-redis';
import express from 'express';
import { createServer } from 'http';
import morgan from 'morgan';
import { redis } from './socket/mock/redis_instance';
import session from 'express-session';
import { corsMiddleware } from './middlewares';
import routes from './routes';
import attachSocket from './socket';

// initialize and run http server
const app = express();
const RedisStore = connectRedis(session);

if (process.env.NODE_ENV === 'development') app.use(corsMiddleware);

app.use(morgan('dev'));
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET ?? 'keyboard cat',
    store: new RedisStore({
      client: redis.getConnection(),
    }),
    cookie: { maxAge: 60000 },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', routes);

const server = createServer(app);
attachSocket(server);

export default server;

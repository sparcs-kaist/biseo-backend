import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import morgan from 'morgan';
import Redis from 'ioredis';
import session from 'express-session';
import routes from './routes';
import attachSocket from './socket';

// initialize and run http server
const app = express();

const RedisStore = connectRedis(session);
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
const redisClient = new Redis({
  port: REDIS_PORT,
  host: REDIS_HOST,
});

app.use(morgan('dev'));
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
app.use(
  cors({
    origin: process.env.ALLOWED_HOST,
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', routes);

const server = createServer(app);
attachSocket(server);

export default server;

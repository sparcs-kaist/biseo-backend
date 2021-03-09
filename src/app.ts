import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';
import Redis from 'ioredis';
import session from 'express-session';
import routes from './routes';
import attachSocket from './socket';

// initialize and run http server
const app = express();

const RedisStore = connectRedis(session);
const REDIS_PORT = Number(process.env.REDIS_PORT) || 0;
const redisClient = new Redis(REDIS_PORT);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error!'));
db.once('open', () => console.log('Connected to MongoDB'));
mongoose.connect('mongodb://localhost/biseo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
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

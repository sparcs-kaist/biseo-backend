import './config';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import Redis from 'ioredis';
import session from 'express-session';
import routes from './routes';
import socketServer from './socket';

// initialize and run http server
const app = express();
const RedisStore = connectRedis(session);
const redisClient = new Redis(3001);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error!'));
db.once('open', () => console.log('Connected to MongoDB'));
mongoose.connect('mongodb://localhost/biseo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

app.set('port', 3000);

app.use(morgan('dev'));
app.use(
    session({
        resave: false,
        saveUninitialized: true,
        secret: process.env.REDIS_SECRET,
        store: new RedisStore({
            client: redisClient
        }),
        cookie: { maxAge: 60000 }
    })
);
app.use(
    cors({
        origin: process.env.ALLOWED_HOST,
        credentials: true
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', routes);

app.listen(app.get('port'), () => {
    console.log(`HTTP server running on port ${app.get('port')}...`);
});

socketServer.listen(3002, () => {
    console.log('Socket server running on port 3002...');
});

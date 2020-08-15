import express from "express";
import session from "express-session";
import Redis from "ioredis";
import cors from "cors";
import connectRedis from "connect-redis";

import routes from "./routes";

const app = express();
const socketApp = express();

const RedisStore = connectRedis(session);
const redisClient = new Redis(3001);
app.use(
    cors({
        origin: "http://kong.sparcs.org:7300",
        credentials: true,
    })
);
app.use(express.json());
app.use(express.static("public"));

app.use(
    session({
        resave: false,
        saveUninitialized: true,
        secret: process.env.REDIS_SECRET,
        store: new RedisStore({
            client: redisClient,
        }),
        cookie: { maxAge: 60000 },
    })
);

app.set("jwt-secret", process.env.JWT_SECRET);

app.get("/", (req, res) => {
    console.log("get /");
    res.sendFile("index.html");
});
app.use("/api", routes);

app.set("port", 3000);

export { app, socketApp };

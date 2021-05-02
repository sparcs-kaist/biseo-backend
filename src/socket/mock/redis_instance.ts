import ioRedis from 'ioredis';

class Redis {
  connected: boolean;
  client: any;
  constructor() {
    this.connected = false;
    this.client = null;
  }
  getConnection() {
    if (this.connected) return this.client;
    const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
    const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
    this.client = new ioRedis({
      port: REDIS_PORT,
      host: REDIS_HOST,
    });
    return this.client;
  }
}

const redis = new Redis();

export { redis };

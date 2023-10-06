import logger from './logging.js';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export const redisConnect = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Redis Error:', err);
  }
};

export const redisDisconnect = async () => {
  try {
    await redisClient.disconnect();
    logger.info('Redis disconnected');
  } catch (err) {
    logger.error('Redis Error:', err);
  }
};

redisClient.on('error', error => {
  logger.error('Redis Error:', error);
});

export default redisClient;
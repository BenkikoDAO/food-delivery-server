import logger from './logging.js';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export const redisConnect = async () => {
  try {
    await redisClient.connect();
    // clearRedisCache()
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

// export const clearRedisCache = async () => {
//   try {
//     const keys = await redisClient.keys('*'); // Retrieve all keys in the Redis cache
//     logger.info('Keys in Redis Cache:', keys);

//     for (const key of keys) {
//       await redisClient.del(key); // Delete the key
//       logger.info(`Key deleted: ${key}`);
//     }
//   } catch (error) {
//     logger.error('Error clearing Redis cache:', error);
//   }
// };

redisClient.on('error', error => {
  logger.error('Redis Error:', error);
});

export default redisClient;
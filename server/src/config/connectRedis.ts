import { createClient } from 'redis'
import { config } from 'dotenv'

config()
const redisClient = createClient({
  password: process.env.DB_REDIS_PASSWORD,
  socket: {
    host: process.env.DB_REDIS_HOST,
    port: parseInt(process.env.DB_REDIS_PORT as string)
  }
})

redisClient.on('error', (err) => console.log('Redis Client Error', err))

export const connectRedis = async () => {
  await redisClient.connect()
}

export default redisClient

export const startRedis = async () => {
  try {
    await connectRedis()
    console.log('Redis connected')
  } catch (error) {
    console.log('Redis connection error', error)
    process.exit(1)
  }
}

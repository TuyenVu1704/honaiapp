import { createClient, RedisClientType } from 'redis'
import { config } from 'dotenv'

config()
class CacheService {
  private static instance: CacheService
  private client: RedisClientType
  private constructor() {
    this.client = createClient({
      password: process.env.DB_REDIS_PASSWORD,
      socket: {
        host: process.env.DB_REDIS_HOST,
        port: parseInt(process.env.DB_REDIS_PORT as string)
      }
    })
    this.client.on('error', (err) => console.log('Redis Client Error', err))
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }
  // Connect to Redis
  public connectRedis = async () => {
    try {
      await this.client.connect()
      console.log('Redis connected')
    } catch (error) {
      console.log('Redis connection error', error)
      process.exit(1)
    }
  }
  public async set(key: string, value: any, options: { EX: number }): Promise<void> {
    await this.client.set(key, JSON.stringify(value), options)
  }
  public async get(key: string): Promise<any | null> {
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }
  public async del(key: string): Promise<void> {
    await this.client.del(key)
  }
}

export const redis = CacheService.getInstance()

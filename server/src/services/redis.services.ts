import Redis from 'ioredis'

class CacheService {
  private static instance: CacheService
  public client: Redis

  private constructor() {
    this.client = new Redis({
      host: process.env.DB_REDIS_HOST || 'localhost',
      port: parseInt(process.env.DB_REDIS_PORT || '6379'),
      password: process.env.DB_REDIS_PASSWORD,
      db: parseInt(process.env.DB_REDIS_DB || '0'),

      // Các tùy chọn kết nối
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,

      // Tùy chọn TLS nếu cần
      tls: process.env.DB_REDIS_TLS === 'true' ? {} : undefined
    })

    this.client.on('error', (err) => console.error('Redis Client Error', err))
    this.client.on('connect', () => console.log('Connected to Redis'))
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  public async set(key: string, value: any, expireTime: number = 3600): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', expireTime)
  }

  public async get(key: string): Promise<any | null> {
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  // Phương thức mới để xóa nhiều key cùng lúc
  public async delMultiple(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  // Phương thức mới để set nhiều key-value cùng lúc
  public async mset(keyValuePairs: { [key: string]: any }, expireTime: number = 3600): Promise<void> {
    const multi = this.client.multi()
    for (const [key, value] of Object.entries(keyValuePairs)) {
      multi.set(key, JSON.stringify(value), 'EX', expireTime)
    }
    await multi.exec()
  }

  // Phương thức mới để lấy nhiều key cùng lúc
  public async mget(keys: string[]): Promise<(any | null)[]> {
    const values = await this.client.mget(keys)
    return values.map((value) => (value ? JSON.parse(value) : null))
  }

  // Phương thức để kiểm tra xem một key có tồn tại không
  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  // Phương thức để set một giá trị chỉ khi key chưa tồn tại
  public async setNX(key: string, value: any, expireTime: number = 3600): Promise<boolean> {
    const result = await this.client.set(key, JSON.stringify(value), 'EX', expireTime, 'NX')
    return result === 'OK'
  }

  // Phương thức để tăng giá trị của một key
  public async increment(key: string, by: number = 1): Promise<number> {
    return this.client.incrby(key, by)
  }

  // Phương thức để giảm giá trị của một key
  public async decrement(key: string, by: number = 1): Promise<number> {
    return this.client.decrby(key, by)
  }
}

const cacheService = CacheService.getInstance()
export default cacheService

export const startRedis = async () => {
  try {
    await cacheService.client.ping()
    console.log('Redis is ready')
  } catch (error) {
    console.error('Redis is not ready')
  }
}

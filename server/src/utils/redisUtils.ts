import redisClient from '~/config/connectRedis'
import { loginUserResRedisType } from '~/middlewares/users.middlewares'

// Tạo cache cho user với key là email và giá trị là user object
export const cacheUser = async (email: string, user: loginUserResRedisType) => {
  await redisClient.set(`user:${email}`, JSON.stringify(user), {
    EX: 3600 // Cache expires in 1 hour
  })
}

// Lấy user từ cache với key là email
export const getCachedUser = async (email: string) => {
  const cachedUser = await redisClient.get(`user:${email}`)
  return cachedUser ? JSON.parse(cachedUser) : null
}

//update số lần đăng nhập thất bại cho email
export const updateLoginAttempts = async (email: string, attempts: number) => {
  await redisClient.set(`loginAttempts:${email}`, attempts.toString(), {
    EX: 3600 // Expires in 1 hour
  })
}

// Lấy số lần đăng nhập thất bại cho email
export const getLoginAttempts = async (email: string) => {
  const attempts = await redisClient.get(`loginAttempts:${email}`)
  return attempts ? parseInt(attempts, 10) : 0
}

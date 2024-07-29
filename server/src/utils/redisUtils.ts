import redisClient from '~/config/connectRedis'

// Tạo cache cho user với key là email và giá trị là user object
export const cacheUser = async (email: string, user: any) => {
  console.log('cache User')
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

// Xóa cache user với key là email
export const deleteCachedUser = async (email: string) => {
  console.log('delete cache User')
  await redisClient.del(`user:${email}`)
}

// Lấy số lần đăng nhập thất bại cho email
export const getLoginAttempts = async (email: string) => {
  const attempts = await redisClient.get(`loginAttempts:${email}`)
  return attempts ? parseInt(attempts, 10) : 0
}

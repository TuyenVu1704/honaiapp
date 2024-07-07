import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
config()

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUND))
  return await bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash)
}

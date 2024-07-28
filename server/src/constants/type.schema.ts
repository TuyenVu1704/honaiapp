import { Document, ObjectId } from 'mongoose'
import { Roles } from './enum'

export interface IUser extends Document {
  first_name: string
  last_name: string
  email: string
  phone: number
  password: string
  role: Roles
  permissions: string[]
  department: string[]
  position: string[]
  status: string
  email_verify_token: string
  email_verified: boolean
  reset_password_token: string
  password_reseted_at: Date[]
  avatar: string
  devices: Array<{ device_id: string; last_login: Date }>
  confirmToken: string
  loginAttempts: number
  locked: boolean
  isLocked: () => boolean
}

export interface IRefreshToken extends Document {
  user_id: ObjectId
  refresh_token: string
  created_at: Date
  updated_at: Date
}

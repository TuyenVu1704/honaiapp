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
  device: string[]
  status: string
  email_verify_token: string
  email_verified: boolean
  // actived_at: Date
  // deactivated_at: Date
  reset_password_token: string
  password_reseted_at: Date[]
  avatar: string[]
  cover: string[]
  // sessionId: string
  confirmToken: string
  loginAttempts: number
  locked: boolean
  isLocked: () => boolean
  isActive: () => boolean
}

export interface IRefreshToken extends Document {
  user_id: ObjectId
  refresh_token: string
  created_at: Date
  updated_at: Date
}

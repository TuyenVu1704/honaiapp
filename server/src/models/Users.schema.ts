import mongoose from 'mongoose'
import { Roles } from '~/constants/enum'

export interface IUser extends mongoose.Document {
  _id: string
  employee_code: string
  username: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  password: string
  role: Roles
  permissions: string[]
  department: string[]
  position: string[]
  status: string
  email_verify_token: string
  email_verified: boolean
  password_reseted_at: Date[]
  avatar: string
  loginAttempts: number
  locked: boolean
  isLocked: () => boolean
}

const Schema = mongoose.Schema
const UserSchema = new Schema<IUser>(
  {
    employee_code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    first_name: {
      type: String,
      required: true,
      index: true
    },
    last_name: {
      type: String,
      required: true,
      index: true
    },
    full_name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: Number,
      enum: [Roles.ADMIN, Roles.USER],
      default: Roles.USER
    },
    permissions: [
      {
        type: String
      }
    ],
    department: [
      {
        type: String
      }
    ],
    position: [
      {
        type: String
      }
    ],
    status: {
      type: String
    },
    email_verify_token: {
      type: String
    },
    email_verified: {
      type: Boolean,
      default: false
    },

    password_reseted_at: [
      {
        type: Date
      }
    ],
    avatar: {
      type: String,
      default: ''
    },
    loginAttempts: { type: Number, required: true, default: 0 },
    locked: {
      type: Boolean,
      default: false
    }
  },

  { timestamps: true }
)

// Kiểm tra xem tài khoản có đang bị khóa không
UserSchema.methods.isLocked = function () {
  return this.locked
}

const Users = mongoose.model('Users', UserSchema)

export default Users

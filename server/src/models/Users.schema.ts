import mongoose from 'mongoose'
import { IUser } from '~/constants/type'

const Schema = mongoose.Schema
const UserSchema = new Schema<IUser>(
  {
    first_name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: Number,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: 'user'
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
    device: [
      {
        type: String
      }
    ],
    status: {
      type: String
    },
    email_verify_token: {
      type: String,
      default: ''
    },
    email_verified: {
      type: Boolean,
      default: false
    },
    actived_at: {
      type: Date
    },
    deactivated_at: {
      type: Date
    },
    reset_password_token: {
      type: String,
      default: ''
    },
    password_reseted_at: [
      {
        type: Date
      }
    ],

    avatar: [
      {
        type: String
      }
    ],
    cover: [
      {
        type: String
      }
    ],
    loginAttempts: { type: Number, required: true, default: 0 },
    locked: {
      type: Boolean,
      default: false
    },
    created_at: Date,
    updated_at: Date
  },
  { timestamps: true }
)

// Kiểm tra xem tài khoản có đang bị khóa không
UserSchema.methods.isLocked = function () {
  return this.locked
}

const Users = mongoose.model('Users', UserSchema)

export default Users

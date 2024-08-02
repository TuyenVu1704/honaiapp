import mongoose from 'mongoose'
import { Roles } from '~/constants/enum'

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId
  id: string
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
  email_verify_device_token: string
  password_reseted_at: Date[]
  avatar: string
  loginAttempts: {
    times: string[]
    count: number
  }
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
    email_verify_device_token: {
      type: String
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
    loginAttempts: {
      count: { type: Number, default: 0 },
      times: { type: [String], default: [] }
    },
    locked: {
      type: Boolean,
      default: false
    }
  },

  {
    timestamps: true
  }
)

// Thêm virtual property 'id'
UserSchema.virtual('id').get(function (this: mongoose.Document) {
  return (this._id as mongoose.Types.ObjectId).toHexString()
})

// Đảm bảo virtual fields được bao gồm khi chuyển đổi sang JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id
    return ret
  }
})

// Đảm bảo virtual fields được bao gồm khi chuyển đổi sang Object
UserSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id
    return ret
  }
})

const Users = mongoose.model('Users', UserSchema)

export default Users

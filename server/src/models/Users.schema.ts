import _ from 'lodash'
import mongoose, { ObjectId } from 'mongoose'
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
  device: ObjectId[]
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
      required: true
    },
    full_name: {
      type: String,
      required: true,
      index: true
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
    },
    device: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Devices'
      }
    ]
  },

  {
    timestamps: true
  }
)
/// Hàm viết hoa chữ cái đầu
function capitalizeFirstLetter(str: string): string {
  return _.join(_.map(_.split(str, ' '), _.capitalize), ' ')
}

// Middleware để viết hoa first_name và last_name trước khi lưu
UserSchema.pre('save', function (next) {
  if (this.isModified('first_name')) {
    this.first_name = capitalizeFirstLetter(this.first_name)
  }
  if (this.isModified('last_name')) {
    this.last_name = capitalizeFirstLetter(this.last_name)
  }
  if (this.isModified('full_name')) {
    this.full_name = capitalizeFirstLetter(this.full_name)
  }
  next()
})

// Middleware để viết hoa first_name và last_name trước khi cập nhật
UserSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as { first_name?: string; last_name?: string; full_name?: string }
  if (update.first_name) {
    update.first_name = capitalizeFirstLetter(update.first_name)
  }
  if (update.last_name) {
    update.last_name = capitalizeFirstLetter(update.last_name)
  }
  if (update.full_name) {
    update.full_name = capitalizeFirstLetter(update.full_name)
  }
  next()
})

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

UserSchema.index({ username: 1, email: 1, employee_code: 1, frist_name: 1, full_name: 1 }, { unique: true })

const Users = mongoose.model('Users', UserSchema)

export default Users

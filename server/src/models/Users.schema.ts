import mongoose, { Schema } from 'mongoose'
import { Roles, Status } from '~/constants/enum'

const UserSchema = new Schema(
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
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: Roles,
      default: Roles.User
    },
    permission: {
      type: Schema.Types.ObjectId,
      ref: 'Permission'
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: 'Position'
    },
    status: {
      type: Status,
      default: Status.Inactive
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
    avatar: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
)

const UsersModel = mongoose.model('Users', UserSchema)

export default UsersModel

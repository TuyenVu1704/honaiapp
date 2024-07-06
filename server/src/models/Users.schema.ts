import mongoose, { Schema } from 'mongoose'

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
      required: true,
      unique: true
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
      type: Schema.Types.ObjectId,
      ref: 'Roles',
      default: 'User'
    },
    permission: {
      type: Schema.Types.ObjectId,
      ref: 'Permissions'
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Departments'
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: 'Positions'
    },
    status: {
      type: Schema.Types.ObjectId,
      default: 'Inactive'
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
    created_at: Date,
    updated_at: Date
  },
  { timestamps: true }
)

const UsersModel = mongoose.model('Users', UserSchema)

export default UsersModel

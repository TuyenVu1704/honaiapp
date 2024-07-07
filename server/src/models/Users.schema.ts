import mongoose from 'mongoose'

const Schema = mongoose.Schema
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
    roles: {
      type: String,
      default: 'User'
    },
    permissions: {
      type: Array
    },
    department: {
      type: String
    },
    position: {
      type: String
    },
    device: {
      type: Array
    },
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
    created_at: Date,
    updated_at: Date
  },
  { timestamps: true }
)

const Users = mongoose.model('Users', UserSchema)

export default Users

import mongoose from 'mongoose'

export interface IRefreshTokenEntry {
  refresh_token?: string
  device_id: mongoose.Schema.Types.ObjectId
  device_name: string
  ip?: string
  created_at: Date
  updated_at: Date
}

export interface IRefreshToken extends mongoose.Document {
  user_id: mongoose.Schema.Types.ObjectId
  refresh_token: IRefreshTokenEntry[]
}

const Schema = mongoose.Schema
const RefreshTokenEntrySchema = new Schema<IRefreshTokenEntry>(
  {
    refresh_token: {
      type: String,
      required: true
    },
    device_id: {
      type: String,
      required: true
    },
    device_name: {
      type: String,
      required: true
    },
    ip: {
      type: String
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)
const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    refresh_token: [RefreshTokenEntrySchema]
  },
  { timestamps: true }
)

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)

export default RefreshToken

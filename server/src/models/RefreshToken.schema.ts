import mongoose from 'mongoose'
import { IDevice } from './Devices.schema'

export interface IRefreshToken {
  user_id: mongoose.Schema.Types.ObjectId
  device: mongoose.Schema.Types.ObjectId
  refresh_token: string
  expires: Date
}

const Schema = mongoose.Schema

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    device: {
      type: Schema.Types.ObjectId,
      ref: 'User.devices',
      required: true
    },
    refresh_token: {
      type: String,
      required: true
    },
    expires: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
)

// Tạo compound index cho user_id và device
RefreshTokenSchema.index({ user_id: 1, device: 1 }, { unique: true })

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
export default RefreshToken

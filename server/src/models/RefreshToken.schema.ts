import mongoose from 'mongoose'
import { IDevice } from './Devices.schema'

export interface IRefreshToken {
  user_id: mongoose.Schema.Types.ObjectId
  devices: IRefreshTokenDevice[]
}

export interface IRefreshTokenDevice {
  device: IDevice
  refresh_token: string
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
    devices: [
      {
        device: {
          type: Schema.Types.ObjectId,
          ref: 'User.devices',
          required: true
        },
        refresh_token: {
          type: String,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
)

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
export default RefreshToken

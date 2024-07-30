import mongoose from 'mongoose'
import { IDevice } from 'ua-parser-js'

export interface IRefreshToken extends mongoose.Document {
  user_id: string
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
      type: String,
      required: true
    },
    devices: [
      {
        device: {
          type: Object,
          required: true
        },
        refresh_token: {
          type: String,
          required: true,
          unique: true,
          index: true
        }
      }
    ]
  },
  { timestamps: true }
)

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
export default RefreshToken

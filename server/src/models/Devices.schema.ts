import mongoose from 'mongoose'
export interface IDevice {
  device_id: string
  type: string
  os: string
  browser: string
  ip: string
  last_login?: Date
}

const Schema = mongoose.Schema

export const DeviceSchema = new Schema<IDevice>({
  device_id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  os: {
    type: String,
    required: true
  },
  browser: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  last_login: {
    type: Date
  }
})

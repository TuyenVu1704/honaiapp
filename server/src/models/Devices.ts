import mongoose from 'mongoose'

export interface IDevice {
  user_id: mongoose.Schema.Types.ObjectId
  device_id: string
  device_name: string
  ip: string
  last_login: Date
  created_at: Date
  updated_at: Date
}

const Schema = mongoose.Schema

const DeviceSchema = new Schema<IDevice>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
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
      type: String,
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    last_login: {
      type: Date
    }
  },
  { timestamps: true }
)

const Devices = mongoose.model<IDevice>('Devices', DeviceSchema)

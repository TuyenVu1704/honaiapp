import mongoose from 'mongoose'

export interface IDevice extends mongoose.Document {
  user_id?: string
  device_id: string
  type: string
  os: string
  browser: string
  ip: string
  last_login?: Date
}

const Schema = mongoose.Schema

const DeviceSchema = new Schema<IDevice>(
  {
    user_id: {
      type: String,
      required: true
    },
    device_id: {
      type: String,
      required: true
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
      type: Date,
      required: true
    }
  },
  { timestamps: true }
)

const Devices = mongoose.model<IDevice>('Devices', DeviceSchema)
export default Devices

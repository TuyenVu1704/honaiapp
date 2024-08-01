import mongoose from 'mongoose'

export interface IDevice {
  user_id: mongoose.Types.ObjectId
  device_id: string
  type: string
  os: string
  browser: string
  ip: string
  last_login?: Date
}

const DeviceSchema = new mongoose.Schema<IDevice>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    device_id: {
      type: String,
      required: true,
      unique: true
    },
    type: String,
    os: String,
    browser: String,
    ip: String,
    last_login: Date
  },
  { timestamps: true }
)

DeviceSchema.index({ user: 1, device_id: 1 }, { unique: true })

const Device = mongoose.model<IDevice>('Device', DeviceSchema)
export default Device

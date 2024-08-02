import mongoose from 'mongoose'

export interface IDevice {
  _id: mongoose.Types.ObjectId
  id: string
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
  {
    timestamps: true
  }
)
// Thêm virtual property 'id'
DeviceSchema.virtual('id').get(function (this: mongoose.Document) {
  return (this._id as mongoose.Types.ObjectId).toHexString()
})

// Đảm bảo virtual fields được bao gồm khi chuyển đổi sang JSON
DeviceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id
    return ret
  }
})

// Đảm bảo virtual fields được bao gồm khi chuyển đổi sang Object
DeviceSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id
    return ret
  }
})

DeviceSchema.index({ user: 1, device_id: 1 }, { unique: true })

const Device = mongoose.model<IDevice>('Device', DeviceSchema)
export default Device

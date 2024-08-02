import mongoose from 'mongoose'
import { string } from 'zod'

export interface IRefreshToken {
  _id: mongoose.Types.ObjectId
  id: string
  user_id: string
  device: string
  refresh_token: string
  expires?: Date | null
}

const Schema = mongoose.Schema

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user_id: {
      type: String,
      ref: 'User',
      required: true,
      index: true
    },
    device: {
      type: String,
      ref: 'Device',
      required: true
    },
    refresh_token: {
      type: String
    },
    expires: {
      type: Date || null
    }
  },
  {
    timestamps: true
  }
)

// Thêm virtual property 'id'
RefreshTokenSchema.virtual('id').get(function (this: mongoose.Document) {
  return (this._id as mongoose.Types.ObjectId).toHexString()
})

// Đảm bảo virtual fields được bao gồm khi chuyển đổi sang JSON
RefreshTokenSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id
    return ret
  }
})

// Đảm bảo virtual fields được bao gồm khi chuyển đổi sang Object
RefreshTokenSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    delete ret._id
    return ret
  }
})

// Tạo compound index cho user_id và device
RefreshTokenSchema.index({ user_id: 1, device: 1 }, { unique: true })

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
export default RefreshToken

import mongoose from 'mongoose'
import { IRefreshToken } from '~/constants/type'

const Schema = mongoose.Schema
const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    refresh_token: {
      type: String,
      required: true
    },
    created_at: Date,
    updated_at: Date
  },
  { timestamps: true }
)

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema)

export default RefreshToken

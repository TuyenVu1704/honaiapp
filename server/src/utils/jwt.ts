import jwt, { JwtPayload } from 'jsonwebtoken'
import { accessTokenPayloadSchema, accessTokenPayloadType } from '~/middlewares/accessToken.middlewares'
import { refreshTokenPayloadSchema, refreshTokenPayloadType } from '~/middlewares/refreshToken.middlewares'
import { config } from 'dotenv'
import { emailVerifyTokenSchema, emailVerifyTokenSchemaType } from '~/middlewares/emailVerifyToken.middlewares'
import {
  emailVerifyDeviceTokenSchema,
  emailVerifyDeviceTokenSchemaType
} from '~/middlewares/emailVerifyDevice.Middlewares'

config()
export const signToken = async ({
  payload,
  secretKey,
  expiresIn
}: {
  payload: string | object | Buffer
  secretKey: string
  expiresIn: string | number
}) => {
  return jwt.sign(payload, secretKey, { expiresIn })
}

export const verifyToken = (token: string, secret: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err)
      }

      resolve(decoded as JwtPayload)
    })
  })
}

export const generateAccessToken = async (payload: accessTokenPayloadType) => {
  const validatePayload = accessTokenPayloadSchema.parse(payload)
  return signToken({
    payload: validatePayload,
    secretKey: process.env.ACCESS_TOKEN as string,
    expiresIn: process.env.EXPIRE_ACCESS_TOKEN as string
  })
}

export const generateRefreshToken = async (payload: refreshTokenPayloadType) => {
  const validatePayload = refreshTokenPayloadSchema.parse(payload)
  return signToken({
    payload: validatePayload,
    secretKey: process.env.REFRESH_TOKEN as string,
    expiresIn: process.env.EXPIRE_REFRESH_TOKEN as string
  })
}

export const generateEmailVerifyToken = async (payload: emailVerifyTokenSchemaType) => {
  const validatePayload = emailVerifyTokenSchema.parse(payload)
  return signToken({
    payload: validatePayload,
    secretKey: process.env.EMAIL_VERIFY_TOKEN as string,
    expiresIn: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
  })
}

export const generateEmailVerifyDeviceToken = async (payload: emailVerifyDeviceTokenSchemaType) => {
  const validatePayload = emailVerifyDeviceTokenSchema.parse(payload)
  return signToken({
    payload: validatePayload,
    secretKey: process.env.EMAIL_VERIFY_DEVICE_TOKEN as string,
    expiresIn: process.env.EXPIRE_EMAIL_VERIFY_DEVICE_TOKEN as string
  })
}

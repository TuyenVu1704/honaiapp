import jwt, { SignOptions } from 'jsonwebtoken'
import { ErrorWithStatusCode } from '~/config/errors'

export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}

export const signAccessToken = ({
  payload,
  options = {
    expiresIn: process.env.EXPIRE_ACCESS_TOKEN
  }
}: {
  payload: string | Buffer | object
  options?: SignOptions
}) => {
  return signToken({ payload, privateKey: process.env.ACCESS_TOKEN as string, options })
}

export const signRefreshToken = ({
  payload,
  options = {
    expiresIn: process.env.EXPIRE_REFRESH_TOKEN
  }
}: {
  payload: string | Buffer | object
  options?: SignOptions
}) => {
  return signToken({ payload, privateKey: process.env.REFRESH_TOKEN as string, options })
}

export const signAccessAndRefreshToken = async ({ payload }: { payload: string | Buffer | object }) => {
  return Promise.all([signAccessToken({ payload }), signRefreshToken({ payload })])
}

export const verifyToken = ({
  token,
  privateKey,
  options = {
    algorithms: ['HS256']
  }
}: {
  token: string
  privateKey: string
  options?: jwt.VerifyOptions
}) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, privateKey, options, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      resolve(decoded as jwt.JwtPayload)
    })
  })
}

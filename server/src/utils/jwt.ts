import jwt, { Secret } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { config } from 'dotenv'
config()
export const sign = ({
  payload,
  secret,
  options
}: {
  payload: string | Buffer | object
  secret: Secret
  options: jwt.SignOptions
}) => {
  new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) reject(err)
      resolve(token)
    })
  })
}
export const signAccessToken = async ({
  payload,
  secret = process.env.ACCESS_TOKEN as string,
  options = { expiresIn: process.env.EXPIRE_ACCESS_TOKEN }
}: {
  payload: string | Buffer | object
  secret?: Secret
  options?: jwt.SignOptions
}) => {
  return sign({ payload, secret, options })
}

export const signRefreshToken = async ({
  payload,
  secret = process.env.REFRESH_TOKEN as string,
  options = { expiresIn: process.env.EXPIRE_REFRESH_TOKEN }
}: {
  payload: string | Buffer | object
  secret?: Secret
  options?: jwt.SignOptions
}) => {
  return sign({ payload, secret, options })
}

export const signAccessAndRefreshToken = async ({ payload }: { payload: string | Buffer | object }) => {
  return Promise.all([signAccessToken({ payload }), signRefreshToken({ payload })])
}

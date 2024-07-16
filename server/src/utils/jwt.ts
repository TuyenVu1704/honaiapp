import jwt, { JwtPayload } from 'jsonwebtoken'

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

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

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import z from 'zod'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { verifyToken } from '~/utils/jwt'
import tryCatchHandler from '~/utils/trycatchHandler'
import { config } from 'dotenv'
config()
// Verify Device Query
export const verifyDeviceQuery = z
  .object({
    token: z.string()
  })
  .strict()

export type verifyDeviceQueryType = z.infer<typeof verifyDeviceQuery>

export const emailVerifyDeviceTokenMiddleware = tryCatchHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query as verifyDeviceQueryType

    if (!token) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
    try {
      const decoded = await verifyToken(token, process.env.EMAIL_VERIFY_DEVICE_TOKEN as string)
      req.decoded_email_verify_token = decoded as jwt.JwtPayload

      next()
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.EMAIL_VERIFY_DEVICE_TOKEN_EXPIRED,
          statusCode: httpStatus.BAD_REQUEST
        })
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.EMAIL_VERIFY_DEVICE_TOKEN_INVALID_TOKEN,
          statusCode: httpStatus.BAD_REQUEST
        })
      }
    }
  }
)

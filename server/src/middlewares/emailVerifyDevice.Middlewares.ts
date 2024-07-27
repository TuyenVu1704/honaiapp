import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import z from 'zod'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import tryCatchHandler from '~/utils/trycatchHandler'
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
    jwt.verify(token, process.env.VERIFICATION_TOKEN as string, (error, decoded) => {
      if (error) {
        if (error.name === 'JsonWebTokenError') {
          throw new ErrorWithStatusCode({
            message: 'Email Verify Token' + ' ' + error.message,
            statusCode: httpStatus.UNAUTHORIZED
          })
        } else {
          throw new ErrorWithStatusCode({
            message: 'Email Verify Token' + ' ' + error.message,
            statusCode: httpStatus.UNPROCESSABLE_ENTITY
          })
        }
      }
      req.decoded_email_verify_token = decoded as jwt.JwtPayload

      next()
    })
  }
)

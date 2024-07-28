import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { z } from 'zod'
import { config } from 'dotenv'
import tryCatchHandler from '~/utils/trycatchHandler'
import { verifyToken } from '~/utils/jwt'
config()
// Email Verify Token Query
export const emailVerifyTokenQuery = z
  .object({
    email_verify_token: z.string()
  })
  .strict()

export type emailVerifyTokenQueryType = z.infer<typeof emailVerifyTokenQuery>

export const emailVerifyTokenMiddleware = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email_verify_token } = req.body as emailVerifyTokenQueryType
  if (!email_verify_token) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
      statusCode: httpStatus.BAD_REQUEST
    })
  }
  try {
    const decoded = await verifyToken(email_verify_token, process.env.VERIFICATION_TOKEN as string)
    req.decoded_email_verify_token = decoded as JwtPayload
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.EMAIL_VERIFY_EMAIL_TOKEN_EXPIRED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.EMAIL_VERIFY_EMAIL_TOKEN_INVALID_TOKEN,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
  }
})

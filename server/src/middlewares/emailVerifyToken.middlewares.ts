import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { z } from 'zod'
import { config } from 'dotenv'
import tryCatchHandler from '~/utils/trycatchHandler'
config()
// Body kiểm tra emailVerify token
export const emailVerifyTokenBody = z
  .object({
    email_verify_token: z.string({
      required_error: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
      invalid_type_error: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IS_STRING
    })
  })
  .strict()

// Kiểu của body kiểm tra emailVerify token
export type emailVerifyTokenBodyType = z.infer<typeof emailVerifyTokenBody>

// Middleware kiểm tra emailVerify token
export const emailVerifyTokenMiddleware = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const email_verify_token = req.body as emailVerifyTokenBodyType

  // Kiểm tra emailVerify token có trong body không
  if (!email_verify_token.email_verify_token) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IN_BODY_IS_REQUIRED,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }

  // Verify emailVerify token

  jwt.verify(email_verify_token.email_verify_token, process.env.EMAIL_VERIFY_TOKEN as string, (error, decoded) => {
    if (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new ErrorWithStatusCode({
          message: 'emailVerifyToken' + ' ' + error.message,
          statusCode: httpStatus.UNAUTHORIZED
        })
      } else {
        throw new ErrorWithStatusCode({
          message: 'emailVerifyToken' + ' ' + error.message,
          statusCode: httpStatus.UNPROCESSABLE_ENTITY
        })
      }
    }
    //Gán decoded emailVerify token vào biến decoded_emailVerify_token
    req.decoded_email_verify_token = decoded as JwtPayload
    next()
  })
})

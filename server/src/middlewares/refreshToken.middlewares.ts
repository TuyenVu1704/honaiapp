import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken'
import tryCatchHandler from '~/utils/trycatchHandler'
import { z } from 'zod'

// Body kiểm tra refresh token
export const refreshTokenBody = z
  .object({
    refresh_token: z.string({
      required_error: USER_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
      invalid_type_error: USER_MESSAGE.REFRESH_TOKEN_IS_STRING
    })
  })
  .strict()

// Kiểu của body kiểm tra refresh token
export type refreshTokenBodyType = z.infer<typeof refreshTokenBody>

// Middleware kiểm tra refresh token
export const refreshTokenMiddleware = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const refresh_token = req.body as refreshTokenBodyType

  // Kiểm tra refresh token có trong body không
  if (!refresh_token) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }

  // Verify refresh token
  jwt.verify(refresh_token.refresh_token, process.env.REFRESH_TOKEN as string, (error, decoded) => {
    if (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new ErrorWithStatusCode({
          message: 'RefreshToken' + ' ' + error.message,
          statusCode: httpStatus.UNAUTHORIZED
        })
      } else {
        throw new ErrorWithStatusCode({
          message: 'RefreshToken' + ' ' + error.message,
          statusCode: httpStatus.UNPROCESSABLE_ENTITY
        })
      }
    }
    // Gán decoded refresh token vào biến decoded_refresh_token

    req.decoded_refresh_token = decoded as JwtPayload
    next()
  })
})

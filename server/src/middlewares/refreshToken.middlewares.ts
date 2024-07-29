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

// Body kiểm tra refresh token
export const refreshTokenBody = z
  .object({
    refresh_token: z.string()
  })
  .strict()

// Kiểu của body kiểm tra refresh token
export type refreshTokenBodyType = z.infer<typeof refreshTokenBody>

export const refreshTokenPayloadSchema = z
  .object({
    _id: z.string()
  })
  .strict()

export type refreshTokenPayloadType = z.infer<typeof refreshTokenPayloadSchema>

// Middleware kiểm tra refresh token
export const refreshTokenMiddleware = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const refresh_token = req.body as refreshTokenBodyType

  // Kiểm tra refresh token có trong body không
  if (!refresh_token.refresh_token) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.REFRESH_TOKEN_IN_BODY_IS_REQUIRED,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }

  // Verify refresh token
  try {
    const decoded = await verifyToken(refresh_token.refresh_token, process.env.REFRESH_TOKEN as string)
    req.decoded_refresh_token = decoded as JwtPayload
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.REFRESH_TOKEN_IS_EXPIRED,
        statusCode: httpStatus.UNAUTHORIZED
      })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.REFRESH_TOKEN_IS_INVALID,
        statusCode: httpStatus.UNAUTHORIZED
      })
    }
  }
})

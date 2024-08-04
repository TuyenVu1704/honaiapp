import { Request, Response, NextFunction } from 'express'
import { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import tryCatchHandler from '~/utils/trycatchHandler'
import { config } from 'dotenv'
import { verifyToken } from '~/utils/jwt'
import { z } from 'zod'
import { loginUserBodyType } from './users.middlewares'
import Users from '~/models/Users.schema'
config()

export const accessTokenPayloadSchema = z.object({
  id: z.string(),
  role: z.number(),
  email_verified: z.boolean()
})

export type accessTokenPayloadType = z.infer<typeof accessTokenPayloadSchema>

// Middleware kiểm tra accessToken
export const accessTokenMiddleware = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1]

  if (!accessToken) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }
  try {
    const decoded = await verifyToken(accessToken, process.env.ACCESS_TOKEN as string)
    req.user = decoded

    next()
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCESS_TOKEN_IS_EXPIRED,
        statusCode: httpStatus.UNAUTHORIZED
      })
    }
    if (error instanceof JsonWebTokenError) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCESS_TOKEN_IS_INVALID,
        statusCode: httpStatus.UNAUTHORIZED
      })
    }
  }
})

// Check admin
export const checkIsAdmin = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.user as JwtPayload
  const user = await Users.findById(id).select('role')
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  req.isAdmin = user.role === 0
  if (req.isAdmin == !0) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_IS_NOT_ADMIN,
      statusCode: httpStatus.FORBIDDEN
    })
  }
  next()
})

// Check email đã được xác thực chưa
export const checkIsEmailVerified = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.body as loginUserBodyType
  const email_verified = await Users.findOne({ username }).select('email_verified')
  if (!email_verified || !email_verified.email_verified) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_EMAIL_NOT_VERIFIED,
      statusCode: httpStatus.FORBIDDEN
    })
  }

  next()
})

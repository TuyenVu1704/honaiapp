import { Request, Response, NextFunction } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import tryCatchHandler from '~/utils/trycatchHandler'
import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
config()

// Middleware kiểm tra accessToken
export const accessTokenMiddleware = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1]

  if (!accessToken) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }
  jwt.verify(accessToken, process.env.ACCESS_TOKEN as string, (error, decoded) => {
    if (error) {
      throw new ErrorWithStatusCode({
        message: 'Accesstoken' + ' ' + error.message,
        statusCode: httpStatus.UNAUTHORIZED
      })
    }

    req.user = decoded as JwtPayload
    req.isAdmin = req.user.role === 0
    next()
  })
})

// Check admin
export const checkIsAdmin = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAdmin) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_IS_NOT_ADMIN,
      statusCode: httpStatus.FORBIDDEN
    })
  }
  next()
})

// Check email đã được xác thực chưa
export const checkIsEmailVerified = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email_verified } = req.user as JwtPayload
  if (!email_verified) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_EMAIL_NOT_VERIFIED,
      statusCode: httpStatus.FORBIDDEN
    })
  }
  next()
})

import { Request, Response, NextFunction } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import tryCatchHandler from '~/utils/trycatchHandler'
import jwt from 'jsonwebtoken'

export const accessTokenMiddleware = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1]
  console.log(accessToken)
  if (!accessToken) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }
  jwt.verify(accessToken, process.env.ACCESS_TOKEN as string, (error, decoded) => {
    if (error) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCESS_TOKEN_IS_INVALID,
        statusCode: httpStatus.UNAUTHORIZED
      })
    }
    console.log(decoded)
    req.user = decoded as JwtPayload
    next()
  })
})

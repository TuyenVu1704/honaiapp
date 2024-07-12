import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { verifyToken } from '~/utils/jwt'
export const accessTokenValidation = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization?.split(' ')[1]
  if (!accessToken) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }
  const decoded = await verifyToken({ token: accessToken, privateKey: process.env.ACCESS_TOKEN as string })

  next()
}

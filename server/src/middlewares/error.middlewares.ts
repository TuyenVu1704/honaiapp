import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatusCode) {
    res.status(err.statusCode).json(omit(err, 'statusCode')) // omit để loại bỏ key statusCode
  } else {
    // Nếu không phải là instance của ErrorWithStatusCode thì trả về lỗi 500
    // Object.getOwnPropertyNames(err) trả về tất cả các key của err
    // forEach để duyệt qua từng key và định nghĩa lại key đó với enumerable: true
    Object.getOwnPropertyNames(err).forEach((key) => {
      Object.defineProperty(err, key, { enumerable: true })
    })
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message,
      errInfo: omit(err, 'stack')
    })
  }
}

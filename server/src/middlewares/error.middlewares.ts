import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import httpStatus from '~/constants/httpStatus'
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json(omit(err, 'statusCode')) // omit để loại bỏ key statusCode
}

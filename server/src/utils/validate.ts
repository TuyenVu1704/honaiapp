import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { ZodError } from 'zod'
export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    // schema.parse(req.body) là cách để kiểm tra dữ liệu từ body của request
    schema.parse(req.body)
    // Nếu không có lỗi thì chuyển tiếp cho middleware tiếp theo
    next()
  } catch (error) {
    // Nếu có lỗi thì trả về lỗi cho client
    if (error instanceof ZodError) {
      const customError = {
        error: error.errors.map((err) => {
          return {
            field: err.path.join('.'),
            message: err.message
          }
        })
      }
      return next(customError)
    } else {
      next(error)
    }
  }
}

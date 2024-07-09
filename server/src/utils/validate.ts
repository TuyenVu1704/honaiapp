import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { EntityError } from '~/config/errors'
export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    // schema.parse(req.body) là cách để kiểm tra dữ liệu từ body của request
    schema.parse(req.body)
    // Nếu không có lỗi thì chuyển tiếp cho middleware tiếp theo
    next()
  } catch (error) {
    // Nếu có lỗi thì trả về lỗi cho client
    // Nếu lỗi là ZodError thì chuyển thành EntityError
    if (error instanceof ZodError) {
      const entityError = new EntityError({ errors: {} })
      // Lặp qua từng lỗi và thêm vào entityError
      error.errors.forEach((err) => {
        entityError.errors[String(err.path[0])] = { message: err.message, path: String(err.path[0]) }
      })
      next(entityError)
    } else {
      next(error)
    }
  }
}

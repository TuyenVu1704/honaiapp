import { Request, Response, NextFunction, RequestHandler } from 'express'

const tryCatchHandler = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}

export default tryCatchHandler

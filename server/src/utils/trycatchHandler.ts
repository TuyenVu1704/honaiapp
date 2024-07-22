import { Request, Response, NextFunction, RequestHandler } from 'express'
import { validate } from './validate'

const tryCatchHandler = <P>(fn: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}

export default tryCatchHandler

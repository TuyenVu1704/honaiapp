import { Request, Response, NextFunction } from 'express'
import { pick } from 'lodash'
type filterKey<T> = Array<keyof T>
export const filterReqMiddleware =
  <T>(filterKeys: filterKey<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }

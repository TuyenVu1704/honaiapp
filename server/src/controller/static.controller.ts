import tryCatchHandler from '~/utils/trycatchHandler'
import { NextFunction, Request, Response } from 'express'
import { UPLOAD_AVATAR } from '~/constants/dir'
import httpStatus from '~/constants/httpStatus'
export const serveImageController = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  console.log(name)
  return res.sendFile(UPLOAD_AVATAR + '/' + name, (err) => {
    if (err) {
      return res.status(httpStatus.NOT_FOUND).send('Not found')
    }
  })
})

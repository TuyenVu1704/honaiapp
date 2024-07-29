import tryCatchHandler from '~/utils/trycatchHandler'
import { NextFunction, Request, Response } from 'express'
import httpStatus from '~/constants/httpStatus'
import { serveUploadAvatar } from '~/constants/dir'

export const serveImageController = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  // console.log(serveUploadAvatar + name)
  return res.sendFile(serveUploadAvatar + '/' + name, (err) => {
    if (err) {
      return res.status(httpStatus.NOT_FOUND).send('Not found')
    }
  })
})

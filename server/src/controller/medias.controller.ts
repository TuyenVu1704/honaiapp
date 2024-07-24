import { Request, Response } from 'express'
import tryCatchHandler from '~/utils/trycatchHandler'
import { handleUploadSingleImage } from '~/utils/file'

/**
 * Upload Avartar User
 */
export const uploadAvartarcontroller = tryCatchHandler(async (req: Request, res: Response) => {
  const data = await handleUploadSingleImage(req)
  return res.json(data)
})

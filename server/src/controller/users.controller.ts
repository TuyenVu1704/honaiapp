import { Request, Response } from 'express'
import tryCatchHandler from '~/utils/trycatchHandler'
// Tạo User

export const registerUserController = tryCatchHandler(async (req: Request, res: Response) => {
  res.send('Register user')
})

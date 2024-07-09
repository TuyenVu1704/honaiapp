import { Request, Response } from 'express'
import { registerUserServices } from '~/services/users.services'
import tryCatchHandler from '~/utils/trycatchHandler'

// Đăng ký tài khoản mới
export const registerUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await registerUserServices(req.body)
  return res.json(result)
})

// Đăng nhập tài khoản

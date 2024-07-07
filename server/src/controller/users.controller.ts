import { Request, Response } from 'express'

import { registerUserServices } from '~/services/users.services'

// Đăng ký tài khoản

export const registerUserController = async (req: Request, res: Response) => {
  const result = await registerUserServices(req.body)
  console.log('result', result)
  return res.json(result)
}

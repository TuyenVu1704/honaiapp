import { Request, Response } from 'express'
import { loginServices, registerUserServices } from '~/services/users.services'
import tryCatchHandler from '~/utils/trycatchHandler'

// Đăng ký tài khoản mới
export const registerUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await registerUserServices(req.body)
  return res.json(result)
})

// Đăng nhập tài khoản
export const loginUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await loginServices(req.body)
  return res.json(result)
})

// User Đăng xuất tài khoản

// Admin yêu cầu đăng xuất tài khoản

// Lấy thông tin 1 người dùng

// Lấy thông tin nhiều người dùng

// Cập nhật thông tin người dùng

// Xóa tài khoản người dùng

// Thay đổi mật khẩu

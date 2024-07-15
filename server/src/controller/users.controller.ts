import { Request, Response } from 'express'
import { loginServices, logoutServices, registerUserServices } from '~/services/users.services'
import tryCatchHandler from '~/utils/trycatchHandler'

// Đăng ký tài khoản mới
export const registerUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await registerUserServices(req.body)
  return res.json(result)
})

// Verify Email sau khi đăng ký tài khoản thành công

// Verify Email thành công sau khi đăng ký tài khoản yêu cầu đăng nhập và đưa vào trang thay đổi mật khẩu

// Đăng nhập tài khoản
export const loginUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await loginServices(req.body)
  return res.json(result)
})

// User Đăng xuất tài khoản
export const logoutUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await logoutServices(req.body)
  return res.json(result)
})

// Admin yêu cầu đăng xuất tài khoản
// Admin lấy lại mật khẩu Admin
// Admin thay đổi mật khẩu người dùng
// Admin xem thông tin người dùng
// Admin xem danh sách người dùng
// Admin lock tài khoản người dùng
// Admin unlock tài khoản người dùng
// Admin xóa tài khoản người dùng
// Admin cập nhật thông tin người dùng

// User thay đổi mật khẩu
// User xem thông tin cá nhân
// User cập nhật thông tin cá nhân

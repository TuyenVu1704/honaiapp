import { Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import {
  loginServices,
  logoutServices,
  registerUserServices,
  resendEmailVerifyServices,
  verifyEmailServices
} from '~/services/users.services'
import tryCatchHandler from '~/utils/trycatchHandler'

// Đăng ký tài khoản mới
export const registerUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await registerUserServices(req.body)
  return res.json(result)
})

// Verify Email sau khi đăng ký tài khoản thành công
// Verify Email thành công sau khi đăng ký tài khoản yêu cầu đăng nhập và đưa vào trang thay đổi mật khẩu
export const verifyEmailController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await verifyEmailServices(req.decoded_email_verify_token as JwtPayload, req.body)
  return res.json(result)
})

// Resend Email Verify Token Sau khi user không nhận được email verify token
// Admin gửi lại email verify token cho user
export const resendEmailVerifyTokenController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await resendEmailVerifyServices(req.body)
  return res.json(result)
})

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

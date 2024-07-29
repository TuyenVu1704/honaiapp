import { Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'

import { getAllUserQueryType, getUserParamsType } from '~/middlewares/users.middlewares'
import {
  adminUpdateUserProfileServices,
  getAllUsersServices,
  getMeServices,
  getProfileUserService,
  loginServices,
  logoutServices,
  refreshTokenServices,
  registerUserServices,
  resendEmailVerifyServices,
  verifyDeviceService,
  verifyEmailServices
} from '~/services/users.services'

import tryCatchHandler from '~/utils/trycatchHandler'

import { isProduction } from '~/config/config'
import { config } from 'dotenv'
import { emailVerifyTokenQueryType } from '~/middlewares/emailVerifyToken.middlewares'

config()
/**
 * Description: Đăng ký tài khoản mới
 */
export const registerUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await registerUserServices(req.body)
  return res.json(result)
})

/**
 * Description: Verify Email sau khi đăng ký tài khoản thành công
 *
 */
export const verifyEmailController = tryCatchHandler(async (req: Request, res: Response) => {
  const { token } = req.query as emailVerifyTokenQueryType
  const { _id } = req.decoded_email_verify_token as JwtPayload
  const result = await verifyEmailServices({ _id, token })
  return res.json(result)
})

/**
 * Description: Resend Email Verify Token Sau khi user không nhận được email verify token
 * Roles: Admin
 */
export const resendEmailVerifyTokenController = tryCatchHandler(async (req: Request, res: Response) => {
  const { email } = req.body
  const result = await resendEmailVerifyServices({ email })
  return res.json(result)
})

/**
 * Description: Đăng nhập tài khoản
 */
export const loginUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await loginServices(req.body)
  return res.json(result)
})

/**
 * Description: Verify Device sau khi đăng nhập
 */
export const verifyDeviceController = tryCatchHandler(async (req: Request, res: Response) => {
  const { _id, device_id } = req.decoded_email_verify_token as JwtPayload

  const result = await verifyDeviceService({ _id, device_id })
  return res.json(result)
})

/**
 * Description: Refresh Token
 */
export const refreshTokenController = tryCatchHandler(async (req: Request, res: Response) => {
  const { _id } = req.decoded_refresh_token as JwtPayload
  const { refresh_token } = req.body
  const result = await refreshTokenServices({ _id, refresh_token })
  return res.json(result)
})

/**
 * Get Me
 */

export const getMeController = tryCatchHandler(async (req: Request, res: Response) => {
  const { _id } = req.user as JwtPayload
  const result = await getMeServices(_id)
  return res.json(result)
})

/**
 * Get Profile User
 */

export const getProfileUserController = tryCatchHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params as getUserParamsType
  const result = await getProfileUserService(id)
  return res.json(result)
})

/**
 * Admin update thông tin user
 *
 */

export const adminUpdateUserProfileController = tryCatchHandler(async (req: Request, res: Response) => {
  const { id } = req.params as getUserParamsType
  const result = await adminUpdateUserProfileServices(req.body, id)
  return res.json(result)
})

/**
 * Get All Users
 * Roles: Admin
 * Filter: name, email, phone, department, position, role
 * Pagination: page, limit
 * Sort: department, position, role,
 */

export const getAllUsersController = tryCatchHandler(async (req: Request, res: Response) => {
  const queries = { ...req.query }
  const result = await getAllUsersServices(queries as getAllUserQueryType)
  return res.json(result)
})

// User Đăng xuất tài khoản
export const logoutUserController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await logoutServices(req.body)
  return res.json(result)
})

import { NextFunction, Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import sharp from 'sharp'
import { UPLOAD_AVATAR } from '~/constants/dir'
import { getAllUserQueryType, getUserParamsType } from '~/middlewares/users.middlewares'
import {
  adminUpdateUserProfileServices,
  getAllUsersServices,
  getMeServices,
  getProfileUserService,
  loginServices,
  logoutServices,
  registerUserServices,
  resendEmailVerifyServices,
  updateAvatarService,
  verifyEmailServices
} from '~/services/users.services'
import { handleUploadSingleImage } from '~/utils/file'
import tryCatchHandler from '~/utils/trycatchHandler'
import fs from 'fs'
import { isProduction } from '~/config/config'
import { config } from 'dotenv'

config()
// Đăng ký tài khoản mới
export const registerUserController = tryCatchHandler(async (req: Request, res: Response, next: NextFunction) => {
  const result = await registerUserServices(req.body, next)
  return res.json(result)
})

// Verify Email sau khi đăng ký tài khoản thành công
// Verify Email thành công sau khi đăng ký tài khoản yêu cầu đăng nhập và đưa vào trang thay đổi mật khẩu
export const verifyEmailController = tryCatchHandler(async (req: Request, res: Response) => {
  const result = await verifyEmailServices(req.decoded_email_verify_token as JwtPayload, req.body)
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
 * User update thông tin cá nhân
 *
 */
export const updateAvatarController = tryCatchHandler(async (req: Request, res: Response) => {
  const { _id } = req.user as JwtPayload

  // Get file from request
  const file = await handleUploadSingleImage(req)
  const newName = file.newFilename.split('.')[0]
  // Resize file
  await sharp(file.filepath)
    .jpeg()
    .toFile(UPLOAD_AVATAR + `/${newName}.jpeg`)

  // Get url avatar
  const urlAvatar = isProduction
    ? `${process.env.HOST}/uploads/avatar/${newName}.jpeg`
    : `${process.env.BASE_URL}/uploads/avatar/${newName}.jpeg`

  // delete file in temp folder
  fs.unlinkSync(file.filepath)

  // update avatar in database
  const result = await updateAvatarService(urlAvatar, _id)
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

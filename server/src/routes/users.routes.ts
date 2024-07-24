import { Router } from 'express'
import {
  adminUpdateUserProfileController,
  getAllUsersController,
  getMeController,
  getProfileUserController,
  loginUserController,
  logoutUserController,
  registerUserController,
  resendEmailVerifyTokenController,
  updateAvatarController,
  verifyEmailController
} from '~/controller/users.controller'
import { accessTokenMiddleware, checkIsAdmin, checkIsEmailVerified } from '~/middlewares/accessToken.middlewares'
import { emailVerifyTokenMiddleware } from '~/middlewares/emailVerifyToken.middlewares'
import { filterReqMiddleware } from '~/middlewares/filterReq.middlewares'
import { refreshTokenBody, refreshTokenMiddleware } from '~/middlewares/refreshToken.middlewares'

import {
  adminUpdateUserProfileBody,
  adminUpdateUserProfileBodyType,
  loginUserBody,
  registerUserBody,
  resendEmailVerifyTokenBody,
  updateAvatarBody,
  updateAvatarBodyType
} from '~/middlewares/users.middlewares'
import { validate } from '~/utils/validate'

const router = Router()
/**
 * Description: Đăng ký tài khoản mới
 * Method: POST
 * Request: /users/register
 * Request body
 * roles: Admin
 */
router.post('/register', accessTokenMiddleware, checkIsAdmin, validate(registerUserBody), registerUserController)

/**
 * Description: Verify Email sau khi đăng ký tài khoản thành công
 * Method: POST
 * Request: /users/verify-email
 * Request body: { email_verify_token: string }
 *
 */

router.post('/verify-email', emailVerifyTokenMiddleware, verifyEmailController)

/**
 * Description: Get Me
 * Method: GET
 * Request: /users/me
 * Request Header: Authorization
 *
 */

router.get('/me', accessTokenMiddleware, checkIsEmailVerified, getMeController)

/**
 * Description: Get Profile User
 * Method: GET
 * Request: /users/profile/:id
 * Request Header: Authorization
 * Roles: Admin
 *
 */

router.get('/profile/:id', accessTokenMiddleware, checkIsAdmin, getProfileUserController)

/**
 * Description: User cập nhật Avatar
 * Method: POST
 * Request: /users/update-avatar
 * Request Header: Authorization
 * body: {  avatar }
 *
 */
router.post(
  '/update-avatar',
  accessTokenMiddleware,
  checkIsEmailVerified,
  validate(updateAvatarBody),
  filterReqMiddleware<updateAvatarBodyType>(['avatar']),
  updateAvatarController
)

/**
 * Description: Admin câp nhật thông tin user
 * Method: PATCH
 * Request: /users/update-profile/:id
 * Request Header: Authorization
 * Roles: Admin
 */

router.patch(
  '/update-profile/:id',
  accessTokenMiddleware,
  checkIsAdmin,
  validate(adminUpdateUserProfileBody),
  filterReqMiddleware<adminUpdateUserProfileBodyType>([
    'first_name',
    'last_name',
    'email',
    'phone',
    'role',
    'permission',
    'department',
    'position',
    'device',
    'email_verified',
    'avatar',
    'cover'
  ]),
  adminUpdateUserProfileController
)

/**
 * Description: Resend Email Verify Token Sau khi user không nhận được email verify token
 * Method: POST
 * Request: /users/resend-email-verify-token
 * Request body: {}
 * Roles: Admin
 * */
router.post(
  '/resend-email-verify-token',
  checkIsAdmin,
  validate(resendEmailVerifyTokenBody),
  resendEmailVerifyTokenController
)

/**
 * Description: Get All Users
 * Method: GET
 * Request: /users/get-all-users
 * Request Header: Authorization
 * Roles: Admin
 */

router.get('/get-all-users', accessTokenMiddleware, checkIsAdmin, getAllUsersController)

/**
 * Description: Đăng nhập tài khoản
 * Method: POST
 * Request: /users/login
 * Request body
 *
 */
router.post('/login', validate(loginUserBody), loginUserController)

/**
 * Description: User Đăng xuất tài khoản
 * Method: POST
 * Request: /users/logout
 * Request Header: Authorization
 * body: refreshToken
 */

router.post('/logout', accessTokenMiddleware, refreshTokenMiddleware, validate(refreshTokenBody), logoutUserController)

export default router

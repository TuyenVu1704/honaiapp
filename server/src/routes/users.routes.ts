import { log } from 'console'
import { Router } from 'express'
import {
  loginUserController,
  logoutUserController,
  registerUserController,
  resendEmailVerifyTokenController,
  verifyEmailController
} from '~/controller/users.controller'
import { accessTokenMiddleware, checkIsAdmin } from '~/middlewares/accessToken.middlewares'
import { emailVerifyTokenMiddleware } from '~/middlewares/emailVerifyToken.middlewares'
import { refreshTokenMiddleware } from '~/middlewares/refreshToken.middlewares'

import { loginUserBody, registerUserBody, resendEmailVerifyTokenBody } from '~/middlewares/users.middlewares'
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
 * Description: Đăng nhập tài khoản
 * Method: POST
 * Request: /users/login
 * Request body
 *
 */
router.post('/login', validate(loginUserBody), loginUserController)
export default router

/**
 * Description: User Đăng xuất tài khoản
 * Method: POST
 * Request: /users/logout
 * Request Header: Authorization
 * body: refreshToken
 */

router.post('/logout', accessTokenMiddleware, refreshTokenMiddleware, logoutUserController)

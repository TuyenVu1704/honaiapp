import { Router } from 'express'
import {
  loginUserController,
  registerUserController,
  resendEmailVerifyTokenController,
  verifyDeviceController,
  verifyEmailController
} from '~/controller/users.controller'
import { accessTokenMiddleware, checkIsAdmin, checkIsEmailVerified } from '~/middlewares/accessToken.middlewares'
import { emailVerifyDeviceTokenMiddleware } from '~/middlewares/emailVerifyDevice.Middlewares'
import { emailVerifyTokenMiddleware } from '~/middlewares/emailVerifyToken.middlewares'
import { filterReqMiddleware } from '~/middlewares/filterReq.middlewares'
import { refreshTokenBody, refreshTokenMiddleware } from '~/middlewares/refreshToken.middlewares'

import {
  adminUpdateUserProfileBody,
  adminUpdateUserProfileBodyType,
  loginUserBody,
  loginUserBodyType,
  registerUserBody,
  resendEmailVerifyTokenBody
} from '~/middlewares/users.middlewares'
import { adminResendEmailLimiter } from '~/utils/resendEmailLimiter'
import { validate } from '~/utils/validate'

const router = Router()
/**
 * Description: Đăng ký tài khoản mới
 * Method: POST
 * Request: /users/register
 * Request body
 * roles: Admin
 */
router.post(
  '/register',
  //accessTokenMiddleware,
  //checkIsAdmin,
  validate(registerUserBody),
  registerUserController
)

/**
 * Description: Verify Email sau khi đăng ký tài khoản thành công
 * Method: GET
 * Request: /users/verify-email
 * Request Params: { token: string }
 * req.decoded_email_verify_token = _id
 * deviceInfo = getDeviceInfo(req)
 *
 */

router.get('/verify-email/:token', emailVerifyTokenMiddleware, verifyEmailController)

/**
 * Description: Resend Email Verify Token Sau khi user không nhận được email verify token
 * Method: POST
 * Request: /users/resend-email-verify-token
 * Request body: {username: string}
 * Roles: Admin
 * */
router.post(
  '/resend-email-verify-token',
  // accessTokenMiddleware,
  // checkIsAdmin,
  // adminResendEmailLimiter,
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

/**
 * Description: Verify Device sau khi đăng nhập
 * Method: GET
 * Request: /users/verify-device
 * Request Params: { token: string }
 *
 */

router.get('/verify-device/:token', emailVerifyDeviceTokenMiddleware, verifyDeviceController)

// // /**
// //  * Description: Refresh Token
// //  * Method: POST
// //  * Request: /users/refresh-token
// //  * Request body: { refreshToken: string }
// //  *
// //  */

// // router.post('/refresh-token', refreshTokenMiddleware, validate(refreshTokenBody), refreshTokenController)

// // /**
// //  * Description: Get Me
// //  * Method: GET
// //  * Request: /users/me
// //  * Request Header: Authorization
// //  *
// //  */

// // router.get('/me', accessTokenMiddleware, checkIsEmailVerified, getMeController)

// // /**
// //  * Description: Get Profile User
// //  * Method: GET
// //  * Request: /users/profile/:id
// //  * Request Header: Authorization
// //  * Roles: Admin
// //  *
// //  */

// // router.get('/profile/:id', accessTokenMiddleware, checkIsAdmin, getProfileUserController)

// // /**
// //  * Description: Admin câp nhật thông tin user
// //  * Method: PATCH
// //  * Request: /users/update-profile/:id
// //  * Request Header: Authorization
// //  * Roles: Admin
// //  */

// router.patch(
//   '/update-profile/:id',
//   accessTokenMiddleware,
//   checkIsAdmin,
//   validate(adminUpdateUserProfileBody),
//   filterReqMiddleware<adminUpdateUserProfileBodyType>([
//     'first_name',
//     'last_name',
//     'email',
//     'phone',
//     'role',
//     'permission',
//     'department',
//     'position',
//     'device',
//     'email_verified'
//   ]),
//   adminUpdateUserProfileController
// )

// /**
//  * Description: User Change Password
//  * Method: PATCH
//  * Request: /users/change-password
//  * Request Header: Authorization
//  * Check email verified
//  * Request body: { old_password: string, new_password: string }
//  *
//  */

// // router.patch(
// //   '/change-password',
// //   accessTokenMiddleware,
// //   checkIsEmailVerified,
// //   validate(changePasswordBody),
// //   changePasswordController
// // )

// /**
//  * Description: Get All Users
//  * Method: GET
//  * Request: /users/get-all-users
//  * Request Header: Authorization
//  * Roles: Admin
//  */

// router.get('/get-all-users', accessTokenMiddleware, checkIsAdmin, getAllUsersController)

// /**
//  * Description: User Đăng xuất tài khoản
//  * Method: POST
//  * Request: /users/logout
//  * Request Header: Authorization
//  * body: refreshToken
//  */

// router.post('/logout', accessTokenMiddleware, refreshTokenMiddleware, validate(refreshTokenBody), logoutUserController)

export default router

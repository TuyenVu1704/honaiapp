import { log } from 'console'
import { Router } from 'express'
import { loginUserController, logoutUserController, registerUserController } from '~/controller/users.controller'
import { accessTokenMiddleware } from '~/middlewares/accessToken.middlewares'
import { refreshTokenMiddleware } from '~/middlewares/refreshToken.middlewares'

import { loginUserBody, registerUserBody } from '~/middlewares/users.middlewares'
import { validate } from '~/utils/validate'

const router = Router()

/**
 * Description: Đăng ký tài khoản mới
 * Method: POST
 * Request: /users/register
 * Request body
 *
 */
router.post('/register', validate(registerUserBody), registerUserController)

/**
 * Description: Đăng nhập tài khoản
 * Method: POST
 * Request: /users/login
 * Request body
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

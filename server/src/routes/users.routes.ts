import { Router } from 'express'
import { registerUserController } from '~/controller/users.controller'
import { registerUserBody } from '~/middlewares/users.middlewares'
import { validate } from '~/utils/validate'

const router = Router()

/**
 * Description: Đăng ký tài khoản mới
 * Method: POST
 * Request: /api/users/register
 * Request body
 *
 */
router.post('/register', validate(registerUserBody), registerUserController)

export default router

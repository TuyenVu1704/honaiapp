import { Router } from 'express'
import { registerUserController } from '~/controller/users.controller'

const router = Router()

/**
 * Description: Đăng ký tài khoản mới
 * Method: POST
 * Request: /api/users/register
 * Request body
 *
 */
router.post('/registerUser', registerUserController)

export default router

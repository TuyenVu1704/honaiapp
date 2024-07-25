import { Router } from 'express'
import { serveImageController } from '~/controller/static.controller'

const router = Router()

router.get('/avatar/:name', serveImageController)

export default router

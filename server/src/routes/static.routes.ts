import { Router } from 'express'
import { serveImageController } from '~/controller/static.controller'

const router = Router()

router.get('/image/:name', serveImageController)

export default router

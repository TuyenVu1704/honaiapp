import userRouter from './users.routes'
import staticRouter from './static.routes'
import uploadRouter from './uploads.routes'
const initRoutes = (app: any) => {
  app.use('/users', userRouter)
  app.use('/static', staticRouter)
  app.use('/uploads', uploadRouter)
}

export default initRoutes

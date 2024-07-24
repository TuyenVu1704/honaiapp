import userRouter from './users.routes'
import staticRouter from './static.routes'
const initRoutes = (app: any) => {
  app.use('/users', userRouter)
  app.use('/static', staticRouter)
}

export default initRoutes

import userRouter from './users.routes'
const initRoutes = (app: any) => {
  app.use('/users', userRouter)
}

export default initRoutes

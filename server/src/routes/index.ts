import userRouter from './users.routes'
const initRoutes = (app: any) => {
  app.use('/api/users', userRouter)
}

export default initRoutes

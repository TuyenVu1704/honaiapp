import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { config } from 'dotenv'
import connect from './config/connectDB'
import initRoutes from './routes'

config()
const app = express()
connect.connectDB()
app.use(cors())

// Body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Init all routes
initRoutes(app)

//Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err)
  res.status(500).send({ message: err.message })
})
// Define PORT
const PORT = process.env.PORT || 4001

// Listen server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app

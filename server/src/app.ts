import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { config } from 'dotenv'
import connectDB from './config/connectDB'
import initRoutes from './routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import { initFolder } from './utils/file'

config()
connectDB()

const app = express()
app.use(cors())

// Body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// create folder uploads
initFolder()

// Init all routes
initRoutes(app)

//Error handler
app.use(defaultErrorHandler)
// Define PORT
const PORT = process.env.PORT || 4001

// Listen server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app

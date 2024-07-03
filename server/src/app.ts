import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { config } from 'dotenv'
import connect from './config/connectDB'

config()
const app = express()
connect.connectDB()
app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = process.env.PORT || 4001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app

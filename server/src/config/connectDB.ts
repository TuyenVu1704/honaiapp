import mongoose from 'mongoose'
import { config } from 'dotenv'

config()

// Connection URL
const url = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.npdt1qs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class connectDB {
  async connectDB() {
    try {
      const conn = await mongoose.createConnection(url)

      // Ket noi thanh cong
      conn.on('connected', () => console.log('Connected to MongoDB'))

      // loi ket noi
      conn.on('error', (error) => console.error('Error connecting to MongoDB: ', error))

      // Ket noi bi ngat
      conn.on('disconnected', () => console.log('Disconnected from MongoDB'))

      // Neu process bi tat
      process.on('SIGINT', async () => {
        await conn.close()
        process.exit(0)
      })
    } catch (error) {
      console.error('Error connecting to MongoDB: ', error)
      process.exit(1)
    }
  }
}

const connect = new connectDB()
export default connect

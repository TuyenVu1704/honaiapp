import mongoose from 'mongoose'
import { config } from 'dotenv'
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.npdt1qs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const connectDB = async () => {
  try {
    await mongoose.connect(uri)
    console.log('Connect DB successfully')
  } catch (error) {
    console.log('Connect DB failed')
  }
}

export default connectDB

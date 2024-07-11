import mongoose from 'mongoose'
import Users from '~/models/Users.schema'
import { config } from 'dotenv'
config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.npdt1qs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const updateUsers = async () => {
  await mongoose.connect(uri)
  try {
    await Users.updateMany({}, { $set: { locked: false, loginAttempts: 0 } })
    console.log('Update User successfully')
  } catch (error) {
    console.log('Update User failed')
  } finally {
    await mongoose.disconnect()
  }
}

updateUsers()

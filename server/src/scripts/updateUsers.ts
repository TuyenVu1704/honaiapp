import mongoose from 'mongoose'
import Users from '~/models/Users.schema'
import { config } from 'dotenv'
config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.npdt1qs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const updateUsers = async () => {
  await mongoose.connect(uri)
  try {
    // update thêm key confirmToken vào tất cả các user
    // await Users.updateMany({}, { $set: { confirmToken: null } })
    await Users.updateMany({}, { $unset: { device: [] } })
    console.log('Update User successfully')
  } catch (error) {
    console.log('Update User failed')
  } finally {
    await mongoose.disconnect()
  }
}

updateUsers()

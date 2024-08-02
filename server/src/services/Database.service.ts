import mongoose from 'mongoose'

class DatabaseService {
  static async withTransaction<T>(operation: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession()
    try {
      session.startTransaction()
      const result = await operation(session)
      await session.commitTransaction()
      return result
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }
}

export const databaseService = DatabaseService

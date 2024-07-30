import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import Users from '~/models/Users.schema'

export const checkUserExistence = async (email: string, phone: string, username: string) => {
  const userExist = await Users.findOne({
    $or: [{ email }, { phone }, { username }]
  })
  if (userExist?.email === email) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_EXISTED,
      statusCode: httpStatus.BAD_REQUEST
    })
  }
  if (userExist?.phone === phone) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.PHONE_EXISTED,
      statusCode: httpStatus.BAD_REQUEST
    })
  }
  if (userExist?.username === username) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USERNAME_EXISTED,
      statusCode: httpStatus.BAD_REQUEST
    })
  }
}

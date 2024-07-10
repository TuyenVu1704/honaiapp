import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { registerUserBodyType } from '~/middlewares/users.middlewares'
import Users from '~/models/Users.schema'
import { capitalizeAfterSpace } from '~/utils/captalizeAfterSpace'
import { randomPassword } from '~/utils/randomPassword'

// Đăng ký tài khoản mới
export const registerUserServices = async (data: registerUserBodyType) => {
  //Viết hoa chữ cái đầu của first_name và last_name
  const [first_name, last_name] = await Promise.all([
    capitalizeAfterSpace(data.first_name),
    capitalizeAfterSpace(data.last_name)
  ])
  // Check email và phone đã tồn tại chưa
  const userExist = await Users.findOne({
    $or: [{ email: data.email }, { phone: data.phone }]
  })
  if (userExist) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_OR_PHONE_EXISTED,
      statusCode: httpStatus.BAD_REQUEST
    })
  }
  // Tạo user trong mongodb
  const user = new Users({
    ...data,
    first_name,
    last_name,
    password: await randomPassword(6)
  })
  await user.save()
  return {
    message: USER_MESSAGE.REGISTER_SUCCESSFULLY,
    data: user
  }
}

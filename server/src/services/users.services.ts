import { ErrorWithStatusCode } from '~/config/errors'
import { registerUserBodyType } from '~/middlewares/users.middlewares'
import Users from '~/models/Users.schema'
import { hashPassword } from '~/utils/hashPassword'

// Đăng ký tài khoản mới
export const registerUserServices = async (data: registerUserBodyType) => {
  // Check email và phone đã tồn tại chưa
  const userExist = await Users.findOne({
    $or: [{ email: data.email }, { phone: data.phone }]
  })
  if (userExist) {
    return new ErrorWithStatusCode({
      message: 'Email or phone already exists',
      statusCode: 400
    })
  }
  // Tạo user trong mongodb
  const user = new Users({
    ...data,
    password: await hashPassword(data.password)
  })
  await user.save()
  return {
    message: 'Register successfully',
    data: user
  }
}

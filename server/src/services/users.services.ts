import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { loginUserBodyType, registerUserBodyType } from '~/middlewares/users.middlewares'
import RefreshToken from '~/models/RefreshToken.schema'
import Users from '~/models/Users.schema'
import { capitalizeAfterSpace } from '~/utils/captalizeAfterSpace'
import { comparePassword, hashPassword } from '~/utils/hashPassword'
import { signAccessAndRefreshToken } from '~/utils/jwt'
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
    password: data.password === '' ? await randomPassword(6) : await hashPassword(data.password)
  })
  await user.save()
  return {
    message: USER_MESSAGE.REGISTER_SUCCESSFULLY,
    // không show password ra ngoài
    // đưa id lên trước
    data: {
      user: {
        _id: user._id,
        first_name,
        last_name,
        email: user.email
      }
    }
  }
}

// Đăng nhập tài khoản
export const loginServices = async (data: loginUserBodyType) => {
  const { email, password } = data
  // Kiểm tra email có tồn tại không
  const user = await Users.findOne({ email })
  // Kiểm tra xem tài khoản có đang bị khóa không

  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_OR_PASSWORD_EXISTED,
      statusCode: httpStatus.BAD_REQUEST
    })
  } else if (user.isLocked()) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCOUNT_LOCKED,
      statusCode: httpStatus.BAD_REQUEST
    })
  }
  // Kiểm tra password
  const isMatch = await comparePassword(password, user.password)

  if (!isMatch) {
    const loginAttempts = user.loginAttempts + 1
    // Nếu đăng nhập sai 5 lần thì khóa tài khoản
    if (loginAttempts >= 5) {
      await Users.findByIdAndUpdate(user._id, {
        loginAttempts,
        locked: true
      })
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCOUNT_LOCKED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
    //Cập nhật lại loginAttempts
    await Users.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      locked: false
    })
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT,
      statusCode: httpStatus.BAD_REQUEST
    })
  }

  // Ký JWT
  const [accessToken, refreshToken] = await signAccessAndRefreshToken({
    payload: { user_id: user._id, role: user.role }
  })
  // Lưu refreshToken vào mongodb
  const refreshTokenModel = new RefreshToken({
    user_id: user._id,
    refresh_token: refreshToken
  })
  await refreshTokenModel.save()

  // Trả về thông tin token
  return {
    message: USER_MESSAGE.LOGIN_SUCCESSFULLY,
    data: {
      accessToken,
      refreshToken
    }
  }
}

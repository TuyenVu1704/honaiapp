import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { refreshTokenBodyType } from '~/middlewares/refreshToken.middlewares'
import {
  loginUserBodyType,
  registerUserBodyType,
  resendEmailVerifyTokenBodyType
} from '~/middlewares/users.middlewares'
import RefreshToken from '~/models/RefreshToken.schema'
import Users from '~/models/Users.schema'
import { capitalizeAfterSpace } from '~/utils/captalizeAfterSpace'
import { comparePassword, hashPassword } from '~/utils/hashPassword'
import { signToken } from '~/utils/jwt'
import _ from 'lodash'
import { randomPassword } from '~/utils/random'
import { emailVerifyTokenBodyType } from '~/middlewares/emailVerifyToken.middlewares'
import { ObjectId } from 'mongodb'
import { JwtPayload } from 'jsonwebtoken'

/**
 * Description: Đăng ký tài khoản mới
 * Req.body: first_name, last_name, email, phone, password
 * Response: message, data
 * Data: user: { _id, first_name, last_name, email }
 */
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
  // Tao _id cho user
  const _id = new ObjectId()

  // Tạo email verify token
  const email_verify_token = await signToken({
    payload: {
      _id: _id
    },
    secretKey: process.env.EMAIL_VERIFY_TOKEN as string,
    expiresIn: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
  })

  // Tạo user trong mongodb
  const user = new Users({
    ...data,
    _id,
    email_verify_token,
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

/**
 * Description: Verify Email sau khi đăng ký tài khoản thành công
 * Req.body: email_verify_token
 * req.decoded_email_verify_token: _id
 * Response: message
 * @param decoded
 * @param data
 * @returns
 */
export const verifyEmailServices = async (decoded: JwtPayload, data: emailVerifyTokenBodyType) => {
  const { _id } = decoded
  const { email_verify_token } = data
  // Tìm user theo _id và kiểm tra email_verify_token
  const user = await Users.findOne({ _id, email_verify_token })
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND_OR_EMAIL_HAS_BEEN_VERIFIED,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  // Kiểm tra email đã được verify chưa
  if (user.isActive()) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_IS_VERIFIED,
      statusCode: httpStatus.FORBIDDEN // Lỗi 403 là lỗi khi user đã được verify
    })
  }
  // Update email_verified thành true
  await Users.findByIdAndUpdate(user._id, {
    email_verified: true,
    email_verify_token: '',
    updated_at: new Date()
  })
  return {
    message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY
  }
}

/**
 * Description: Resend Email Verify Token Sau khi user không nhận được email verify token
 * Req.body: email
 * Response: message
 *
 */

export const resendEmailVerifyServices = async (data: resendEmailVerifyTokenBodyType) => {
  const { email } = data
  // Kiểm tra email có tồn tại không
  const user = await Users.findOne({ email })
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  // Kiểm tra email đã được verify chưa
  if (user.email_verified) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_IS_VERIFIED,
      statusCode: httpStatus.FORBIDDEN
    })
  }
  // Tạo mới email verify token
  const email_verify_token = await signToken({
    payload: {
      _id: user._id
    },
    secretKey: process.env.EMAIL_VERIFY_TOKEN as string,
    expiresIn: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
  })
  // Update email_verify_token trong db
  await Users.findByIdAndUpdate(user._id, {
    email_verify_token
  })
  return {
    message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY
  }
}

/**
 * Description: Đăng nhập tài khoản
 * Req.body: email, password
 * Response: message, data
 * Data: accessToken, refreshToken
 * @param data
 * @returns
 */
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
      statusCode: httpStatus.LOCKED
    })
  }
  // Kiểm tra password
  const isMatch = await comparePassword(password, user.password)
  // Nếu password không đúng thì tăng loginAttempts lên 1 và kiểm tra xem có đạt mức tối đa chưa
  if (!isMatch) {
    user.loginAttempts += 1
    const MAX_LOGIN_ATTEMPTS = 5
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      await Users.findByIdAndUpdate(user._id, {
        locked: true
      })
      await user.save()
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCOUNT_LOCKED,
        statusCode: httpStatus.LOCKED
      })
    } else {
      await user.save()
    }

    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCOUNT_WILL_BE_LOCKED + ` ${MAX_LOGIN_ATTEMPTS - user.loginAttempts} times`,
      statusCode: httpStatus.BAD_REQUEST
    })
  }
  // Reset loginAttempts về 0
  await Users.findByIdAndUpdate(user._id, {
    loginAttempts: 0
  })

  // Ký JWT
  const [accessToken, refreshToken] = await Promise.all([
    signToken({
      payload: {
        _id: user._id,
        role: user.role,
        email_verified: user.email_verified
      },
      secretKey: process.env.ACCESS_TOKEN as string,
      expiresIn: process.env.EXPIRE_ACCESS_TOKEN as string
    }),
    signToken({
      payload: {
        _id: user._id,
        role: user.role
      },
      secretKey: process.env.REFRESH_TOKEN as string,
      expiresIn: process.env.EXPIRE_REFRESH_TOKEN as string
    })
  ])
  // Kiểm tra user_id đã có refresh token trong db chưa
  const refreshTokenExist = await RefreshToken.findOne({ user_id: user._id })
  // Nếu có thì update refresh token
  if (refreshTokenExist) {
    await RefreshToken.findByIdAndUpdate(refreshTokenExist._id, {
      refresh_token: refreshToken
    })
  } else {
    // Nếu chưa thì tạo mới refresh token
    const newRefreshToken = new RefreshToken({
      user_id: user._id,
      refresh_token: refreshToken
    })
    await newRefreshToken.save()
  }

  // Trả về thông tin token
  return {
    message: USER_MESSAGE.LOGIN_SUCCESSFULLY,
    data: {
      accessToken,
      refreshToken
    }
  }
}

/**
 * Description: Đăng xuất tài khoản
 * Req.body: refresh_token
 * Req.Authorization: Bearer accessToken
 * Response: message
 * @param data
 * @returns
 */
export const logoutServices = async (data: refreshTokenBodyType) => {
  const { refresh_token } = data
  // Kiểm tra refresh token có tồn tại trong db không
  const refreshToken = await RefreshToken.findOne({ refresh_token })
  if (!refreshToken) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.REFRESH_TOKEN_USED_OR_NOT_IN_DATABASE,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }
  // Xóa refresh token trong db
  await RefreshToken.findByIdAndDelete(refreshToken._id)
  return {
    message: USER_MESSAGE.LOGOUT_SUCCESSFULLY
  }
}

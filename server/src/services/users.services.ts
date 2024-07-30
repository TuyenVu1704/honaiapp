import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { refreshTokenBodyType } from '~/middlewares/refreshToken.middlewares'
import {
  adminUpdateUserProfileBodyType,
  loginUserBodyType,
  registerUserBodyType,
  resendEmailVerifyTokenBodyType
} from '~/middlewares/users.middlewares'
import RefreshToken from '~/models/RefreshToken.schema'
import Users from '~/models/Users.schema'
import { capitalizeAfterSpace } from '~/utils/captalizeAfterSpace'
import { comparePassword, hashPassword } from '~/utils/hashPassword'
import {
  generateAccessToken,
  generateEmailVerifyDeviceToken,
  generateEmailVerifyToken,
  generateRefreshToken,
  signToken
} from '~/utils/jwt'
import _ from 'lodash'
import { randomPassword } from '~/utils/random'
import { ObjectId } from 'mongodb'
import { sendMail } from '~/config/mailConfig'
import { cacheUser, deleteCachedUser, getCachedUser, getLoginAttempts, updateLoginAttempts } from '~/utils/redisUtils'
import { checkUserExistence } from '~/utils/checkUserExitence'

/**
 * Description: Đăng ký tài khoản mới
 * Req.body: first_name, last_name, email, phone, password
 * Response: message, data
 * Data: user: { _id, first_name, last_name, email, phone, role, MSNV, username, password} }
 */
export const registerUserServices = async ({
  first_name,
  last_name,
  full_name,
  email,
  phone,
  password,
  MSNV,
  username
}: registerUserBodyType) => {
  //Viết hoa chữ cái đầu của first_name và last_name va full_name
  const [firstname, lastname, fullname] = await Promise.all([
    capitalizeAfterSpace(first_name),
    capitalizeAfterSpace(last_name),
    capitalizeAfterSpace(full_name)
  ])
  // Check email và phone đã tồn tại chưa
  await checkUserExistence(email, phone)

  // Xoá cache user
  await deleteCachedUser(email)

  // Tao _id cho user
  const _id = new ObjectId()
  // Tạo email verify token
  const email_verify_token = await generateEmailVerifyToken({
    _id: _id.toString()
  })
  // Tạo url verify email
  const verifyEmailUrl = `${process.env.CLIENT_URL}/verify-email?token=${email_verify_token}`
  // Gửi email verify token cho user
  await sendMail({
    to: email,
    subject: 'Verify Email',
    templateName: 'verifyEmail',
    dynamic_Field: {
      name: first_name,
      verifyEmailUrl,
      expirationTime: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
    }
  })
  const hashedPassword = password === '' ? await randomPassword(6) : await hashPassword(password as string)
  // Tạo user trong mongodb
  const user = new Users({
    _id,
    first_name: firstname,
    last_name: lastname,
    full_name: fullname,
    email,
    phone,
    password: hashedPassword,
    email_verify_token
  })
  await user.save()
  return {
    message: USER_MESSAGE.REGISTER_SUCCESSFULLY,
    data: {
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        email: user.email
      }
    }
  }
}

/**
 * Description: Verify Email sau khi đăng ký tài khoản thành công
 * Req.query: email_verify_token
 * req.decoded_email_verify_token: _id
 * Response: message
 * @param decoded
 * @param data
 * @returns
 */
export const verifyEmailServices = async ({ _id, token }: { _id: string; token: string }) => {
  // Tìm user theo _id và kiểm tra email_verify_token
  const user = await Users.findOne({ _id, email_verify_token: token })
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND_OR_EMAIL_HAS_BEEN_VERIFIED,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  // Kiểm tra email đã được verify chưa
  if (user.email_verified) {
    return {
      message: USER_MESSAGE.USER_IS_VERIFIED
    }
  }
  // Update email_verified thành true
  await Users.findByIdAndUpdate(
    _id,
    {
      email_verified: true,
      email_verify_token: ''
    },
    { new: true }
  )
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

export const resendEmailVerifyServices = async ({ email }: { email: string }) => {
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
    return {
      message: USER_MESSAGE.USER_IS_VERIFIED
    }
  }
  // Tạo mới email verify token
  const email_verify_token = await generateEmailVerifyToken({
    _id: user._id as string
  })

  // Tạo url verify email
  const verifyEmailUrl = `${process.env.CLIENT_URL}/verify-email?token=${email_verify_token}`
  // Gửi email verify token cho user
  await sendMail({
    to: user.email,
    subject: 'Verify Email',
    templateName: 'verifyEmail',
    dynamic_Field: {
      name: user.first_name,
      verifyEmailUrl,
      expirationTime: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
    }
  })
  // Update email_verify_token trong db và trả về giá trị mới
  await Users.findByIdAndUpdate(
    user._id,
    {
      email_verify_token
    },
    { new: true }
  )

  return {
    message: USER_MESSAGE.RESEND_EMAIL_VERIFY_SUCCESSFULLY
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
  const { email, password, device_id } = data

  // Kiểm tra cache trước khi kiểm tra trong db
  let user = await getCachedUser(email)

  if (!user) {
    user = await Users.findOne({ email })?.select('email first_name devices role loginAttempts password email_verified')
    if (user) {
      await cacheUser(email, user)
    }
  }

  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT,
      statusCode: httpStatus.BAD_REQUEST
    })
  }

  // Kiểm tra số lần đăng nhập thất bại
  const loginAttempts = await getLoginAttempts(email)
  if (loginAttempts >= 5) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCOUNT_LOCKED,
      statusCode: httpStatus.LOCKED
    })
  }

  // Kiểm tra password
  const isMatch = await comparePassword(password, user.password)
  // Nếu password không đúng thì tăng loginAttempts lên 1 và kiểm tra xem có đạt mức tối đa chưa
  if (!isMatch) {
    const newAttempts = loginAttempts + 1
    await updateLoginAttempts(email, newAttempts)
    if (newAttempts >= 5) {
      await Users.findOneAndUpdate(user._id, {
        locked: true
      })

      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCOUNT_LOCKED,
        statusCode: httpStatus.LOCKED
      })
    }
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.ACCOUNT_WILL_BE_LOCKED + ` ${5 - newAttempts} times`,
      statusCode: httpStatus.BAD_REQUEST
    })
  }

  // Reset loginAttempts về 0
  await updateLoginAttempts(email, 0)

  // Kiểm tra thiết bị đã tồn tại chưa
  const deviceExist = user.devices.findIndex((device: any) => device.device_id === device_id)
  // -1 là chưa tồn tại
  if (deviceExist === -1) {
    const emailVerifyDeviceToken = await generateEmailVerifyDeviceToken({
      _id: user._id,
      device_id
    })
    console.log(emailVerifyDeviceToken)
    // Tạo url verify device
    const verificationUrl = `${process.env.CLIENT_URL}/verify-device?token=${emailVerifyDeviceToken}`
    // Gửi email verify device cho user
    await sendMail({
      to: user.email,
      subject: 'Verify Device',
      templateName: 'verifyDevice',
      dynamic_Field: {
        name: user.first_name,
        verificationUrl,
        expirationTime: process.env.EXPIRE_EMAIL_VERIFY_DEVICE_TOKEN as string
      }
    })
    return {
      message: USER_MESSAGE.VERIFY_DEVICE_SENT
    }
  }

  // Ký JWT
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken({
      _id: user._id,
      role: user.role,
      email_verified: user.email_verified
    }),
    generateRefreshToken({
      _id: user._id
    })
  ])

  // Kiểm tra user_id và device_id đã có refresh token chưa
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
  // Update device_id và last_login
  user.device_id = device_id
  user.last_login = new Date()

  // Xoá cache user cũ và cache user mới

  await cacheUser(user.email, user)

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
 * Description: Verify Device sau khi đăng nhập
 * Req.query: token
 * Req.decoded_email_verify_device_token: _id, device_id
 * Response: message
 * @param data
 * @returns
 */

export const verifyDeviceService = async ({ _id, device_id }: { _id: string; device_id: string }) => {
  // Tìm user theo _id
  const user = await Users.findById(_id)
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  //Xoá cache user cũ
  await deleteCachedUser(user.email)
  // Update device và last_login
  user.device_id = device_id
  user.last_login = new Date()
  await user.save()
  // Xoá cache user cũ và cache user mới

  await cacheUser(user.email, user)
  return {
    message: USER_MESSAGE.VERIFY_DEVICE_SUCCESSFULLY
  }
}

/**
 * Description: Refresh Token
 * Req.body: refresh_token
 * Req.decoded_refresh_token: _id
 */

export const refreshTokenServices = async ({ _id, refresh_token }: { _id: string; refresh_token: string }) => {
  // Kiểm tra refresh token có tồn tại trong db không
  const [refreshToken, user] = await Promise.all([
    RefreshToken.findOne({ refresh_token }),
    Users.findById(_id).select('email role email_verified')
  ])

  if (!refreshToken) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.REFRESH_TOKEN_USED_OR_NOT_IN_DATABASE,
      statusCode: httpStatus.UNAUTHORIZED
    })
  }
  // Kiểm tra user có tồn tại không
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  // Ký lại access token và refresh token mới
  const [accessToken, newRefreshToken] = await Promise.all([
    generateAccessToken({
      _id,
      role: user.role,
      email_verified: user.email_verified
    }),
    generateRefreshToken({
      _id
    })
  ])

  // Update refresh token trong db
  refreshToken.refresh_token = newRefreshToken
  await refreshToken.save()

  return {
    message: USER_MESSAGE.REFRESH_TOKEN_SUCCESSFULLY,
    data: {
      accessToken
    }
  }
}

/**
 * Description: Get Me
 * Req.user: _id
 * Response: message, data
 */

export const getMeServices = async (user_id: string) => {
  const user = await Users.findById(user_id).select([
    '-password',
    '-email_verify_token',
    '-reset_password_token',
    '-password_reseted_at',
    '-loginAttempts',
    '-locked',
    '-confirmToken',
    '-__v'
  ])
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  // trả về thông tin user
  // Lấy thông tin các trường cần thiết bằng mongoose

  return {
    message: USER_MESSAGE.GET_ME_SUCCESSFULLY,
    data: {
      user
    }
  }
}

/**
 * Description: Get Profile User
 * Roles: Admin
 * Req.params: id
 * Response: message, data
 */

export const getProfileUserService = async (id: string) => {
  const user = await Users.findById(id).select('-password')
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  return {
    message: USER_MESSAGE.GET_PROFILE_SUCCESSFULLY,
    data: {
      user
    }
  }
}

/**
 * Description: Get All Users
 * Roles: Admin
 * Filter: first_name, email, phone, department, position, role
 * Pagination: page, limit
 * Sort: department, position, role
 * Req.query: page, limit
 * Response: message, data
 * Data: users: [{ _id, first_name, last_name, email, phone, department, position,role, avatar}]
 * @param query
 * @returns
 */

export const getAllUsersServices = async (query: any) => {
  // Tách các trường đặc biệt
  const excludeFields = ['page', 'limit', 'sort', 'fields']
  // Xoá các trường đặc biệt ra khỏi query
  excludeFields.forEach((el) => delete query[el])
  // Format lại query theo cú pháp mongodb
  let queryString = JSON.stringify(query)
  queryString = queryString.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`)
  const formatedQuery = JSON.parse(queryString)

  // Filter
}

/**
 * Description: User update thông tin cá nhân
 * Req.body:  avatar, cover
 * Req.user: _id
 * Response: message
 * @param data
 * @param decoded
 * @returns
 */

export const updateAvatarService = async (urlAvatar: string, _id: string) => {
  const user = await Users.findById(_id)
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  // Update avatar trong db
  await Users.findByIdAndUpdate(_id, {
    avatar: urlAvatar
  })
  return {
    message: USER_MESSAGE.UPDATE_AVATAR_SUCCESSFULLY
  }
}

/**
 * Description: Admin update thông tin user
 * Req.body: first_name, last_name, email, phone, role, permission, department, position, device, email_verified, avatar
 * Req.params: id
 * Req.user: _id
 * Response: message,data
 */

export const adminUpdateUserProfileServices = async (data: adminUpdateUserProfileBodyType, id: string) => {
  const user = await Users.findById(id)
  if (!user) {
    throw new ErrorWithStatusCode({
      message: USER_MESSAGE.USER_NOT_FOUND,
      statusCode: httpStatus.NOT_FOUND
    })
  }
  // Kiểm tra email và phone đã tồn tại chưa
  if (data.email) {
    const emailExist = (await Users.findOne({ email: data.email })) as { _id: string }
    if (emailExist && emailExist._id.toString() !== id) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.EMAIL_EXISTED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
  }
  if (data.phone) {
    const phoneExist = (await Users.findOne({ phone: data.phone })) as { _id: string }
    if (phoneExist && phoneExist._id.toString() !== id) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.PHONE_EXISTED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
  }
  // Update thông tin user
  await Users.findByIdAndUpdate(id, {
    ...data,
    updated_at: new Date()
  })

  return {
    message: USER_MESSAGE.UPDATE_USER_PROFILE_SUCCESSFULLY,
    data: { ...data }
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

import { config } from 'dotenv'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { registerUserBodyType, registerUserResType } from '~/middlewares/users.middlewares'
import Users, { IUser } from '~/models/Users.schema'
import { redis } from './cache.services'
import { signToken } from '~/utils/jwt'
import { emailVerifyTokenSchema, emailVerifyTokenSchemaType } from '~/middlewares/emailVerifyToken.middlewares'
import {
  emailVerifyDeviceTokenSchema,
  emailVerifyDeviceTokenSchemaType
} from '~/middlewares/emailVerifyDevice.Middlewares'
import { accessTokenPayloadSchema, accessTokenPayloadType } from '~/middlewares/accessToken.middlewares'
import { refreshTokenPayloadSchema, refreshTokenPayloadType } from '~/middlewares/refreshToken.middlewares'
import { sendMail } from '~/config/mailConfig'
import e, { Request } from 'express'
import Devices, { IDevice } from '~/models/Devices'
import { UAParser } from 'ua-parser-js'
import { capitalizeAfterSpace } from '~/utils/capitalizeAfterSpace'
import { convertoIPv4 } from '~/utils/ipConverter'

config()
class UserService {
  private static instance: UserService
  // Lấy key cache user
  private getCacheKey(identifier: string): string {
    return `user:${identifier}`
  }

  // Lấy user từ cache
  public getUserByIdentifierCache = async (identifier: string) => {
    const cacheKey = this.getCacheKey(identifier)
    const cachedUser = await redis.get(cacheKey)
    if (cachedUser) {
      console.log('Get User Cache', cachedUser)
      return cachedUser
    }

    // Nếu không có trong cache thì lấy từ db
    const user = await Users.findOne({ $or: [{ email: identifier }, { phone: identifier }, { username: identifier }] })
    if (user) {
      await redis.set(cacheKey, JSON.parse(user.toObject()), { EX: 3600 })
    }
    console.log('Get User DB', user)
    return user
  }

  // Update cache user
  private updateUserCache = async (user_id: string, updateUser: IUser) => {
    const user = await Users.findByIdAndUpdate(user_id, updateUser, { new: true })
    if (user) {
      await redis.set(this.getCacheKey(user.email), JSON.parse(user.toObject()), { EX: 3600 })
      if (user.phone) {
        await redis.set(this.getCacheKey(user.phone), JSON.parse(user.toObject()), { EX: 3600 })
      }
      if (user.username) {
        await redis.set(this.getCacheKey(user.username), JSON.parse(user.toObject()), { EX: 3600 })
      }
    }
    console.log('Update cache User', user)
    return user
  }
  public async deleteUserCache(identifier: string) {
    const cacheKey = this.getCacheKey(identifier)
    console.log('Delete cache User', cacheKey)
    await redis.del(cacheKey)
  }

  // Hàm lấy thông tin đăng nhập thất bại
  public getLoginAttempts = async (email: string) => {
    const cacheKey = `loginAttempts:${email}`
    const loginAttempts = await redis.get(cacheKey)
    return loginAttempts ? parseInt(loginAttempts) : 0
  }

  // Hàm update số lần đăng nhập thất bại
  public updateLoginAttempts = async (email: string, loginAttempts: number) => {
    const cacheKey = `loginAttempts:${email}`
    await redis.set(cacheKey, loginAttempts, { EX: 3600
    })
  }

  // Hàm tạo mật khẩu ngẫu nhiên
  public randomPassword = async (length: number): Promise<string> => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  //Hàm hash password
  public hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUND))
    return await bcrypt.hash(password, salt)
  }

  comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash)
  }

  // Hàm lấy thông tin thiết bị trên req
  public getDeviceInfo = async (req: Request): Promise<IDevice> => {
    const ua = new UAParser(req.headers['user-agent'])
    const device_id = ua.getDevice().model || 'unknown'
    const type = ua.getDevice().type || 'unknown'
    const os = ua.getOS().name || 'unknown'
    const browser = ua.getBrowser().name || 'unknown'
    const rawip = req.ip || req.socket.remoteAddress || 'unknown'
    const ip = await convertoIPv4(rawip)

    return {
      device_id,
      type,
      os,
      browser,
      ip
    }
  }

  

  // Kiểm tra xem tài khoản có tồn tại không
  private async checkUserExistence(email: string, phone: string, username: string) {
    // Check User Existence
    const userExits = await Users.findOne({ $or: [{ email }, { phone }, { username }] })
    // Check email đã tồn tại chưa
    if (userExits?.email === email) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.EMAIL_EXISTED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
    // Check phone đã tồn tại chưa
    if (userExits?.phone === phone) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.PHONE_EXISTED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
    // Check username đã tồn tại chưa
    if (userExits?.username === username) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.USERNAME_EXISTED,
        statusCode: httpStatus.BAD_REQUEST
      })
    }
  }

  // Tạo Email Verify Token
  private async generateEmailVerifyToken(payload: emailVerifyTokenSchemaType) {
    const validatePayload = emailVerifyTokenSchema.parse(payload)
    return signToken({
      payload: validatePayload,
      secretKey: process.env.EMAIL_VERIFY_TOKEN as string,
      expiresIn: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
    })
  }

  // Tạo Email Verify Device Token
  private async generateEmailVerifyDeviceToken(payload: emailVerifyDeviceTokenSchemaType) {
    const validatePayload = emailVerifyDeviceTokenSchema.parse(payload)
    return signToken({
      payload: validatePayload,
      secretKey: process.env.EMAIL_VERIFY_DEVICE_TOKEN as string,
      expiresIn: process.env.EXPIRE_EMAIL_VERIFY_DEVICE_TOKEN as string
    })
  }

  // Tạo AccessToken
  private async generateAccessToken(payload: accessTokenPayloadType) {
    const validatePayload = accessTokenPayloadSchema.parse(payload)
    return signToken({
      payload: validatePayload,
      secretKey: process.env.ACCESS_TOKEN as string,
      expiresIn: process.env.EXPIRE_ACCESS_TOKEN as string
    })
  }

  // Tạo Refresh Token
  private async generateRefreshToken(payload: refreshTokenPayloadType) {
    const validatePayload = refreshTokenPayloadSchema.parse(payload)
    return signToken({
      payload: validatePayload,
      secretKey: process.env.REFRESH_TOKEN as string,
      expiresIn: process.env.EXPIRE_REFRESH_TOKEN as string
    })
  }

  // Tạo access token và refresh token
  private async generateAccessTokenAndRefreshToken(payload: accessTokenPayloadType) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken({ _id: payload._id })
    ])
    return [accessToken, refreshToken]
  }

  private constructor() {}
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }
  /**
   * Description: Đăng ký tài khoản mới
   * Req.body: first_name, last_name, email, phone, password, MSNV, username
   * Response: message, data
   */
  async registerUser({
    first_name,
    last_name,
    full_name,
    email,
    phone,
    password,
    employee_code,
    username,
    role
  }: registerUserBodyType) {
    // Viết hoa chữ cái đầu của first_name và last_name va full_name
    const [firstName, lastName, fullName] = await Promise.all([
      capitalizeAfterSpace(first_name),
      capitalizeAfterSpace(last_name),
      capitalizeAfterSpace(full_name)
    ])
    // Check email, phone và username đã tồn tại chưa
    await this.checkUserExistence(email, phone, username)
    // Xoá cache user
    await this.deleteUserCache(email)

    // Tao _id cho user
    const _id = new ObjectId()
    // Tạo email verify token
    const email_verify_token = await this.generateEmailVerifyToken({
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
    const hashedPassword = password === '' ? await this.randomPassword(6) : await this.hashPassword(password as string)
    // Tạo user trong mongodb
    const user = await Users.create({
      _id: _id,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email,
      phone,
      password: hashedPassword,
      email_verify_token,
      employee_code,
      username,
      role
    })
    const response: registerUserResType = {
      message: USER_MESSAGE.REGISTER_USER_SUCCESSFULLY,
      data: {
        user: {
          employee_code: user.employee_code,
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role.toString(),
          permissions: user.permissions,
          department: user.department,
          position: user.position
        }
      }
    }
    return response
  }

  /**
   * Description: Verify Email sau khi đăng ký tài khoản thành công
   * Req.query: email_verify_token
   * req.decoded_email_verify_token: _id
   * Response: message
   */
  async verifyEmail({ _id, token, deviceInfo }: { _id: string; token: string; deviceInfo: IDevice }) {
    // Tìm user theo _id và kiểm tra email_verify_token
    const user = await Users.findOne({ _id, email_verify_token: token })
    // Nếu không tìm thấy user thì trả về lỗi
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
    // Update device và last_login
    await Devices.create({
      user_id: _id,
      device_id: deviceInfo.device_id,
      type: deviceInfo.type,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      ip: deviceInfo.ip,
      last_login: new Date()
    })
    return {
      message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY
    }
  }

  /**
   * Description: Resend Email Verify Token Sau khi user không nhận được email verify token
   * Req.body: email
   * Response: message
   */

  async resendEmailVerifyServices({ email }: { email: string }) {
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
    const email_verify_token = await this.generateEmailVerifyToken({
      _id: user._id.toString()
    })
    console.log(email_verify_token)
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
   * Req.body: email, password, device_id
   * Response: message, data { accessToken, refreshToken }
   */

  async loginUser ({ email, password, device_id }: { email: string; password: string; device_id: string }) {
    // Kiểm tra user trong cache có tồn tại không
    const user = await this.getUserByIdentifierCache(email)
    // Nếu không có trong cache thì kiểm tra trong db
    if (!user) {
      const userDB = await Users.findOne({ email })
      if (userDB) {
        // Nếu có trong db thì lưu vào cache
        await this.updateUserCache((userDB._id as string ).toString(), userDB)
      }else {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT,
          statusCode: httpStatus.BAD_REQUEST
        })
      }

    }
   // Kiểm tra số lần đăng nhập thất bại


  // export const loginServices = async (data: loginUserBodyType) => {
  //   const { email, password, device_id } = data

  //   // Kiểm tra cache trước khi kiểm tra trong db
  //   let user = await getCachedUser(email)

  //   if (!user) {
  //     user = await Users.findOne({ email })?.select('email first_name devices role loginAttempts password email_verified')
  //     if (user) {
  //       await cacheUser(email, user)
  //     }
  //   }

  //   if (!user) {
  //     throw new ErrorWithStatusCode({
  //       message: USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT,
  //       statusCode: httpStatus.BAD_REQUEST
  //     })
  //   }

  //   // Kiểm tra số lần đăng nhập thất bại
  //   const loginAttempts = await getLoginAttempts(email)
  //   if (loginAttempts >= 5) {
  //     throw new ErrorWithStatusCode({
  //       message: USER_MESSAGE.ACCOUNT_LOCKED,
  //       statusCode: httpStatus.LOCKED
  //     })
  //   }

  //   // Kiểm tra password
  //   const isMatch = await comparePassword(password, user.password)
  //   // Nếu password không đúng thì tăng loginAttempts lên 1 và kiểm tra xem có đạt mức tối đa chưa
  //   if (!isMatch) {
  //     const newAttempts = loginAttempts + 1
  //     await updateLoginAttempts(email, newAttempts)
  //     if (newAttempts >= 5) {
  //       await Users.findOneAndUpdate(user._id, {
  //         locked: true
  //       })

  //       throw new ErrorWithStatusCode({
  //         message: USER_MESSAGE.ACCOUNT_LOCKED,
  //         statusCode: httpStatus.LOCKED
  //       })
  //     }
  //     throw new ErrorWithStatusCode({
  //       message: USER_MESSAGE.ACCOUNT_WILL_BE_LOCKED + ` ${5 - newAttempts} times`,
  //       statusCode: httpStatus.BAD_REQUEST
  //     })
  //   }

  //   // Reset loginAttempts về 0
  //   await updateLoginAttempts(email, 0)

  //   // Kiểm tra thiết bị đã tồn tại chưa
  //   const deviceExist = user.devices.findIndex((device: any) => device.device_id === device_id)
  //   // -1 là chưa tồn tại
  //   if (deviceExist === -1) {
  //     const emailVerifyDeviceToken = await generateEmailVerifyDeviceToken({
  //       _id: user._id,
  //       device_id
  //     })
  //     console.log(emailVerifyDeviceToken)
  //     // Tạo url verify device
  //     const verificationUrl = `${process.env.CLIENT_URL}/verify-device?token=${emailVerifyDeviceToken}`
  //     // Gửi email verify device cho user
  //     await sendMail({
  //       to: user.email,
  //       subject: 'Verify Device',
  //       templateName: 'verifyDevice',
  //       dynamic_Field: {
  //         name: user.first_name,
  //         verificationUrl,
  //         expirationTime: process.env.EXPIRE_EMAIL_VERIFY_DEVICE_TOKEN as string
  //       }
  //     })
  //     return {
  //       message: USER_MESSAGE.VERIFY_DEVICE_SENT
  //     }
  //   }

  //   // Ký JWT
  //   const [accessToken, refreshToken] = await Promise.all([
  //     generateAccessToken({
  //       _id: user._id,
  //       role: user.role,
  //       email_verified: user.email_verified
  //     }),
  //     generateRefreshToken({
  //       _id: user._id
  //     })
  //   ])

  //   // Kiểm tra user_id và device_id đã có refresh token chưa
  //   const refreshTokenExist = await RefreshToken.findOne({ user_id: user._id })
  //   // Nếu có thì update refresh token
  //   if (refreshTokenExist) {
  //     await RefreshToken.findByIdAndUpdate(refreshTokenExist._id, {
  //       refresh_token: refreshToken
  //     })
  //   } else {
  //     // Nếu chưa thì tạo mới refresh token
  //     const newRefreshToken = new RefreshToken({
  //       user_id: user._id,
  //       refresh_token: refreshToken
  //     })
  //     await newRefreshToken.save()
  //   }
  //   // Update device_id và last_login
  //   user.device_id = device_id
  //   user.last_login = new Date()

  //   // Xoá cache user cũ và cache user mới

  //   await cacheUser(user.email, user)

  //   // Trả về thông tin token
  //   return {
  //     message: USER_MESSAGE.LOGIN_SUCCESSFULLY,
  //     data: {
  //       accessToken,
  //       refreshToken
  //     }
  //   }
  // }
}

export const userService = UserService.getInstance()

//

// /**
//  * Description: Verify Device sau khi đăng nhập
//  * Req.query: token
//  * Req.decoded_email_verify_device_token: _id, device_id
//  * Response: message
//  * @param data
//  * @returns
//  */

// export const verifyDeviceService = async ({ _id, device_id }: { _id: string; device_id: string }) => {
//   // Tìm user theo _id
//   const user = await Users.findById(_id)
//   if (!user) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.USER_NOT_FOUND,
//       statusCode: httpStatus.NOT_FOUND
//     })
//   }
//   //Xoá cache user cũ
//   await deleteCachedUser(user.email)
//   // Update device và last_login
//   user.device_id = device_id
//   user.last_login = new Date()
//   await user.save()
//   // Xoá cache user cũ và cache user mới

//   await cacheUser(user.email, user)
//   return {
//     message: USER_MESSAGE.VERIFY_DEVICE_SUCCESSFULLY
//   }
// }

// /**
//  * Description: Refresh Token
//  * Req.body: refresh_token
//  * Req.decoded_refresh_token: _id
//  */

// export const refreshTokenServices = async ({ _id, refresh_token }: { _id: string; refresh_token: string }) => {
//   // Kiểm tra refresh token có tồn tại trong db không
//   const [refreshToken, user] = await Promise.all([
//     RefreshToken.findOne({ refresh_token }),
//     Users.findById(_id).select('email role email_verified')
//   ])

//   if (!refreshToken) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.REFRESH_TOKEN_USED_OR_NOT_IN_DATABASE,
//       statusCode: httpStatus.UNAUTHORIZED
//     })
//   }
//   // Kiểm tra user có tồn tại không
//   if (!user) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.USER_NOT_FOUND,
//       statusCode: httpStatus.NOT_FOUND
//     })
//   }
//   // Ký lại access token và refresh token mới
//   const [accessToken, newRefreshToken] = await Promise.all([
//     generateAccessToken({
//       _id,
//       role: user.role,
//       email_verified: user.email_verified
//     }),
//     generateRefreshToken({
//       _id
//     })
//   ])

//   // Update refresh token trong db
//   refreshToken.refresh_token = newRefreshToken
//   await refreshToken.save()

//   return {
//     message: USER_MESSAGE.REFRESH_TOKEN_SUCCESSFULLY,
//     data: {
//       accessToken
//     }
//   }
// }

// /**
//  * Description: Get Me
//  * Req.user: _id
//  * Response: message, data
//  */

// export const getMeServices = async (user_id: string) => {
//   const user = await Users.findById(user_id).select([
//     '-password',
//     '-email_verify_token',
//     '-reset_password_token',
//     '-password_reseted_at',
//     '-loginAttempts',
//     '-locked',
//     '-confirmToken',
//     '-__v'
//   ])
//   if (!user) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.USER_NOT_FOUND,
//       statusCode: httpStatus.NOT_FOUND
//     })
//   }
//   // trả về thông tin user
//   // Lấy thông tin các trường cần thiết bằng mongoose

//   return {
//     message: USER_MESSAGE.GET_ME_SUCCESSFULLY,
//     data: {
//       user
//     }
//   }
// }

// /**
//  * Description: Get Profile User
//  * Roles: Admin
//  * Req.params: id
//  * Response: message, data
//  */

// export const getProfileUserService = async (id: string) => {
//   const user = await Users.findById(id).select('-password')
//   if (!user) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.USER_NOT_FOUND,
//       statusCode: httpStatus.NOT_FOUND
//     })
//   }
//   return {
//     message: USER_MESSAGE.GET_PROFILE_SUCCESSFULLY,
//     data: {
//       user
//     }
//   }
// }

// /**
//  * Description: Get All Users
//  * Roles: Admin
//  * Filter: first_name, email, phone, department, position, role
//  * Pagination: page, limit
//  * Sort: department, position, role
//  * Req.query: page, limit
//  * Response: message, data
//  * Data: users: [{ _id, first_name, last_name, email, phone, department, position,role, avatar}]
//  * @param query
//  * @returns
//  */

// export const getAllUsersServices = async (query: any) => {
//   // Tách các trường đặc biệt
//   const excludeFields = ['page', 'limit', 'sort', 'fields']
//   // Xoá các trường đặc biệt ra khỏi query
//   excludeFields.forEach((el) => delete query[el])
//   // Format lại query theo cú pháp mongodb
//   let queryString = JSON.stringify(query)
//   queryString = queryString.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`)
//   const formatedQuery = JSON.parse(queryString)

//   // Filter
// }

// /**
//  * Description: User update thông tin cá nhân
//  * Req.body:  avatar, cover
//  * Req.user: _id
//  * Response: message
//  * @param data
//  * @param decoded
//  * @returns
//  */

// export const updateAvatarService = async (urlAvatar: string, _id: string) => {
//   const user = await Users.findById(_id)
//   if (!user) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.USER_NOT_FOUND,
//       statusCode: httpStatus.NOT_FOUND
//     })
//   }
//   // Update avatar trong db
//   await Users.findByIdAndUpdate(_id, {
//     avatar: urlAvatar
//   })
//   return {
//     message: USER_MESSAGE.UPDATE_AVATAR_SUCCESSFULLY
//   }
// }

// /**
//  * Description: Admin update thông tin user
//  * Req.body: first_name, last_name, email, phone, role, permission, department, position, device, email_verified, avatar
//  * Req.params: id
//  * Req.user: _id
//  * Response: message,data
//  */

// export const adminUpdateUserProfileServices = async (data: adminUpdateUserProfileBodyType, id: string) => {
//   const user = await Users.findById(id)
//   if (!user) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.USER_NOT_FOUND,
//       statusCode: httpStatus.NOT_FOUND
//     })
//   }
//   // Kiểm tra email và phone đã tồn tại chưa
//   if (data.email) {
//     const emailExist = (await Users.findOne({ email: data.email })) as { _id: string }
//     if (emailExist && emailExist._id.toString() !== id) {
//       throw new ErrorWithStatusCode({
//         message: USER_MESSAGE.EMAIL_EXISTED,
//         statusCode: httpStatus.BAD_REQUEST
//       })
//     }
//   }
//   if (data.phone) {
//     const phoneExist = (await Users.findOne({ phone: data.phone })) as { _id: string }
//     if (phoneExist && phoneExist._id.toString() !== id) {
//       throw new ErrorWithStatusCode({
//         message: USER_MESSAGE.PHONE_EXISTED,
//         statusCode: httpStatus.BAD_REQUEST
//       })
//     }
//   }
//   // Update thông tin user
//   await Users.findByIdAndUpdate(id, {
//     ...data,
//     updated_at: new Date()
//   })

//   return {
//     message: USER_MESSAGE.UPDATE_USER_PROFILE_SUCCESSFULLY,
//     data: { ...data }
//   }
// }

// /**
//  * Description: Đăng xuất tài khoản
//  * Req.body: refresh_token
//  * Req.Authorization: Bearer accessToken
//  * Response: message
//  * @param data
//  * @returns
//  */
// export const logoutServices = async (data: refreshTokenBodyType) => {
//   const { refresh_token } = data
//   // Kiểm tra refresh token có tồn tại trong db không
//   const refreshToken = await RefreshToken.findOne({ refresh_token })
//   if (!refreshToken) {
//     throw new ErrorWithStatusCode({
//       message: USER_MESSAGE.REFRESH_TOKEN_USED_OR_NOT_IN_DATABASE,
//       statusCode: httpStatus.UNAUTHORIZED
//     })
//   }
//   // Xóa refresh token trong db
//   await RefreshToken.findByIdAndDelete(refreshToken._id)
//   return {
//     message: USER_MESSAGE.LOGOUT_SUCCESSFULLY
//   }
// }

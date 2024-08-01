import { config } from 'dotenv'
import bcrypt from 'bcryptjs'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { registerUserBodyType, registerUserResType } from '~/middlewares/users.middlewares'
import Users, { IUser } from '~/models/Users.schema'
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
import { UAParser } from 'ua-parser-js'
import { capitalizeAfterSpace } from '~/utils/capitalizeAfterSpace'
import { convertoIPv4 } from '~/utils/ipConverter'
import Device, { IDevice } from '~/models/Devices.schema'
import RefreshToken from '~/models/RefreshToken.schema'
import cacheService from './redis.services'

config()
class UserService {
  private static instance: UserService

  // Tạo cache User
  private async cacheUserData(user: IUser) {
    const cacheKey = `user:${user.email}`
    await cacheService.set(cacheKey, JSON.stringify(user), 30 * 24 * 60 * 60) // 30 ngày
  }

  // Update User cache
  public async updateUserDataCache(user: IUser) {
    const cacheKey = `user:${user.email}`
    await cacheService.set(cacheKey, JSON.stringify(user), 30 * 24 * 60 * 60) // 30 ngày
  }

  // Lấy cache User
  private async getCachedUserData(_id: string) {
    const cacheKey = `user:${_id}`
    const user = await cacheService.get(cacheKey)
    return user ? JSON.parse(user) : null
  }

  // Hàm lấy thông tin user từ cache hoặc db
  public async getUserByIdCacheAndDB(user_id: string) {
    // Kiểm tra user trong cache có tồn tại không
    const cacheUser = await this.getCachedUserData(user_id)

    if (cacheUser) {
      console.log('Get User Cache')
      return cacheUser
    }

    const user = await Users.findById(user_id)
    if (!user) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.USER_NOT_FOUND,
        statusCode: httpStatus.NOT_FOUND
      })
    }
    console.log('Get User DB')
    await this.cacheUserData(user)
    return user
  }

  // Hàm cập nhật cache User và cập nhật User trong db
  public async updateUserByIdCacheAndDB(user_id: string, updateUser: IUser) {
    const user = await Users.findByIdAndUpdate(user_id, updateUser, { new: true })
    if (user) {
      await this.cacheUserData(user)
    }
    console.log('Cập nhật cache User')
    return user
  }

  // Hàm xóa cache User
  public async deleteUserCache(user_id: string) {
    const cacheKey = `user:${user_id}`
    console.log('Delete cache User', cacheKey)
    await cacheService.del(cacheKey)
  }

  // Hàm kiểm tra user có bị lock không
  public async isLocked(email: string) {
    const user = await Users.findOne({ email })
    return user?.locked
  }

  // Hàm cập nhật số lần đăng nhập thất bại
  public async updateLoginAttempts(email: string, loginAttempts: number) {
    const cacheKey = `loginAttempts:${email}`
    await cacheService.set(cacheKey, loginAttempts.toString(), 30 * 24 * 60 * 60) // Cache trong 30 ngày
  }

  // Hàm lấy số lần đăng nhập thất bại
  public async getLoginAttempts(email: string) {
    const cacheKey = `loginAttempts:${email}`
    const loginAttempts = await cacheService.get(cacheKey)
    return loginAttempts ? Number(loginAttempts) : 0
  }

  // Hàm cập nhật device cache
  private async updateDeviceCache(device: IDevice): Promise<void> {
    if (!device || !device.device_id) {
      console.error('Invalid device data for caching')
      return
    }
    const cacheKey = `device:${device.device_id}`
    await cacheService.set(cacheKey, JSON.stringify(device), 30 * 24 * 60 * 60) // Cache trong 30 ngày
    console.log(`Device cached with key: ${cacheKey}`)
  }

  // Hàm lấy device từ cache hoặc db
  private async getDeviceCache(device_id: string): Promise<IDevice | null> {
    const deviceKey = `device:${device_id}`
    const device = await cacheService.get(deviceKey)
    return device ? JSON.parse(device) : null
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
    const device_id = Math.random().toString(36).substring(7)
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
    } as IDevice
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
    const refresh_token = signToken({
      payload: validatePayload,
      secretKey: process.env.REFRESH_TOKEN as string,
      expiresIn: process.env.EXPIRE_REFRESH_TOKEN as string
    })
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
    const [firstName, lastName, fullName, userExist] = await Promise.all([
      capitalizeAfterSpace(first_name),
      capitalizeAfterSpace(last_name),
      capitalizeAfterSpace(full_name),
      this.checkUserExistence(email, phone, username)
    ])

    // Tạo email verify token và hash password
    const [email_verify_token, hashedPassword] = await Promise.all([
      this.generateEmailVerifyToken({
        username
      }),
      password === '' ? await this.randomPassword(6) : await this.hashPassword(password as string)
    ])

    // Tạo url verify email
    const verifyEmailUrl = `${process.env.CLIENT_URL}/verify-email?token=${email_verify_token}`

    //Tạo user trong mongodb và gửi email verify token
    const [user] = await Promise.all([
      Users.create({
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
      }),
      // Gửi email verify token cho user
      sendMail({
        to: email,
        subject: 'Verify Email',
        templateName: 'verifyEmail',
        dynamic_Field: {
          name: first_name,
          verifyEmailUrl,
          expirationTime: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
        }
      }),
      this.deleteUserCache(email) // Xoá cache user nếu có
    ])

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
  async verifyEmail({ username, token, deviceInfo }: { username: string; token: string; deviceInfo: IDevice }) {
    // Tìm user và cập nhật trong một lần truy vấn
    const updatedUser = await Users.findOneAndUpdate(
      {
        username,
        email_verify_token: token,
        email_verified: false // Thêm điều kiện này để đảm bảo chỉ cập nhật nếu chưa verify
      },
      {
        email_verified: true,
        email_verify_token: ''
        // Sử dụng $push để thêm thiết bị mới vào mảng
      },
      { new: true, runValidators: true }
    )

    // Nếu không tìm thấy user hoặc email đã được verify
    if (!updatedUser) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.USER_NOT_FOUND_OR_EMAIL_HAS_BEEN_VERIFIED,
        statusCode: httpStatus.NOT_FOUND
      })
    }

    // Tìm device và cập nhật trong một lần truy vấn
    const updatedDevice = await Device.findOneAndUpdate(
      {
        user_id: updatedUser._id,
        device_id: deviceInfo.device_id
      },
      {
        ...deviceInfo,
        user_id: updatedUser._id
      },
      { upsert: true, new: true, runValidators: true }
    )
    if (!updatedDevice) {
      console.error('Failed to update or create device')
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.DEVICE_UPDATE_FAILED,
        statusCode: httpStatus.INTERNAL_SERVER_ERROR
      })
    }

    // Cập nhật device vào cache
    console.log('Updated Device:', JSON.stringify(updatedDevice, null, 2))
    const device = await this.updateDeviceCache(updatedDevice)
    console.log('Updated Device Cache:', device)
    // Xóa và cập nhật user vào cache
    await Promise.all([this.deleteUserCache(updatedUser._id.toString()), this.cacheUserData(updatedUser)])

    return {
      message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY
    }
  }

  /**
   * Description: Resend Email Verify Token Sau khi user không nhận được email verify token
   * Req.body: email
   * Response: message
   */

  async resendEmailVerifyEmail({ email }: { email: string }) {
    // Tìm user và cập nhật email_verify_token trong một lần truy vấn
    const updatedUser = await Users.findOneAndUpdate(
      {
        email,
        email_verified: false // Chỉ tìm và cập nhật nếu email chưa được xác minh
      },
      {
        email_verify_token: await this.generateEmailVerifyToken({ username: email.split('@')[0] }) // Tạo token mới
      },
      { new: true, runValidators: true, select: 'email first_name email_verify_token' }
    )

    // Nếu không tìm thấy user hoặc email đã được xác minh
    if (!updatedUser) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.EMAIL_NOT_FOUND_OR_ALREADY_VERIFIED,
        statusCode: httpStatus.NOT_FOUND
      })
    }

    // Tạo URL xác minh email
    const verifyEmailUrl = `${process.env.CLIENT_URL}/verify-email?token=${updatedUser.email_verify_token}`

    // Gửi email xác minh
    await sendMail({
      to: updatedUser.email,
      subject: 'Verify Email',
      templateName: 'verifyEmail',
      dynamic_Field: {
        name: updatedUser.first_name,
        verifyEmailUrl,
        expirationTime: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
      }
    })

    return {
      message: USER_MESSAGE.RESEND_EMAIL_VERIFY_SUCCESSFULLY
    }
  }

  /**
   * Description: Đăng nhập tài khoản
   * Req.body: email, password, device_id
   * Response: message, data { accessToken, refreshToken }
   */

  async loginUser({ email, password, device_id }: { email: string; password: string; device_id: string }) {
    // Kiểm tra user trong cache và db có tồn tại không
    const [user, loginAttempts, isLocked] = await Promise.all([
      this.getUserByIdCacheAndDB(email),
      this.getLoginAttempts(email),
      this.isLocked(email)
    ])

    // Kiểm tra user có bị lock và số lần đăng nhập thất bại
    if (isLocked || loginAttempts >= 5) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCOUNT_LOCKED,
        statusCode: httpStatus.LOCKED
      })
    }

    // Kiểm tra password
    const isMatch = await this.comparePassword(password, user.password)
    // Nếu password không đúng thì tăng loginAttempts lên 1 và kiểm tra xem có đạt mức tối đa chưa
    if (!isMatch) {
      const newAttempts = loginAttempts + 1
      await this.updateLoginAttempts(email, newAttempts)
      if (newAttempts >= 5) {
        await Users.findByIdAndUpdate(user._id, { locked: true })
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
    await this.updateLoginAttempts(email, 0)

    // Kiểm tra thiết bị đã tồn tại chưa
    const deviceExist = user.devices.some((device: any) => device.device_id === device_id)

    if (!deviceExist) {
      const emailVerifyDeviceToken = await this.generateEmailVerifyDeviceToken({
        _id: user._id,
        device_id
      })

      await Users.findByIdAndUpdate(user._id, {
        email_verify_device_token: emailVerifyDeviceToken
      })

      const verificationUrl = `${process.env.CLIENT_URL}/verify-device?token=${emailVerifyDeviceToken}`

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

    // Neu device da ton tai
    // Ký JWT

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken({
        _id: user._id,
        role: user.role,
        email_verified: user.email_verified
      }),
      this.generateRefreshToken({
        _id: user._id
      })
    ])

    // Tạo hoặc cập nhật refresh token
    const expiresIn = 30 * 24 * 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + expiresIn)

    // Luu refresh token vao db
    await RefreshToken.findOneAndUpdate(
      { user_id: user._id, device: device_id },
      {
        refresh_token: refreshToken,
        expires: expiresAt
      },
      { upsert: true, new: true }
    )
    // Cập nhật device_id và last_login
    user.device_id = device_id
    user.last_login = new Date()

    //Xóa cache user cũ và cache user mới
    await this.deleteUserCache(user._id.toString())

    // Cập nhật cache user
    await this.cacheUserData(user)

    // Lưu refreshToken vào redis
    await cacheService.set(`refreshToken:${user._id.toString()}:${device_id.toString()}`, refreshToken, expiresIn)

    return {
      message: USER_MESSAGE.LOGIN_SUCCESSFULLY,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    }
  }

  // Cập nhật refresh token cho thiết bị lưu vào db và redis

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

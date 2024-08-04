import { config } from 'dotenv'
import bcrypt from 'bcryptjs'
import { ErrorWithStatusCode } from '~/config/errors'
import httpStatus from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import {
  adminUpdateUserProfileBodyType,
  adminUpdateUserProfileResType,
  loginUserResType,
  registerUserBodyType,
  registerUserResType,
  resendEmailVerifyTokenResType,
  verifyEmailResType
} from '~/middlewares/users.middlewares'
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
import { Request } from 'express'
import { UAParser } from 'ua-parser-js'
import { convertoIPv4 } from '~/utils/ipConverter'
import Device, { IDevice } from '~/models/Devices.schema'
import RefreshToken from '~/models/RefreshToken.schema'
import { databaseService } from './Database.service'
import ms from 'ms'

config()
class UserService {
  private static instance: UserService

  // Hàm kiểm tra user có bị lock không
  private async checkUserLock(user: IUser) {
    if (user.locked) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.ACCOUNT_LOCKED,
        statusCode: httpStatus.LOCKED
      })
    }
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

  // Hàm tạo các số ngẫu nhiên
  public randomNumber = async (length: number): Promise<string> => {
    const charset = '0123456789'
    let number = ''
    for (let i = 0; i < length; i++) {
      number += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return number
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
  private async checkUserExistence(email: string, phone: string, username: string, employee_code: string) {
    // Check User Existence
    const userExits = await Users.findOne({ $or: [{ email }, { phone }, { username }, { employee_code }] })
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
    // Check employee_code đã tồn tại chưa
    if (userExits?.employee_code === employee_code) {
      throw new ErrorWithStatusCode({
        message: USER_MESSAGE.EMPLOYEE_CODE_EXISTED,
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
    return refresh_token
  }

  // Kiểm tra user_id và device_id đã tồn tại trong db Device chưa
  // Nếu chưa thì tạo mới
  private async checkUpdateAndCreateDevice(user: IUser, device_id: string) {
    const device = await Device.findOneAndUpdate(
      { user_id: user.id, device_id },
      { last_login: new Date() },
      { new: true }
    )
    if (!device) {
      const newDevice = await Device.create({
        user_id: user.id,
        device_id,
        type: 'unknown',
        os: 'unknown',
        browser: 'unknown',
        ip: 'unknown',
        last_login: new Date()
      })
      return newDevice
    }
    return device
  }

  // Kiểm tra refresh token và tạo refresh token mới
  private async checkRefreshTokenAndCreateNewRefreshToken(user: IUser, device_id: string, refresh_token: string) {
    const expires = new Date(Date.now() + ms(process.env.EXPIRE_REFRESH_TOKEN as string))
    const newRefreshToken = await RefreshToken.findOneAndUpdate(
      {
        user_id: user.id,
        device: device_id
      },
      {
        refresh_token: refresh_token,
        expires
      },
      { upsert: true, new: true }
    )
    return newRefreshToken
  }

  // Tạo đối tượng để lưu các trường cần cập nhật
  private async processUpdateFields<T>(updateData: Partial<T>, userId?: string): Promise<Partial<T>> {
    const updateFields: Partial<T> = {}
    for (const key in updateData) {
      if (key === 'employee_code' || key === 'username' || key === 'email' || key === 'phone') {
        const validKey = key as keyof T & ('employee_code' | 'username' | 'email' | 'phone')
        await this.checkFieldsUser(validKey, updateData[key] as string, userId as string)
      }
      updateFields[key] = updateData[key]
    }
    return updateFields
  }

  // Tạo check Fields cần cập nhật
  private async checkFieldsUser(
    fields: 'employee_code' | 'username' | 'email' | 'phone',
    value: string,
    userId: string
  ): Promise<void> {
    const existingUser = await Users.findOne({ [fields]: value, _id: { $ne: userId } })
    if (existingUser) {
      const message =
        fields === 'employee_code'
          ? USER_MESSAGE.EMPLOYEE_CODE_EXISTED
          : fields === 'username'
            ? USER_MESSAGE.USERNAME_EXISTED
            : fields === 'email'
              ? USER_MESSAGE.EMAIL_EXISTED
              : USER_MESSAGE.PHONE_EXISTED
      throw new ErrorWithStatusCode({
        message,
        statusCode: httpStatus.CONFLICT
      })
    }
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
    // Kiểm tra user đã tồn tại chưa
    await this.checkUserExistence(email, phone, username, employee_code)

    //Tạo newUserName
    const newUserName = (username + '-' + (await this.randomNumber(6))) as string

    // Tạo email verify token và hash password
    const [email_verify_token, hashedPassword] = await Promise.all([
      this.generateEmailVerifyToken({
        email: email
      }),
      password === undefined ? await this.randomPassword(6) : await this.hashPassword(password as string)
    ])

    // Tạo URL xác minh email bằng req.params.token
    const verifyEmailUrl = `${process.env.CLIENT_URL}/verify-email/${email_verify_token}`

    //Tạo user trong mongodb và gửi email verify token
    const [user] = await Promise.all([
      Users.create({
        first_name,
        last_name,
        full_name,
        email,
        phone,
        password: hashedPassword,
        email_verify_token,
        employee_code,
        username: newUserName,
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
          username: newUserName,
          password: hashedPassword,
          expirationTime: process.env.EXPIRE_EMAIL_VERIFY_TOKEN as string
        }
      })
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
   * req.decoded_email_verify_token: username
   * Response: message
   */
  async verifyEmail({ email, token, deviceInfo }: { email: string; token: string; deviceInfo: IDevice }) {
    return databaseService.withTransaction(async (session) => {
      // Tìm user và cập nhật trong một lần truy vấn
      const updatedUser = await Users.findOneAndUpdate(
        {
          email,
          email_verify_token: token,
          email_verified: false // Thêm điều kiện này để đảm bảo chỉ cập nhật nếu chưa verify
        },
        {
          email_verified: true,
          email_verify_token: ''
          // Sử dụng $push để thêm thiết bị mới vào mảng
        },
        { new: true, runValidators: true }
      ).session(session)

      // Nếu không tìm thấy user hoặc email đã được verify
      if (!updatedUser) {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.USER_NOT_FOUND_OR_EMAIL_HAS_BEEN_VERIFIED,
          statusCode: httpStatus.NOT_FOUND
        })
      }

      const [updatedDevice, access_token, refresh_token] = await Promise.all([
        this.checkUpdateAndCreateDevice(updatedUser, deviceInfo.device_id),

        this.generateAccessToken({
          id: updatedUser.id,
          role: updatedUser.role,
          email_verified: updatedUser.email_verified
        }),
        this.generateRefreshToken({
          id: updatedUser.id
        })
      ])

      if (!updatedDevice) {
        console.error('Failed to update or create device')
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.DEVICE_UPDATE_FAILED,
          statusCode: httpStatus.INTERNAL_SERVER_ERROR
        })
      }

      // Cập nhật refresh token cho thiết bị lưu vào db

      await this.checkRefreshTokenAndCreateNewRefreshToken(updatedUser, updatedDevice.device_id, refresh_token)
      // Cập nhật device vào user
      updatedUser.device.push(updatedDevice.id)
      await updatedUser.save()

      await session.commitTransaction()
      const response: verifyEmailResType = {
        message: USER_MESSAGE.EMAIL_VERIFY_SUCCESSFULLY,
        data: {
          access_token
        }
      }

      return response
    })
  }

  /**
   * Description: Resend Email Verify Token Sau khi user không nhận được email verify token
   * Req.body: email
   * Response: message
   */

  async resendEmailVerifyEmail({ email }: { email: string }) {
    return databaseService.withTransaction(async (session) => {
      // Tìm user và cập nhật email_verify_token trong một lần truy vấn
      const updatedUser = await Users.findOneAndUpdate(
        {
          email,
          email_verified: false // Chỉ tìm và cập nhật nếu email chưa được xác minh
        },
        {
          email_verify_token: await this.generateEmailVerifyToken({ email }) // Tạo token mới
        },
        { new: true, runValidators: true, select: 'email first_name email_verify_token' }
      ).session(session)

      // Nếu không tìm thấy user hoặc email đã được xác minh
      if (!updatedUser) {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.USER_NOT_FOUND_OR_EMAIL_HAS_BEEN_VERIFIED,
          statusCode: httpStatus.NOT_FOUND
        })
      }

      // Tạo URL xác minh email
      const verifyEmailUrl = `${process.env.CLIENT_URL}/verify-email/${updatedUser.email_verify_token}`

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

      await session.commitTransaction()

      const response: resendEmailVerifyTokenResType = {
        message: USER_MESSAGE.EMAIL_SENT_SUCCESSFULLY
      }

      return response
    })
  }

  /**
   * Description: Change Password sau khi verify email
   * Req.body: new_password
   * Req.decoded_change_password_token: email
   * Response: message
   */

  async changePassword({ id, new_password }: { id: string; new_password: string }) {
    return databaseService.withTransaction(async (session) => {
      // Tìm user và cập nhật password trong một lần truy vấn
      const updatedUser = await Users.findOneAndUpdate(
        { _id: id },
        { password: await this.hashPassword(new_password) },
        { new: true, upsert: true, runValidators: true }
      ).session(session)

      if (!updatedUser) {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.USER_NOT_FOUND,
          statusCode: httpStatus.NOT_FOUND
        })
      }

      await session.commitTransaction()
      const response: resendEmailVerifyTokenResType = {
        message: USER_MESSAGE.CHANGE_PASSWORD_SUCCESSFULLY
      }

      return response
    })
  }

  /**
   * Description: Admin thay đổi thông tin user
   * Req.body: first_name, last_name, email, phone, username, role, permissions, department, position
   * Req.params: id
   * Response: {
   * message
   * data
   * }
   */

  async adminUpdateUserProfile({ id, data }: { id: string; data: Partial<adminUpdateUserProfileBodyType> }) {
    return databaseService.withTransaction(async (session) => {
      const user = await Users.findById(id).session(session)
      if (!user) {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.USER_NOT_FOUND,
          statusCode: httpStatus.NOT_FOUND
        })
      }
      // Xử lý dữ liệu cập nhật
      const updateFields = await this.processUpdateFields<adminUpdateUserProfileBodyType>(data, user.id)
      console.log(updateFields)
      // Cập nhật thông tin user
      await Users.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).session(session)

      await session.commitTransaction()
      const response: adminUpdateUserProfileResType = {
        message: USER_MESSAGE.UPDATE_USER_PROFILE_SUCCESSFULLY,
        data: {
          user: {
            updateFields
          }
        }
      }
      return response
    })
  }

  /**
   * Description: Đăng nhập tài khoản
   * Req.body: username, password, device_id
   * Response: message, data { accessToken, refreshToken }
   */

  async loginUser({ username, password, device_id }: { username: string; password: string; device_id: string }) {
    // Tạo session
    return databaseService.withTransaction(async (session) => {
      // Kiểm tra user tồn tại chưa
      const user = await Users.findOne({ username })
        .select('email employee_code full_name role loginAttempts password email_verified locked')
        .session(session)
      if (!user) {
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT,
          statusCode: httpStatus.BAD_REQUEST
        })
      }

      // Kiểm tra user có bị lock không
      await this.checkUserLock(user)

      // Kiểm tra password
      const isMatch = await this.comparePassword(password, user.password)

      /**
       * Kiểm tra password
       * Nếu không đúng thì tăng loginAttempts lên 1
       * Nếu loginAttempts >= 5 thì lock user
       * Nếu loginAttempts < 5 thì save user và trả về thông báo
       * Nếu đúng thì reset loginAttempts về 0
       *
       */
      if (!isMatch) {
        const now = new Date().getTime()
        const fiveMinutesAgo = now - 1 * 60 * 1000
        const updatedUser = await Users.findOneAndUpdate(
          { _id: user.id },
          [
            {
              $set: {
                loginAttempts: {
                  $cond: {
                    if: { $eq: [{ $type: '$loginAttempts' }, 'object'] },
                    then: '$loginAttempts',
                    else: { count: 0, times: [] }
                  }
                }
              }
            },
            {
              $set: {
                'loginAttempts.count': { $add: [{ $ifNull: ['$loginAttempts.count', 0] }, 1] },
                'loginAttempts.times': {
                  $let: {
                    vars: {
                      newTimes: {
                        $concatArrays: [
                          [now],
                          {
                            $filter: {
                              input: { $ifNull: ['$loginAttempts.times', []] },
                              as: 'time',
                              cond: { $gte: ['$$time', fiveMinutesAgo] }
                            }
                          }
                        ]
                      }
                    },
                    in: { $slice: ['$$newTimes', 5] }
                  }
                }
              }
            },
            {
              $set: {
                locked: { $gte: ['$loginAttempts.count', 5] }
              }
            }
          ],
          { new: true, upsert: true }
        ).session(session)
        if (updatedUser.locked) {
          throw new ErrorWithStatusCode({
            message: USER_MESSAGE.ACCOUNT_LOCKED,
            statusCode: httpStatus.LOCKED
          })
        }
        throw new ErrorWithStatusCode({
          message: USER_MESSAGE.YOU_HAVE_ATTEMPTS_TO_LOGIN.replace(
            /{attempts}/,
            (5 - updatedUser.loginAttempts.count).toString()
          ),
          statusCode: httpStatus.BAD_REQUEST
        })
      }
      // Kiểm tra thiết bị và user_id đã tồn tại trong db Device chưa
      const existDevice = await Device.findOne({ user_id: user.id, device_id }).session(session)

      if (!existDevice) {
        const emailVerifyDeviceToken = await this.generateEmailVerifyDeviceToken({
          id: user.id,
          device_id
        })
        await Users.findByIdAndUpdate(user.id, { email_verify_device_token: emailVerifyDeviceToken }).session(session)

        const verificationUrl = `${process.env.CLIENT_URL}/verify-device/token=${emailVerifyDeviceToken}`
        await sendMail({
          to: user.email,
          subject: 'Verify Device',
          templateName: 'verifyDevice',
          dynamic_Field: {
            name: user.full_name,
            verificationUrl,
            expirationTime: process.env.EXPIRE_EMAIL_VERIFY_DEVICE_TOKEN as string
          }
        })

        await session.commitTransaction()

        return {
          message: USER_MESSAGE.VERIFY_DEVICE_SENT
        }
      }
      // Cập nhật last_login và device_id cho user
      existDevice.last_login = new Date()
      existDevice.device_id = device_id
      await existDevice.save({ session })

      // Tạo AccessToken và RefreshToken
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken({
          id: user.id,
          role: user.role,
          email_verified: user.email_verified
        }),
        this.generateRefreshToken({
          id: user.id
        })
      ])

      const expires = new Date(Date.now() + ms(process.env.EXPIRE_REFRESH_TOKEN as string))

      // Cập nhật refresh token cho thiết bị lưu vào db
      await RefreshToken.findOneAndUpdate(
        {
          user_id: user.id,
          device: device_id
        },
        {
          refresh_token: refreshToken,
          expires
        },
        { upsert: true, new: true }
      ).session(session)

      await session.commitTransaction()
      const response: loginUserResType = {
        message: USER_MESSAGE.LOGIN_SUCCESSFULLY,
        data: {
          accessToken,
          refreshToken
        }
      }

      return response
    })
  }
}

//     // Cập nhật last_login và device_id cho user
//     existDevice.last_login = new Date()
//     existDevice.device_id = device_id
//     await existDevice.save({ session })

//     // Tạo AccessToken và RefreshToken
//     const [accessToken, refreshToken] = await Promise.all([
//       this.generateAccessToken({
//         id: user.id,
//         role: user.role,
//         email_verified: user.email_verified
//       }),
//       this.generateRefreshToken({
//         id: user.id
//       })
//     ])

//     const expires = new Date(Date.now() + ms(process.env.EXPIRE_REFRESH_TOKEN as string))

//     // Cập nhật refresh token cho thiết bị lưu vào db
//     await RefreshToken.findOneAndUpdate(
//       {
//         user_id: user.id,
//         device: device_id
//       },
//       {
//         refresh_token: refreshToken,
//         expires
//       },
//       { upsert: true, new: true }
//     ).session(session)

//     await session.commitTransaction()
//     const response: loginUserResType = {
//       message: USER_MESSAGE.LOGIN_SUCCESSFULLY,
//       data: {
//         accessToken,
//         refreshToken
//       }
//     }
//     return response
//   })
// }

//   /**
//    * Description: Verify Device sau khi đăng nhập
//    * Req.params: token
//    * Req.decoded_email_verify_device_token: _id, device_id
//    * Response: message
//    * @param data
//    * @returns
//    */

//   async verifyDevice({ id, token, device_id }: { id: string; token: string; device_id: string }) {
//     return databaseService.withTransaction(async (session) => {
//       // Tìm user theo _id
//       const user = await Users.findById(id, token).session(session)
//       if (!user) {
//         throw new ErrorWithStatusCode({
//           message: USER_MESSAGE.USER_NOT_FOUND,
//           statusCode: httpStatus.NOT_FOUND
//         })
//       }

//       // Kiểm tra số lượng thiết bị hiện tại
//       const devices = await Device.find({ user_id: user._id }).session(session)

//       if (devices.length >= 3) {
//         await session.abortTransaction()
//         return {
//           message: USER_MESSAGE.TOO_MANY_DEVICES,
//           data: {
//             devices: devices.map((device) => ({
//               device_id: device.device_id,
//               type: device.type,
//               os: device.os,
//               browser: device.browser,
//               ip: device.ip
//             })),
//             deleteDeviceUrl: `${process.env.CLIENT_URL}/delete-device`
//           },
//           statusCode: httpStatus.CONFLICT
//         }
//       }

//       if (!user._id || !device_id) {
//         throw new ErrorWithStatusCode({
//           message: USER_MESSAGE.INVALID_DATA,
//           statusCode: httpStatus.BAD_REQUEST
//         })
//       }

//       // Thêm thiết bị mới
//       const device = await Device.create({
//         user_id: user._id,
//         device_id: device_id,
//         type: 'unknown',
//         os: 'unknown',
//         browser: 'unknown',
//         ip: 'unknown'
//       })
//       console.log(device)
//       // Cập nhật email_verify_device_token
//       await Users.findByIdAndUpdate(user._id, { email_verify_device_token: '' }).session(session)

//       const newRefreshToken = await RefreshToken.create({
//         user_id: id,
//         device: device.device_id,
//         refresh_token: '',
//         expires: ''
//       })
//       console.log(newRefreshToken)

//       await session.commitTransaction()
//       return {
//         message: USER_MESSAGE.VERIFY_DEVICE_SUCCESSFULLY
//       }
//     })
//   }
// }

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

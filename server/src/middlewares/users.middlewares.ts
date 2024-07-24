import z from 'zod'
import { passwordRegex, phoneRegex } from '~/utils/regex'
import _, { last } from 'lodash'
import { permission } from 'process'
import { userInfo } from 'os'

// Register user body
export const registerUserBody = z
  .object({
    first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }).trim(),
    last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }).trim(),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 characters' })
      .regex(phoneRegex, { message: 'Invalid phone number' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }).regex(passwordRegex, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    }),
    role: z.number().default(1)
  })
  .strict()

export type registerUserBodyType = z.infer<typeof registerUserBody>
export const registerUserRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
      _id: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      email: z.string(),
      phone: z.string(),
      role: z.string(),
      permission: z.string(),
      department: z.string(),
      position: z.string()
    })
  }),
  message: z.string()
})

export type registerUserResType = z.infer<typeof registerUserRes>

// Get me response
export const getMeRes = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({
      _id: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      email: z.string(),
      phone: z.string(),
      role: z.string(),
      permission: z.string(),
      department: z.string(),
      position: z.string(),
      device: z.string(),
      avartar: z.string(),
      cover: z.string(),
      createdAt: z.string(),
      updatedAt: z.string()
    })
  })
})

export type getMeResType = z.infer<typeof getMeRes>

// Get Profile User
export const getUserParams = z.object({
  id: z.string()
})

export type getUserParamsType = z.infer<typeof getUserParams>

export const getProfileUserRes = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({})
  })
})

//Update user Avatar body
export const updateAvatarBody = z.object({
  avatar: z.instanceof(File).optional()
})

export type updateAvatarBodyType = z.infer<typeof updateAvatarBody>

//Admin update user profile body
export const adminUpdateUserProfileBody = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.number().optional(),
  permission: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  device: z.string().optional(),
  email_verified: z.boolean().optional(),
  avatar: z.string().optional(),
  cover: z.string().optional()
})

export type adminUpdateUserProfileBodyType = z.infer<typeof adminUpdateUserProfileBody>

export const adminUpdateUserProfileRes = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({})
  })
})

// Login user body
export const loginUserBody = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' })
  })
  .strict()

export type loginUserBodyType = z.infer<typeof loginUserBody>
export const loginUserRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string()
  }),
  message: z.string()
})

export type loginUserResType = z.infer<typeof loginUserRes>

// Resend email verify token body
export const resendEmailVerifyTokenBody = z
  .object({
    email: z.string().email({ message: 'Invalid email address' })
  })
  .strict()

export type resendEmailVerifyTokenBodyType = z.infer<typeof resendEmailVerifyTokenBody>

/**
 * Get All Users
 */
export const getAllUserQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  fields: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  role: z.string().optional()
})

export type getAllUserQueryType = z.infer<typeof getAllUserQuery>

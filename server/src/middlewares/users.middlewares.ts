import z from 'zod'
import { passwordRegex, phoneRegex } from '~/utils/regex'
import _ from 'lodash'
import { File } from 'buffer'

// Register user body
export const registerUserBody = z
  .object({
    employee_code: z.string().min(5, { message: 'employee_code must be at least 5 characters' }).trim(),
    username: z.string().min(2, { message: 'Username must be at least 5 characters' }).trim(),
    first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }).trim(),
    last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }).trim(),
    full_name: z.string().min(2, { message: 'Full name must be at least 2 characters' }).trim(),
    email: z.string().email({ message: 'Invalid email address' }).trim(),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 characters' })
      .regex(phoneRegex, { message: 'Invalid phone number' })
      .trim(),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .regex(passwordRegex, {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      })
      .trim()
      .optional(),
    role: z.number().default(1).optional()
  })
  .strict()

export type registerUserBodyType = z.infer<typeof registerUserBody>
export const registerUserRes = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({
      employee_code: z.string(),
      full_name: z.string(),
      username: z.string(),
      email: z.string(),
      phone: z.string(),
      role: z.string(),
      permissions: z.array(z.string()),
      department: z.array(z.string()),
      position: z.array(z.string())
    })
  })
})

export type registerUserResType = z.infer<typeof registerUserRes>

// Verify email
export const verifyEmailRes = z.object({
  message: z.string(),
  data: z.object({
    access_token: z.string()
  })
})

export type verifyEmailResType = z.infer<typeof verifyEmailRes>

// Resend email verify token body
export const resendEmailVerifyTokenBody = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }).trim()
  })
  .strict()

export type resendEmailVerifyTokenBodyType = z.infer<typeof resendEmailVerifyTokenBody>
export const resendEmailVerifyTokenRes = z.object({
  message: z.string()
})

export type resendEmailVerifyTokenResType = z.infer<typeof resendEmailVerifyTokenRes>

// change Password body
export const changePasswordBody = z
  .object({
    new_password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .regex(passwordRegex, {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      })
      .trim()
  })
  .strict()

export type changePasswordBodyType = z.infer<typeof changePasswordBody>
export const changePasswordRes = z.object({
  message: z.string()
})

export type changePasswordResType = z.infer<typeof changePasswordRes>

//Admin update user profile body
export const adminUpdateUserProfileBody = z
  .object({
    employee_code: z.string().min(5, { message: 'employee_code must be at least 5 characters' }).trim().optional(),
    username: z.string().min(2, { message: 'Username must be at least 5 characters' }).trim().optional(),
    first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }).trim().optional(),
    last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }).trim().optional(),
    full_name: z.string().min(2, { message: 'Full name must be at least 2 characters' }).trim().optional(),
    email: z.string().email({ message: 'Invalid email address' }).trim().optional(),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 characters' })
      .regex(phoneRegex, { message: 'Invalid phone number' })
      .trim()
      .optional(),
    role: z.number().optional(),
    permissions: z.array(z.string()).optional(),
    department: z.array(z.string()).optional(),
    position: z.array(z.string()).optional(),
    device: z.array(z.string()).optional(),
    email_verified: z.boolean().optional()
  })
  .strict()

export type adminUpdateUserProfileBodyType = z.infer<typeof adminUpdateUserProfileBody>

export const adminUpdateUserProfileParams = z
  .object({
    id: z.string()
  })
  .strict()

export type adminUpdateUserProfileParamsType = z.infer<typeof adminUpdateUserProfileParams>

export const adminUpdateUserProfileRes = z.object({
  message: z.string(),
  data: z.object({
    user: z.object({})
  })
})

export type adminUpdateUserProfileResType = z.infer<typeof adminUpdateUserProfileRes>

// Login user body
export const loginUserBody = z
  .object({
    username: z.string().trim(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    device_id: z.string()
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

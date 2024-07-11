import z from 'zod'
import { passwordRegex, phoneRegex } from '~/utils/regex'
import _ from 'lodash'

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
    role: z.string()
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

import z from 'zod'
import { passwordRegex, phoneRegex } from '~/utils/regex'
import _ from 'lodash'
export const registerUserBody = z.object({
  first_name: z
    .string()
    .min(2, { message: 'First name must be at least 2 characters' })
    .trim()
    .refine((data) => {
      // viết hoa các chữ cái đầu của từng từ
      const words = _.startCase(data).split(' ')
      return words.join(' ')
    }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters' })
    .regex(phoneRegex, { message: 'Invalid phone number' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).regex(passwordRegex, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
})

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

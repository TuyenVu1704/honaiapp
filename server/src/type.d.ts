import { Request } from 'express'
import { JwtPayload } from 'jsonwebtoken'
declare module 'express' {
  interface Request {
    user?: JwtPayload
    decoded?: JwtPayloadoad
    decoded_refresh_token?: JwtPayload
    decoded_email_verify_token?: JwtPayload
    isAdmin?: boolean
    isEmailVerified?: boolean
    files?: any
  }
}

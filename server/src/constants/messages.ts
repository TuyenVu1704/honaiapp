export const USER_MESSAGE = {
  VALIDATTION_ERROR: 'Validation error',

  // Auth
  REGISTER_SUCCESSFULLY: 'Register successfully',
  LOGIN_SUCCESSFULLY: 'Login successfully',
  LOGOUT_SUCCESSFULLY: 'Logout successfully',
  EMAIL_VERIFY_SUCCESSFULLY: 'Email verify successfully',

  //Email
  EMAIL_OR_PHONE_EXISTED: 'Email or phone number already exists',
  EMAIL_OR_PASSWORD_EXISTED: 'Email or password already exists',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',
  EMAIL_NOT_FOUND: 'Email not found',
  RESEND_EMAIL_VERIFY_SUCCESSFULLY: 'Resend email verify token successfully',

  // Account
  ACCOUNT_LOCKED: 'Account is locked',
  ACCOUNT_WILL_BE_LOCKED: 'Account will be locked',

  //Token
  INVALID_TOKEN: 'Invalid token',
  ACCESS_TOKEN_IS_INVALID: 'Access token is invalid',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  ACCESS_TOKEN_IS_EXPIRED: 'Access token is expired',
  REFRESH_TOKEN_INVALID: 'Refresh token is invalid',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_STRING: 'Refresh token must be a string',
  REFRESH_TOKEN_IS_EXPIRED: 'Refresh token is expired',
  REFRESH_TOKEN_IN_BODY_IS_REQUIRED: 'Refresh token in body is required',
  REFRESH_TOKEN_USED_OR_NOT_IN_DATABASE: 'Refresh token is used or not in database',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  EMAIL_VERIFY_TOKEN_IS_STRING: 'Email verify token must be a string',
  EMAIL_VERIFY_TOKEN_IN_BODY_IS_REQUIRED: 'Email verify token in body is required',
  USER_NOT_FOUND_OR_EMAIL_HAS_BEEN_VERIFIED: 'User not found or Email has been verified',
  // User
  USER_NOT_FOUND: 'User not found',
  USER_IS_VERIFIED: 'User is verified',
  USER_IS_NOT_ADMIN: 'User is not admin',
  USER_EMAIL_NOT_VERIFIED: 'User email not verified',
  GET_ME_SUCCESSFULLY: 'Get me successfully',
  GET_ALL_USERS_SUCCESSFULLY: 'Get all users successfully',
  GET_ALL_USERS_FAILED: 'Get all users failed',
  UPDATE_PROFILE_SUCCESSFULLY: 'Update profile successfully'
} as const

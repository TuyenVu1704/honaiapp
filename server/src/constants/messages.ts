export const USER_MESSAGE = {
  VALIDATTION_ERROR: 'Validation error',

  // Auth
  REGISTER_SUCCESSFULLY: 'Register successfully',
  LOGIN_SUCCESSFULLY: 'Login successfully',

  //Email
  EMAIL_OR_PHONE_EXISTED: 'Email or phone number already exists',
  EMAIL_OR_PASSWORD_EXISTED: 'Email or password already exists',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',

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
  REFRESH_TOKEN_IS_EXPIRED: 'Refresh token is expired'
} as const

export const USER_MESSAGE = {
  VALIDATTION_ERROR: 'Validation error',

  // Auth
  REGISTER_USER_SUCCESSFULLY: 'Register user successfully',
  LOGIN_SUCCESSFULLY: 'Login successfully',
  LOGOUT_SUCCESSFULLY: 'Logout successfully',
  EMAIL_VERIFY_SUCCESSFULLY: 'Email verify successfully',

  //Email

  EMAIL_EXISTED: 'Email already exists',
  EMAIL_OR_PASSWORD_EXISTED: 'Email or password already exists',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',
  EMAIL_NOT_FOUND: 'Email not found',
  RESEND_EMAIL_VERIFY_SUCCESSFULLY: 'Resend email verify token successfully',
  VERIFY_DEVICE_SENT: 'Verify device sent',
  VERIFY_DEVICE_SUCCESSFULLY: 'Verify device successfully',
  EMAIL_SENT_SUCCESSFULLY: 'Email sent successfully',
  EMAIL_SENT_FAILED: 'Email sent failed',
  EMAIL_NOT_FOUND_OR_ALREADY_VERIFIED: 'Email not found or already verified',

  //Phone
  PHONE_EXISTED: 'Phone number already exists',

  // Account
  ACCOUNT_LOCKED: 'Account is locked',
  ACCOUNT_WILL_BE_LOCKED: 'Account will be locked',
  EMPLOYEE_CODE_EXISTED: 'Employee code already exists',

  //Token
  INVALID_TOKEN: 'Invalid token',
  ACCESS_TOKEN_IS_INVALID: 'Access token is invalid',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  ACCESS_TOKEN_IS_EXPIRED: 'Access token is expired',
  REFRESH_TOKEN_INVALID: 'Refresh token is invalid',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  REFRESH_TOKEN_IS_STRING: 'Refresh token must be a string',
  REFRESH_TOKEN_IS_EXPIRED: 'Refresh token is expired',
  REFRESH_TOKEN_IN_BODY_IS_REQUIRED: 'Refresh token in body is required',
  REFRESH_TOKEN_USED_OR_NOT_IN_DATABASE: 'Refresh token is used or not in database',
  REFRESH_TOKEN_SUCCESSFULLY: 'Refresh token successfully',
  REFRESH_TOKEN_UPDATED: 'Refresh token updated',
  REFRESH_TOKEN_ADDED_NEW_DEVICE: 'Refresh token added new device',
  REFRESH_TOKEN_LIMIT_DEVICE: 'Refresh token limit device',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  EMAIL_VERIFY_TOKEN_IS_STRING: 'Email verify token must be a string',
  EMAIL_VERIFY_TOKEN_IN_BODY_IS_REQUIRED: 'Email verify token in body is required',
  EMAIL_VERIFY_EMAIL_TOKEN_EXPIRED: 'Email verify email token expired',
  EMAIL_VERIFY_EMAIL_TOKEN_INVALID_TOKEN: 'Email verify email token invalid token',
  USER_NOT_FOUND_OR_EMAIL_HAS_BEEN_VERIFIED: 'User not found or Email has been verified',
  EMAIL_VERIFY_DEVICE_TOKEN_EXPIRED: 'Email verify device token expired',
  EMAIL_VERIFY_DEVICE_TOKEN_INVALID_TOKEN: 'Email verify device token invalid token',
  CHANGE_PASSWORD_TOKEN_IS_REQUIRED: 'Change password token is required',
  CHANGE_PASSWORD_TOKEN_EXPIRED: 'Change password token expired',

  // User
  USERNAME_EXISTED: 'Username already exists',
  USER_NOT_FOUND: 'User not found',
  USER_IS_VERIFIED: 'User is verified',
  USER_IS_NOT_ADMIN: 'User is not admin',
  USER_EMAIL_NOT_VERIFIED: 'User email not verified',
  GET_ME_SUCCESSFULLY: 'Get me successfully',
  GET_ALL_USERS_SUCCESSFULLY: 'Get all users successfully',
  GET_ALL_USERS_FAILED: 'Get all users failed',
  UPDATE_PROFILE_SUCCESSFULLY: 'Update profile successfully',
  GET_PROFILE_SUCCESSFULLY: 'Get profile successfully',
  YOU_HAVE_ATTEMPTS_TO_LOGIN: 'You have {attempts} attempts to login',
  CHANGE_PASSWORD_SUCCESSFULLY: 'Change password successfully',

  //Update
  UPDATE_USER_PROFILE_SUCCESSFULLY: 'Update user profile successfully',
  UPDATE_AVATAR_SUCCESSFULLY: 'Update avatar successfully',

  //Device
  DEVICE_UPDATE_FAILED: 'Device update failed',
  DEVICE_LIMIT: 'Device limit',
  TOO_MANY_DEVICES: 'Too many devices',
  INVALID_DATA: 'Invalid data'
} as const

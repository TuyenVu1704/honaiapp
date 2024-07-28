import rateLimit from 'express-rate-limit'
export const adminResendEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Giới hạn mỗi admin chỉ được gửi lại email 5 lần trong 1 giờ
  message: 'Too many verification email requests from admin, please try again later.'
})

// import { Router } from 'express'
// import { uploadAvatarController } from '~/controller/uploads.controller'
// import { accessTokenMiddleware, checkIsEmailVerified } from '~/middlewares/accessToken.middlewares'
// import { compressAndSaveImageMiddleware } from '~/middlewares/compressAndSaveImage.middlewares'
// import { updateAvatarBody } from '~/middlewares/users.middlewares'
// import { upload } from '~/utils/file'
// import { validate } from '~/utils/validate'

// const router = Router()

// /**
//  * Description: Upload image Avatar
//  * Method: POST
//  * Request: /uploads/avatar
//  * Request Header: Authorization
//  * Check isEmailVerified
//  * body: {  avatar }
//  */

// router.post(
//   '/avatar',
//   accessTokenMiddleware,
//   checkIsEmailVerified,
//   upload.array('avatar', 1),
//   compressAndSaveImageMiddleware,
//   validate(updateAvatarBody),
//   uploadAvatarController
// )

// export default router

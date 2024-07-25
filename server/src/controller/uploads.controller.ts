import { Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { isProduction } from '~/config/config'
import { updateAvatarService } from '~/services/users.services'
import tryCatchHandler from '~/utils/trycatchHandler'

/**
 * Description: User Upload image Avatar
 */
export const uploadAvatarController = tryCatchHandler(async (req: Request, res: Response) => {
  const { _id } = req.user as JwtPayload
  const avatar = req.files[0].path
  // Get url avatar
  const urlAvatar = isProduction ? `${process.env.HOST}/${avatar}` : `${process.env.BASE_URL}/${avatar}`
  // Update avatar
  const result = await updateAvatarService(urlAvatar, _id)
  return res.json(result)
})

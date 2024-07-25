import { Request, Response, NextFunction } from 'express'
import tryCatchHandler from '~/utils/trycatchHandler'
import fs from 'fs'
import sharp from 'sharp'
import path from 'path'
import { JwtPayload } from 'jsonwebtoken'
import { UPLOAD_FOLDER } from '~/constants/dir'
export const compressAndSaveImageMiddleware = tryCatchHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next()
    }

    const compressedFiles = await Promise.all(
      req.files.map(async (file: any) => {
        const { _id } = req.user as JwtPayload
        const reName = file.originalname.split('.')[0]
        const compressedFilePath = `${UPLOAD_FOLDER}/${file.fieldname}/${_id}-${Date.now()}-${reName}.jpeg`

        await sharp(file.buffer).toFormat('jpeg').jpeg({ quality: 80 }).toFile(compressedFilePath)

        return {
          originalname: file.originalname,
          filename: path.basename(compressedFilePath),
          path: compressedFilePath,
          size: fs.statSync(compressedFilePath).size
        }
      })
    )

    req.files = compressedFiles as any

    next()
  }
)

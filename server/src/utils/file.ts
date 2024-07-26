import { Request } from 'express'
import fs from 'fs'
import { UPLOAD_FOLDER } from '~/constants/dir'
import multer from 'multer'

// Hàm khởi tạo folder nếu chưa tồn tại
export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER)
  }
}

// config multer and filter file
export const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter: async (req: Request, file: Express.Multer.File, cb: any) => {
    // Lấy giá trị của fields name trong file
    const fieldName = file.fieldname
    console.log(file)
    // Kiểm tra nếu fields name là avatar thì chỉ cho upload file ảnh
    if (fieldName === 'avatar') {
      const createFolder = UPLOAD_FOLDER + '/' + fieldName
      if (!fs.existsSync(createFolder)) {
        fs.mkdirSync(createFolder)
      }
      if (!file.mimetype.startsWith('image')) {
        return cb(new Error('Please upload an image file'), false)
      }
    }

    // Nếu không phải fields name là avatar thì cho upload tất cả các loại file
    cb(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB
  }
})

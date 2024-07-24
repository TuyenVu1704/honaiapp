import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import { UPLOAD_AVATAR, UPLOAD_TEMP } from '~/constants/dir'

// Hàm khởi tạo folder nếu chưa tồn tại
export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_TEMP)) {
    fs.mkdirSync(UPLOAD_TEMP, { recursive: true }) // recursive: true để tạo folder cha nếu chưa tồn tại
  }
  if (!fs.existsSync(UPLOAD_AVATAR)) {
    fs.mkdirSync(UPLOAD_AVATAR, { recursive: true }) // recursive: true để tạo folder cha nếu chưa tồn tại
  }
}

// Hàm xử lý upload ảnh đơn
export const handleUploadSingleImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_TEMP, // đường dẫn lưu file vào thư mục uploads/temp
    maxFiles: 1, // số file tối đa được upload
    keepExtensions: true, // giữ lại đuôi file sau khi upload
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File is not valid') as any)
      }
      return true
    }
  })

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (files.image === undefined) {
        return reject(new Error('File is empty'))
      }
      resolve((files.image as File[])[0])
    })
  })
}

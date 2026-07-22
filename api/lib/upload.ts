import multer from 'multer'

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Upload file harus berupa image yang valid'))
      return
    }

    callback(null, true)
  },
})

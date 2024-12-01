import multer from 'multer'
import path from 'path'
import fs from 'fs'


const uploadDir = './public/temp'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
    console.log(`created directory at ${uploadDir}`)
}
const storage = multer.diskStorage({
    destinaiton: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname)

    }
})

export const upload = multer({ storage, })
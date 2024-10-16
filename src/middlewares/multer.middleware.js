import multer from 'multer'

const storage = multer.diskStorage({
    destinaiton: function (req, res, cb) {
        cb(null, '/public/temp')
    },
    filename: function (req, res, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname)

    }
})

export const upload = multer({ storage, })
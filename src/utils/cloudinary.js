import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null
        }
        const response = cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        console.log('file is uploaded on cloudinary', response.url)
        return response

    } catch (error) {
        console.error(error)
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }//remove the locally save temparory file as the upload operation got failed 
        return null
    }
}

export { uploadOnCloudinary }

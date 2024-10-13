import { v2 as cloudinary } from 'cloudinary'
import { response } from 'express'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const loadOnCloudinary = async (localFilePath) => {
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
        fs.unlinkSync(localFilePath)//remove the locally save temparory file as the upload operation got failed 
        return null
    }
}


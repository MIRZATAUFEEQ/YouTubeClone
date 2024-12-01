import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`🫙 Mongodb connected !! DB host: ${connectionInstance.connection.host}`)

    } catch (error) {
        console.log('mongodb conection failed', error)
        process.exit(1)
    }
}

export default connectDB
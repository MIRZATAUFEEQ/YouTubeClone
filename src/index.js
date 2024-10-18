import dotenv from 'dotenv'
import connectDB from './db/db.js'
import { app } from './app.js'

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running at port http://localhost:${process.env.PORT}`)
            app.on('error', (error) => {
                console.log('error:', error)
                throw error
            })
        })
    })
    .catch((err) => {
        console.log('mongodb connection failed', err)
    })
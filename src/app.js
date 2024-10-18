import express from 'express'
import cookeiParser from 'cookie-parser'
import cors from 'cors'
const app = express()


app.use(cors({      //middleware
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: '16kb' }))//configration
app.use(express.urlencoded({ extended: true, limit: "16kb" }))//configration
app.use(express.static("public"))//configration
app.use(cookeiParser())//configration

//routers
import userRouter from './routes/user.routes.js'
app.use('/api/v1/users', userRouter)


export { app }
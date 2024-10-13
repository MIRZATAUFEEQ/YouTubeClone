import mongoose, { Schema } from 'mongoose'
import mongooseAggreatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema({
    videoFile: {
        type: String,// use cloudinary url as a string
        required: true,
    },
    thumbnail: {
        type: String,// use cloudinary url as a string
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true })

videoSchema.plugin(mongooseAggreatePaginate)

export const Video = mongoose.model("Video", videoSchema)
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, 'something went wrong while generating access and referesh token')

    }
}

const registerUser = asyncHandler(async (req, res) => {
    //  get user details from frontend✅
    // validation -- not empty field ✅
    // check if user is already exists wtih this email,username✅
    // check for images, check for avatar✅
    // upload them to cloudinary, avatar✅
    // create user object - create entry in db ✅
    // remove password and refresh token field from response✅
    // create for user creation✅
    // return response
    const { username, email, fullname, password } = req.body
    // console.log("email: ", email)

    if ([username, email, fullname, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'All fields are required')
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, 'Username and email is already exists')
    }

    // get first property of avatar
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, 'avatar file is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'avatar file is required')
    }

    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        fullname,

    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, 'something went wrong while registering the user')
    }
    console.log(createdUser)
    res.status(201).json(
        new ApiResponse(200, createdUser, 'user registerd successfully')
    )

})


const loginUser = asyncHandler(async (req, res) => {
    // get user detail from req.body
    // find user or email 
    // check password
    // generate refreshtoken and access token 
    // send cookies 
    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, 'username or email is required')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, 'user does not exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credintials')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id)
        .select('-password -refreshToken')

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User loggedIn successfully"
        ))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, 'User logged out'))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'unauthorized request')
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, 'Invalid refresh token')
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token has been expired or used')
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(new ApiResponse(200, {
                accessToken, refreshToken: newRefreshToken
            }, "access token refreshed"
            ))
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token')
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid old password');
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200)
        .json(new ApiResponse(200, {}, "password change successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(
            new ApiResponse(200, res.user, 'current user fetched successfully')
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!(fullname && email)) {
        throw new ApiError(401, 'All fields are required')
    }
    await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select('-password')

    return res.status(200)
        .json(new ApiResponse(200, user, 'Account details updated successfully'))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    //todo :-- delete old avatar
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, 'avatar file is missing')
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar?.url) {
        throw new ApiError(400, 'Error while uploading avatar')
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select('-password')

    return res.status(200)
        .json(new ApiResponse(200, user, 'User avatar updated successfully'))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    //todo :-- delete old coverImage
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, 'avatar file is missing')
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage?.url) {
        throw new ApiError(400, 'Error while uploading coverImage')
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select('-password')

    return res.status(200)
        .json(new ApiResponse(200, user, 'Cover image updated successfully'))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        new ApiError(400, 'username is missing')
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: 'subscription',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        },
        {
            $lookup: {
                from: 'subscription',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo'
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: '$subscribedTo'
                },
                isSubscribed: {
                    if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                    then: true,
                    else: false
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,

            }
        }

    ])
    if (!channel?.length) {
        throw new ApiError(404, 'channel does not exists')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], 'user channel fetched successfully')
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'watchHistory',
                foreignField:'_id',
                as:'watchHistory',
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner',
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:'$owner'
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,'watch history fetched successfully')
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
<<<<<<< HEAD
    getUserChannelProfile,
    getWatchHistory
=======
>>>>>>> 57bf26d9f305364ba8230cc991e51f96d42806ac
}

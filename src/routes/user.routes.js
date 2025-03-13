import { Router } from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/register').post(upload.fields
    ([
        {
            name: 'avatar',
            maxCount: 1,
        },
        {
            name: 'coverImage',
            maxCount: 1,
        }
    ])
    , registerUser)

router.route('/login').post(loginUser)

//secured route
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-toke').post(refreshAccessToken)

router.route('/changepassword').post(verifyJWT, changeCurrentPassword)
router.route('/getcurrentuser').get(verifyJWT, getCurrentUser)

//update route
router.route('/updateaccountdetails').patch(verifyJWT, updateAccountDetails)
router.route('/updateuseravatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar)
router.route('/updatecoverimage').patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)

router.route('/channel/:username').get(verifyJWT, getUserChannelProfile)
router.route('/getwatchhistory').get(verifyJWT, getWatchHistory)



export default router


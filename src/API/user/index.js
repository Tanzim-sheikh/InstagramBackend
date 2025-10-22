import express from 'express';
import { userSignup, userLogin, userProfile,
     useremailVerify, userForgotPassword, userResetPassword, 
     userResendOtp, getAllUsers, addFriend, getFriendRequests, respondFriendRequest, getFriends } from './controller.js';
import { protect } from '../../helper/common/authMiddleware.js';
import upload from '../../helper/middleware/upload.js';
const userRoutes = express.Router();



// Auth routes
userRoutes.post('/signup', upload.single('profilePhoto'), userSignup);
userRoutes.post('/login', userLogin);
userRoutes.post('/verify-email', useremailVerify);
userRoutes.post('/resend-otp', userResendOtp);
userRoutes.post('/forgot-password', userForgotPassword);
userRoutes.post('/reset-password', userResetPassword);

// Protected route - requires authentication
userRoutes.get('/me', protect, userProfile);
userRoutes.get('/friends', protect, getFriends);
userRoutes.get("/AllUsers", protect, getAllUsers);
userRoutes.post("/add-friend", protect, addFriend);
userRoutes.get("/requests", protect, getFriendRequests);
userRoutes.post("/respond-friend", protect, respondFriendRequest);


export default userRoutes
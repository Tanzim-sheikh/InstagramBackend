import { signupUser, verifyEmail, loginUser, getProfile, requestPasswordReset, resetPassword, resendOtp, listAllUsers, addFriendService, getFriendRequestsService, respondFriendRequestService, getFriendsService } from './service.js';
import userModel from "../../modules/userSchema.js";

export const userSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const fileBuffer = req.file?.buffer;
    const result = await signupUser({ name, email, password, fileBuffer });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFriends = async (req, res) => {
  try {
    const result = await getFriendsService({ userId: req.user.id });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const useremailVerify = async (req, res) => {
  try {
    const result = await verifyEmail({ email: req.body.email, otp: req.body.otp });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const result = await loginUser({ email: req.body.email, password: req.body.password });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const userProfile = async (req, res) => {
  try {
    const result = await getProfile({ userId: req.user.id });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const userForgotPassword = async (req, res) => {
  try {
    const result = await requestPasswordReset({ email: req.body.email });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const userResetPassword = async (req, res) => {
  try {
    const result = await resetPassword({ email: req.body.email, otp: req.body.otp, newPassword: req.body.newPassword });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const userResendOtp = async (req, res) => {
  try {
    const result = await resendOtp({ email: req.body.email });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



export const getAllUsers = async (req, res) => {
  try {
    const result = await listAllUsers();
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addFriend = async (req, res) => {
  try {
    const result = await addFriendService({ userId: req.user.id, friendId: req.body.friendId });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const result = await getFriendRequestsService({ userId: req.user.id });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const respondFriendRequest = async (req, res) => {
  try {
    const { requesterId, action } = req.body;
    const result = await respondFriendRequestService({ userId: req.user.id, requesterId, action });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
  
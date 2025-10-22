import userModel from "../../modules/userSchema.js";
import { generateToken } from "../../helper/common/jwtToken.js";
import generateOTP from "../../helper/common/generateOTP.js";
import { uploadBuffer } from "../../helper/common/cloudinary.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.js";

export const signupUser = async ({ name, email, password, fileBuffer }) => {
  if (!name || !email || !password) {
    return { status: 400, body: { message: "Name, email and password are required" } };

  }

  const existing = await userModel.findOne({ email });
  if (existing) {
    return { status: 400, body: { message: "Email already registered" } };
  }

  let profilePhoto = { url: null, public_id: null };
  if (fileBuffer) {
    try {
      const uploaded = await uploadBuffer(fileBuffer, 'avatars');
      profilePhoto = { url: uploaded.secure_url, public_id: uploaded.public_id };
    } catch (_) {
      profilePhoto = { url: null, public_id: null };
    }
  }

  const otp = String(generateOTP());
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const user = await userModel.create({
    name,
    email,
    password,
    profilePhoto,
    isVerified: false,
    otp,
    otpExpiry,
  });

  let emailSent = true;
  try {
    await sendVerificationEmail({ name, email, otp });
  } catch (_) {
    emailSent = false;
  }

  return {
    status: 201,
    body: {
      message: emailSent
        ? "Signup successful, verification code sent to email"
        : "Signup successful, but failed to send verification email. Please try again later.",
      email: user.email,
    },
  };
};

export const verifyEmail = async ({ email, otp }) => {
  if (!email || !otp) return { status: 400, body: { message: "Email and OTP are required" } };
  const user = await userModel.findOne({ email });
  if (!user) return { status: 404, body: { message: "User not found" } };
  if (user.isVerified) return { status: 200, body: { message: "Email already verified" } };
  if (!user.otp || !user.otpExpiry || user.otp !== String(otp) || user.otpExpiry < new Date()) {
    return { status: 400, body: { message: "Invalid or expired OTP" } };
  }
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();
  return { status: 200, body: { message: "Email verified successfully" } };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    return { status: 400, body: { message: "Email and password are required" } };
  }
  const user = await userModel.findOne({ email });
  if (!user) return { status: 401, body: { message: "Invalid credentials" } };
  const match = await user.matchPassword(password);
  if (!match) return { status: 401, body: { message: "Invalid credentials" } };
  if (!user.isVerified) return { status: 403, body: { message: "Please verify your email before logging in" } };
  const token = generateToken(user._id.toString());
  return {
    status: 200,
    body: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
    },
  };
};

export const getProfile = async ({ userId }) => {
  const user = await userModel.findById(userId).select('-password -otp -otpExpiry');
  if (!user) return { status: 404, body: { message: "User not found" } };
  return { status: 200, body: { user } };
};

export const requestPasswordReset = async ({ email }) => {
  if (!email) return { status: 400, body: { message: "Email is required" } };
  const user = await userModel.findOne({ email });
  if (!user) return { status: 200, body: { message: "If the email exists, a reset code has been sent" } };
  const otp = String(generateOTP());
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();
  await sendPasswordResetEmail({ name: user.name, email, otp });
  return { status: 200, body: { message: "If the email exists, a reset code has been sent" } };
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  if (!email || !otp || !newPassword) {
    return { status: 400, body: { message: "Email, OTP and newPassword are required" } };
  }
  const user = await userModel.findOne({ email });
  if (!user) return { status: 404, body: { message: "User not found" } };
  if (!user.otp || !user.otpExpiry || user.otp !== String(otp) || user.otpExpiry < new Date()) {
    return { status: 400, body: { message: "Invalid or expired OTP" } };
  }
  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();
  return { status: 200, body: { message: "Password has been reset successfully" } };
};

export const resendOtp = async ({ email }) => {
  if (!email) return { status: 400, body: { message: "Email is required" } };
  const user = await userModel.findOne({ email });
  if (!user) return { status: 404, body: { message: "User not found" } };
  const otp = String(generateOTP());
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();
  let emailSent = true;
  try {
    await sendVerificationEmail({ name: user.name, email, otp });
  } catch (_) {
    emailSent = false;
  }
  return {
    status: 200,
    body: {
      message: emailSent ? 'OTP resent to your email' : 'OTP regenerated, but email could not be sent right now.',
    },
  };
};

export const listAllUsers = async () => {
  const users = await userModel.find();
  return { status: 200, body: { users } };
};

export const addFriendService = async ({ userId, friendId }) => {
  if (!friendId) return { status: 400, body: { message: 'friendId is required' } };
  if (String(userId) === String(friendId)) {
    return { status: 400, body: { message: 'Cannot send friend request to yourself' } };
  }
  const user = await userModel.findById(userId);
  if (!user) return { status: 404, body: { message: 'User not found' } };
  const friend = await userModel.findById(friendId);
  if (!friend) return { status: 404, body: { message: 'Friend not found' } };

  const alreadyFriends = (user.friends || []).some((id) => String(id) === String(friendId));
  if (alreadyFriends) {
    return { status: 200, body: { message: 'Already friends' } };
  }

  const alreadySent = (user.friendRequestsSent || []).some((id) => String(id) === String(friendId));
  const alreadyReceived = (user.friendRequestsReceived || []).some((id) => String(id) === String(friendId));
  if (alreadySent) return { status: 200, body: { message: 'Friend request already sent' } };
  if (alreadyReceived) return { status: 200, body: { message: 'User has already requested you' } };

  user.friendRequestsSent = [...(user.friendRequestsSent || []), friendId];
  friend.friendRequestsReceived = [...(friend.friendRequestsReceived || []), userId];
  await user.save();
  await friend.save();
  return { status: 200, body: { message: 'Friend request sent' } };
};

export const getFriendRequestsService = async ({ userId }) => {
  const user = await userModel
    .findById(userId)
    .populate('friendRequestsReceived', 'name email profilePhoto')
    .populate('friendRequestsSent', 'name email profilePhoto');
  if (!user) return { status: 404, body: { message: 'User not found' } };
  return {
    status: 200,
    body: {
      received: user.friendRequestsReceived || [],
      sent: user.friendRequestsSent || [],
    },
  };
};

export const respondFriendRequestService = async ({ userId, requesterId, action }) => {
  if (!requesterId || !['accept', 'decline'].includes(action)) {
    return { status: 400, body: { message: 'requesterId and valid action are required' } };
  }
  const user = await userModel.findById(userId);
  if (!user) return { status: 404, body: { message: 'User not found' } };
  const requester = await userModel.findById(requesterId);
  if (!requester) return { status: 404, body: { message: 'Requester not found' } };

  const receivedSet = new Set((user.friendRequestsReceived || []).map((id) => String(id)));
  if (!receivedSet.has(String(requesterId))) {
    return { status: 400, body: { message: 'No such friend request' } };
  }

  // Remove from pending lists
  user.friendRequestsReceived = (user.friendRequestsReceived || []).filter((id) => String(id) !== String(requesterId));
  requester.friendRequestsSent = (requester.friendRequestsSent || []).filter((id) => String(id) !== String(userId));

  if (action === 'accept') {
    user.friends = [...(user.friends || []), requesterId];
    requester.friends = [...(requester.friends || []), userId];
  }

  await requester.save();
  await user.save();
  return { status: 200, body: { message: action === 'accept' ? 'Friend request accepted' : 'Friend request declined' } };
};

export const getFriendsService = async ({ userId }) => {
  const user = await userModel
    .findById(userId)
    .populate('friends', 'name email profilePhoto');
  if (!user) return { status: 404, body: { message: 'User not found' } };
  return { status: 200, body: { friends: user.friends || [] } };
};
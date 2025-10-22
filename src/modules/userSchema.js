import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    profilePhoto: {
      url: { type: String, default: null },
      public_id: { type: String, default: null }
    },
  isVerified: { type: Boolean, default: false },   // OTP verify flag
  otp: { type: String },                          // current OTP
  otpExpiry: { type: Date },
  friends: [{ type: Schema.Types.ObjectId, ref: 'userSchema' }],
  friendRequestsSent: [{ type: Schema.Types.ObjectId, ref: 'userSchema' }],
  friendRequestsReceived: [{ type: Schema.Types.ObjectId, ref: 'userSchema' }]
})

// password hash middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel = mongoose.model("userSchema", userSchema);

export default userModel;
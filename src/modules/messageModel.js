import mongoose from "mongoose";

const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "userSchema", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "userSchema", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;

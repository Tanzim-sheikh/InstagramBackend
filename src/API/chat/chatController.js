import MessageModel from "../../modules/messageModel.js";

export const getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId and receiverId are required" });
    }

    const messages = await MessageModel.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({ messages });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch messages" });
  }
};

export const getUnreadSummary = async (req, res) => {
  try {
    const me = req.user?.id;
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    const unread = await MessageModel.find({ receiverId: me, read: false }).select("senderId");
    const total = unread.length;
    const byFriend = {};
    for (const m of unread) {
      const key = String(m.senderId);
      byFriend[key] = (byFriend[key] || 0) + 1;
    }
    return res.status(200).json({ total, byFriend });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to fetch unread summary" });
  }
};

export const markRead = async (req, res) => {
  try {
    const me = req.user?.id;
    const { senderId } = req.body || {};
    if (!me) return res.status(401).json({ message: "Unauthorized" });
    if (!senderId) return res.status(400).json({ message: "senderId is required" });
    await MessageModel.updateMany({ senderId, receiverId: me, read: false }, { $set: { read: true } });
    return res.status(200).json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to mark read" });
  }
};

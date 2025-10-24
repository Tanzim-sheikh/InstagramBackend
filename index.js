// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import http from "http";
// import { Server as SocketIOServer } from "socket.io";
// import connectDB from "./src/helper/config/mongoDB.js";
// import userRoutes from "./src/API/user/index.js";
// import { verifyTransport } from "./src/helper/common/mailer.js";
// import { getMessages, getUnreadSummary, markRead } from "./src/API/chat/chatController.js";
// import MessageModel from "./src/modules/messageModel.js";
// import { protect } from "./src/helper/common/authMiddleware.js";

// if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
//   dotenv.config();
// }

// const app = express();
// const PORT = process.env.PORT || 5000;

// // ✅ Middleware
// const allowedOrigins = [
//   "http://localhost:5173",
//   process.env.CLIENT_ORIGIN,
//   "https://instachatapp.netlify.app",
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: (origin, cb) => {
//       if (!origin) return cb(null, true); // allow non-browser tools
//       if (allowedOrigins.includes(origin)) return cb(null, true);
//       return cb(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
//     optionsSuccessStatus: 200,
//   })
// );

// // Note: Global cors() above will handle OPTIONS preflight automatically in Express v5.

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ✅ Database Connection
// connectDB();

// // ✅ Verify SMTP transporter (logs success/failure once)
// verifyTransport();

// // ✅ Routes
// app.get("/", (req, res) => {
//   res.send("✅ Backend is running successfully!");
// });

// app.use("/api/user", userRoutes);
// // Messages API (protected)
// app.get("/api/messages", protect, getMessages);
// app.get("/api/unread-summary", protect, getUnreadSummary);
// app.post("/api/mark-read", protect, markRead);

// // ✅ Export app for Vercel
// export default app;

// // ✅ Start server with Socket.io locally (ignored by Vercel)
// if (process.env.VERCEL !== '1') {
//   const server = http.createServer(app);
//   const io = new SocketIOServer(server, {
//     cors: {
//       origin: allowedOrigins,
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   const roomIdFor = (a, b) => [String(a), String(b)].sort().join("_");
//   const userSockets = new Map(); // userId -> Set<socketId>

//   const emitOnlineUsers = () => {
//     const online = Array.from(userSockets.keys());
//     io.emit("onlineUsers", online);
//   };

//   io.on("connection", (socket) => {
//     socket.on("register", ({ userId }) => {
//       if (!userId) return;
//       const key = String(userId);
//       const set = userSockets.get(key) || new Set();
//       set.add(socket.id);
//       userSockets.set(key, set);
//       emitOnlineUsers();
//     });

//     socket.on("typing", ({ senderId, receiverId }) => {
//       if (!senderId || !receiverId) return;
//       const room = roomIdFor(senderId, receiverId);
//       // Broadcast typing to the room
//       io.to(room).emit("typing", { from: String(senderId) });
//     });

//     socket.on("joinRoom", ({ senderId, receiverId }) => {
//       if (!senderId || !receiverId) return;
//       const room = roomIdFor(senderId, receiverId);
//       socket.join(room);
//     });

//     socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
//       if (!senderId || !receiverId || !message) return;
//       try {
//         const doc = await MessageModel.create({ senderId, receiverId, message });
//         const payload = {
//           _id: doc._id,
//           senderId: String(doc.senderId),
//           receiverId: String(doc.receiverId),
//           message: doc.message,
//           createdAt: doc.createdAt,
//         };
//         const room = roomIdFor(senderId, receiverId);
//         io.to(room).emit("receiveMessage", payload);
//         // Notify receiver about unread increment if online
//         const recKey = String(receiverId);
//         const targets = userSockets.get(recKey);
//         if (targets) {
//           for (const sid of targets) io.to(sid).emit("unreadIncrement", { from: String(senderId) });
//         }
//       } catch (e) {
//         // Optional: handle error
//       }
//     });

//     socket.on("disconnect", () => {
//       // Clean from userSockets
//       for (const [uid, set] of userSockets.entries()) {
//         if (set.has(socket.id)) {
//           set.delete(socket.id);
//           if (set.size === 0) userSockets.delete(uid);
//           break;
//         }
//       }
//       emitOnlineUsers();
//     });
//   });

//   server.listen(PORT, () => {
//     console.log(`🚀 Server with Socket.io listening on http://localhost:${PORT}`);
//   });
// }



import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/helper/config/mongoDB.js";
import userRoutes from "./src/API/user/index.js";
import { verifyTransport } from "./src/helper/common/mailer.js";
import { getMessages, getUnreadSummary, markRead } from "./src/API/chat/chatController.js";
import { protect } from "./src/helper/common/authMiddleware.js";

if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN,
  "https://instachatapp.netlify.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Database Connection
connectDB();

// ✅ Verify SMTP transporter
verifyTransport();

// ✅ Routes
app.get("/", (req, res) => {
  res.json({ 
    status: "✅ Backend is running successfully!",
    socket: "Socket.io not available on Vercel - use Render.com for real-time features"
  });
});

app.use("/api/user", userRoutes);
app.get("/api/messages", protect, getMessages);
app.get("/api/unread-summary", protect, getUnreadSummary);
app.post("/api/mark-read", protect, markRead);

// ✅ Socket.io info route
app.get("/api/socket-info", (req, res) => {
  res.json({
    message: "Socket.io requires a platform with WebSocket support like Render.com or Railway.app",
    supportedPlatforms: ["Render.com", "Railway.app", "Heroku", "DigitalOcean"],
    currentPlatform: "Vercel (Serverless - No WebSocket support)"
  });
});

// ✅ Export app for Vercel
export default app;

// ✅ Socket.io code ONLY for local development
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
  import('http').then(http => {
    import('socket.io').then(socketIo => {
      const server = http.createServer(app);
      const io = new socketIo.Server(server, {
        cors: {
          origin: allowedOrigins,
          methods: ["GET", "POST"],
          credentials: true,
        },
      });

      // Your existing socket.io code here...
      const roomIdFor = (a, b) => [String(a), String(b)].sort().join("_");
      const userSockets = new Map();

      io.on("connection", (socket) => {
        console.log("User connected locally:", socket.id);
        // ... rest of your socket code
      });

      server.listen(PORT, () => {
        console.log(`🚀 Local Server with Socket.io on http://localhost:${PORT}`);
      });
    });
  });
}
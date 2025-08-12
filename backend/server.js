const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const searchRoutes = require("./routes/searchRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const postRoutes = require("./routes/postRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes.js");
const reportRoutes = require("./routes/reportRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const feedbackRoutes = require("./routes/feedbackRoutes.js");
const communityRoutes = require("./routes/communityRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const { startCleanupScheduler } = require("./utils/cleanupNotifications");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const User = require("./models/User");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", async (userId) => {
    if (userId) {
      socket.join(userId);
      socket.userId = userId;

      try {
        await User.findByIdAndUpdate(userId, {
          online: true,
          lastSeen: new Date(),
        });

        const onlineUsers = await User.find({
          online: true,
          _id: { $ne: userId },
        });
        const onlineUserIds = onlineUsers.map((user) => user._id.toString());

        socket.emit("online_users", onlineUserIds);

        socket.broadcast.emit("user_status_change", {
          userId: userId,
          online: true,
        });
      } catch (error) {
        console.error("Error updating user online status:", error);
      }
    }
  });

  socket.on("send_message", async (data) => {
    const Message = require("./models/Message");
    const newMessage = new Message({
      sender: data.senderId,
      receiver: data.receiverId,
      content: data.content,
      type: data.type || "text",
      imageUrl: data.imageUrl,
    });
    await newMessage.save();
    await newMessage.populate("sender", "username name avatar");
    socket.emit("message_sent", newMessage);
    socket.to(data.receiverId).emit("new_message", newMessage);
  });

  socket.on("post_liked", async (data) => {
    try {
      const Post = require("./models/Post");
      const post = await Post.findById(data.postId);
      if (post) {
        io.emit("post_liked", {
          postId: data.postId,
          likes: post.likes.length,
          liked: data.liked,
        });
      }
    } catch (error) {
      console.error("Error handling post_liked event:", error);
    }
  });

  socket.on("post_shared", async (data) => {
    try {
      const Post = require("./models/Post");
      const post = await Post.findById(data.postId);
      if (post) {
        io.emit("post_shared", {
          postId: data.postId,
          shares: post.shares,
        });
      }
    } catch (error) {
      console.error("Error handling post_shared event:", error);
    }
  });

  socket.on("comment_added", async (data) => {
    try {
      const Comment = require("./models/Comment");
      const comments = await Comment.find({ post: data.postId });
      io.emit("comment_added", {
        postId: data.postId,
        commentId: data.commentId,
        commentCount: comments.length,
      });
    } catch (error) {
      console.error("Error handling comment_added event:", error);
    }
  });

  socket.on("user_followed", async (data) => {
    try {
      io.emit("user_followed", {
        userId: data.userId,
        followerId: data.followerId,
        followersCount: data.followersCount,
        followingCount: data.followingCount,
      });
    } catch (error) {
      console.error("Error handling user_followed event:", error);
    }
  });

  socket.on("typing", (data) => {
    const { senderId, receiverId, isTyping } = data;
    socket.to(receiverId).emit("user_typing", { senderId, isTyping });
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          online: false,
          lastSeen: new Date(),
        });

        socket.broadcast.emit("user_status_change", {
          userId: socket.userId,
          online: false,
        });
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }
    }
  });
});

app.set("io", io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.use("/uploads/chat-images", express.static("uploads/chat-images"));

app.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (user) {
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Email Verified - SlugLime</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        .container { background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; width: 100%; }
                        .success-icon { color: #28a745; font-size: 48px; margin-bottom: 20px; }
                        h1 { color: #333; margin-bottom: 10px; }
                        p { color: #666; margin-bottom: 20px; }
                        .btn { background: #6CA0DC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success-icon">✅</div>
                        <h1>Email Verified!</h1>
                        <p>Your email has been successfully verified. You can now log in to your SlugLime account.</p>
                        <a href="sluglime://login" class="btn">Open SlugLime</a>
                    </div>
                </body>
                </html>
            `);
    } else {
      res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Verification Failed - SlugLime</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        .container { background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; width: 100%; }
                        .error-icon { color: #dc3545; font-size: 48px; margin-bottom: 20px; }
                        h1 { color: #333; margin-bottom: 10px; }
                        p { color: #666; margin-bottom: 20px; }
                        .btn { background: #6CA0DC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">❌</div>
                        <h1>Verification Failed</h1>
                        <p>The verification link is invalid or has expired. Please try again.</p>
                        <a href="sluglime://login" class="btn">Open SlugLime</a>
                    </div>
                </body>
                </html>
            `);
    }
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).send("Server error");
  }
});

app.get("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (user) {
      res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reset Password - SlugLime</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        .container { background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; width: 100%; }
                        .logo { background: #6CA0DC; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
                        .logo span { color: white; font-size: 24px; font-weight: bold; }
                        h1 { color: #333; margin-bottom: 20px; }
                        p { color: #666; margin-bottom: 20px; }
                        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px; font-size: 16px; box-sizing: border-box; }
                        .btn { background: #6CA0DC; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; }
                        .btn:hover { background: #5a8bc7; }
                        .error { color: #dc3545; margin-top: 10px; }
                        .success { color: #28a745; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo"><span>S</span></div>
                        <h1>Reset Your Password</h1>
                        <p>Enter your new password below:</p>
                        <form id="resetForm">
                            <input type="password" id="newPassword" placeholder="New Password" required minlength="6">
                            <input type="password" id="confirmPassword" placeholder="Confirm Password" required minlength="6">
                            <button type="submit" class="btn">Reset Password</button>
                        </form>
                        <div id="message"></div>
                    </div>
                    <script>
                        document.getElementById('resetForm').addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const newPassword = document.getElementById('newPassword').value;
                            const confirmPassword = document.getElementById('confirmPassword').value;
                            const messageDiv = document.getElementById('message');
                            
                            if (newPassword !== confirmPassword) {
                                messageDiv.innerHTML = '<p class="error">Passwords do not match!</p>';
                                return;
                            }
                            
                            if (newPassword.length < 6) {
                                messageDiv.innerHTML = '<p class="error">Password must be at least 6 characters long!</p>';
                                return;
                            }
                            
                            try {
                                const response = await fetch('/api/auth/reset-password', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        token: '${token}',
                                        newPassword: newPassword
                                    })
                                });
                                
                                const data = await response.json();
                                
                                if (response.ok) {
                                    messageDiv.innerHTML = '<p class="success">Password reset successfully! You can now log in with your new password.</p>';
                                    setTimeout(() => {
                                        window.location.href = 'sluglime://login';
                                    }, 2000);
                                } else {
                                    messageDiv.innerHTML = '<p class="error">' + (data.error || 'Failed to reset password') + '</p>';
                                }
                            } catch (error) {
                                messageDiv.innerHTML = '<p class="error">Network error. Please try again.</p>';
                            }
                        });
                    </script>
                </body>
                </html>
            `);
    } else {
      res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reset Failed - SlugLime</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        .container { background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; width: 100%; }
                        .error-icon { color: #dc3545; font-size: 48px; margin-bottom: 20px; }
                        h1 { color: #333; margin-bottom: 10px; }
                        p { color: #666; margin-bottom: 20px; }
                        .btn { background: #6CA0DC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">❌</div>
                        <h1>Reset Failed</h1>
                        <p>The password reset link is invalid or has expired. Please request a new reset link.</p>
                        <a href="sluglime://login" class="btn">Open SlugLime</a>
                    </div>
                </body>
                </html>
            `);
    }
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).send("Server error");
  }
});

app.get("/verify-email-change/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
      pendingEmail: { $exists: true, $ne: null },
    });

    if (!user) {
      return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Email Change Failed</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; background: #18191A; color: #fff; margin: 0; padding: 20px; }
                        .container { max-width: 500px; margin: 50px auto; text-align: center; }
                        .card { background: #232425; border-radius: 15px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                        .error { color: #FF6B6B; font-size: 24px; margin-bottom: 20px; }
                        .message { color: #CCCCCC; margin-bottom: 30px; }
                        .button { background: #6CA0DC; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="error">❌</div>
                            <h1>Email Change Failed</h1>
                            <p class="message">Invalid or expired verification token.</p>
                            <button class="button" onclick="window.location.href='sluglime://account'">Back to Settings</button>
                        </div>
                    </div>
                </body>
                </html>
            `);
    }

    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Changed Successfully</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; background: #18191A; color: #fff; margin: 0; padding: 20px; }
                    .container { max-width: 500px; margin: 50px auto; text-align: center; }
                    .card { background: #232425; border-radius: 15px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                    .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                    .welcome { color: #28a745; font-size: 20px; margin-bottom: 15px; }
                    .message { color: #CCCCCC; margin-bottom: 30px; line-height: 1.6; }
                    .button { background: #6CA0DC; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
                    .logo { background: #6CA0DC; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
                    .logo span { color: white; font-size: 24px; font-weight: bold; }
                    .email-info { background: #2A2B2C; border-radius: 8px; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="logo"><span>S</span></div>
                        <h1>Email Changed Successfully!</h1>
                        <p class="welcome">Hello, ${user.name}!</p>
                        <div class="success">✅</div>
                        <h2>Your email has been updated</h2>
                        <div class="email-info">
                            <p style="margin: 5px 0; color: #CCCCCC;">Old Email: ${oldEmail}</p>
                            <p style="margin: 5px 0; color: #28a745; font-weight: bold;">New Email: ${user.email}</p>
                        </div>
                        <p class="message">Your email address has been successfully changed. You can now use your new email address for login and notifications.</p>
                        <button class="button" onclick="window.location.href='sluglime://account'">Back to Settings</button>
                    </div>
                </div>
            </body>
            </html>
        `);
  } catch (err) {
    console.error("Email change verification error:", err);
    res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Change Error</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; background: #18191A; color: #fff; margin: 0; padding: 20px; }
                    .container { max-width: 500px; margin: 50px auto; text-align: center; }
                    .card { background: #232425; border-radius: 15px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                    .error { color: #FF6B6B; font-size: 24px; margin-bottom: 20px; }
                    .message { color: #CCCCCC; margin-bottom: 30px; }
                    .button { background: #6CA0DC; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="error">❌</div>
                        <h1>Email Change Error</h1>
                        <p class="message">An error occurred during email change. Please try again.</p>
                        <button class="button" onclick="window.location.href='sluglime://account'">Back to Settings</button>
                    </div>
                </div>
            </body>
            </html>
        `);
  }
});

connectDB();
startCleanupScheduler();

app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/admin", adminRoutes);

app.get('/.well-known/assetlinks.json', (req, res) => {
  const packageName = process.env.ANDROID_PACKAGE || 'com.anonymous.sluglime';
  const sha256 = process.env.ANDROID_SHA256 || '2B:6A:7A:AA:BB:92:A7:E6:DA:6A:F9:F8:F9:6E:04:2E:47:B7:BF:7C:EE:5A:43:AC:C9:8B:68:8C:4F:F9:AA:76';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: [sha256]
      }
    }
  ]));
});

app.get('/apple-app-site-association', (req, res) => {
  const teamId = process.env.IOS_TEAM_ID || 'YOUR_IOS_TEAM_ID';
  const bundleId = process.env.IOS_BUNDLE_ID || 'com.anonymous.sluglime';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    applinks: {
      apps: [],
      details: [
        {
          appIDs: [`${teamId}.${bundleId}`],
          components: [
            { "/": "/posts/*" },
            { "/": "/p/*" }
          ]
        }
      ]
    }
  }));
});

app.get('/posts/:id', (req, res) => {
  const postId = req.params.id;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SlugLime - Post</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                background: #000000; 
                color: #ffffff; 
                margin: 0; 
                padding: 20px; 
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .container { 
                max-width: 500px; 
                text-align: center; 
                background: #1a1a1a;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }
            .logo { 
                background: #007AFF; 
                width: 80px; 
                height: 80px; 
                border-radius: 50%; 
                margin: 0 auto 20px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 24px;
                font-weight: bold;
            }
            .title { 
                color: #ffffff; 
                font-size: 24px; 
                margin-bottom: 20px; 
            }
            .message { 
                color: #cccccc; 
                margin-bottom: 30px; 
                line-height: 1.6; 
            }
            .button { 
                background: #007AFF; 
                color: white; 
                padding: 15px 30px; 
                border: none; 
                border-radius: 25px; 
                font-size: 16px; 
                cursor: pointer; 
                text-decoration: none;
                display: inline-block;
                margin: 10px;
            }
            .button:hover {
                background: #0056b3;
            }
            .app-link {
                background: #007AFF;
                color: white;
                padding: 15px 30px;
                border-radius: 25px;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">S</div>
            <h1 class="title">SlugLime</h1>
            <p class="message">
                This link will open a post in the SlugLime app. 
                If you don't have the app installed, you can download it from the app store.
            </p>
            <a href="sluglime://posts/${postId}" class="app-link">
                Open in SlugLime App
            </a>
            <br>
            <a href="https://play.google.com/store/apps/details?id=com.anonymous.sluglime" class="button">
                Download for Android
            </a>
            <a href="https://apps.apple.com/app/sluglime/id123456789" class="button">
                Download for iOS
            </a>
        </div>
        <script>
            // Try to open the app automatically
            setTimeout(() => {
                window.location.href = 'sluglime://posts/${postId}';
            }, 1000);
        </script>
    </body>
    </html>
  `);
});

app.get('/p/:id', (req, res) => {
  const postId = req.params.id;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SlugLime - Post</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                background: #000000; 
                color: #ffffff; 
                margin: 0; 
                padding: 20px; 
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .container { 
                max-width: 500px; 
                text-align: center; 
                background: #1a1a1a;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }
            .logo { 
                background: #007AFF; 
                width: 80px; 
                height: 80px; 
                border-radius: 50%; 
                margin: 0 auto 20px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 24px;
                font-weight: bold;
            }
            .title { 
                color: #ffffff; 
                font-size: 24px; 
                margin-bottom: 20px; 
            }
            .message { 
                color: #cccccc; 
                margin-bottom: 30px; 
                line-height: 1.6; 
            }
            .button { 
                background: #007AFF; 
                color: white; 
                padding: 15px 30px; 
                border: none; 
                border-radius: 25px; 
                font-size: 16px; 
                cursor: pointer; 
                text-decoration: none;
                display: inline-block;
                margin: 10px;
            }
            .button:hover {
                background: #0056b3;
            }
            .app-link {
                background: #007AFF;
                color: white;
                padding: 15px 30px;
                border-radius: 25px;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">S</div>
            <h1 class="title">SlugLime</h1>
            <p class="message">
                This link will open a post in the SlugLime app. 
                If you don't have the app installed, you can download it from the app store.
            </p>
            <a href="sluglime://posts/${postId}" class="app-link">
                Open in SlugLime App
            </a>
            <br>
            <a href="https://play.google.com/store/apps/details?id=com.anonymous.sluglime" class="button">
                Download for Android
            </a>
            <a href="https://apps.apple.com/app/sluglime/id123456789" class="button">
                Download for iOS
            </a>
        </div>
        <script>
            // Try to open the app automatically
            setTimeout(() => {
                window.location.href = 'sluglime://posts/${postId}';
            }, 1000);
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
});

module.exports = app;

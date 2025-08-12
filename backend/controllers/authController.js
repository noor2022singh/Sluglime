const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "garsh5444@gmail.com",
    pass: "lavipmdevvokbfvj",
  },
});

async function sendVerificationEmail(email, name, token) {
  const verificationUrl = `${
    process.env.SERVER_URL || "https://sluglime.onrender.com"
  }/verify-email/${token}`;

  const mailOptions = {
    from: "SlugLime <garsh5444@gmail.com>",
    to: email,
    subject: "Welcome to SlugLime - Verify Your Email",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #6CA0DC 0%, #4A90E2 100%); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(108, 160, 220, 0.3);">
                        <span style="color: white; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">S</span>
                    </div>
                    <h1 style="color: #333; margin-bottom: 10px; font-size: 28px;">Welcome to SlugLime!</h1>
                    <p style="color: #666; margin-bottom: 25px; font-size: 16px;">The modern platform for secure authentication and user management.</p>
                    <h2 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">Welcome, ${name}!</h2>
                    <p style="color: #333; margin-bottom: 30px; font-size: 16px; line-height: 1.6;">Thank you for joining SlugLime! To complete your registration, please verify your email address by clicking the button below.</p>
                    <a href="${verificationUrl}" style="background: linear-gradient(135deg, #6CA0DC 0%, #4A90E2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(108, 160, 220, 0.3); transition: all 0.3s ease;">Verify Email Address</a>
                    <p style="color: #666; margin-top: 30px; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="color: #6CA0DC; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #6CA0DC;">${verificationUrl}</p>
                    <p style="color: #666; margin-top: 30px; font-size: 14px;">This link will expire in 24 hours.</p>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">© 2024 SlugLime. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendEmailChangeVerification(email, name, token) {
  const verificationUrl = `${
    process.env.SERVER_URL || "https://sluglime.onrender.com"
  }/verify-email-change/${token}`;

  const mailOptions = {
    from: "SlugLime <garsh5444@gmail.com>",
    to: email,
    subject: "SlugLime - Email Change Verification",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #6CA0DC 0%, #4A90E2 100%); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(108, 160, 220, 0.3);">
                        <span style="color: white; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">S</span>
                    </div>
                    <h1 style="color: #333; margin-bottom: 10px; font-size: 28px;">Email Change Request</h1>
                    <p style="color: #666; margin-bottom: 25px; font-size: 16px;">You requested to change your email address on SlugLime.</p>
                    <h2 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">Hello, ${name}!</h2>
                    <p style="color: #333; margin-bottom: 30px; font-size: 16px; line-height: 1.6;">To complete your email change, please click the button below to verify your new email address.</p>
                    <a href="${verificationUrl}" style="background: linear-gradient(135deg, #6CA0DC 0%, #4A90E2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(108, 160, 220, 0.3); transition: all 0.3s ease;">Verify Email Change</a>
                    <p style="color: #666; margin-top: 30px; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="color: #6CA0DC; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #6CA0DC;">${verificationUrl}</p>
                    <p style="color: #666; margin-top: 30px; font-size: 14px;">This link will expire in 24 hours.</p>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">© 2024 SlugLime. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${
    process.env.SERVER_URL || "https://sluglime.onrender.com"
  }/reset-password/${token}`;

  const mailOptions = {
    from: "SlugLime <garsh5444@gmail.com>",
    to: email,
    subject: "SlugLime - Password Reset Request",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #6CA0DC 0%, #4A90E2 100%); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(108, 160, 220, 0.3);">
                        <span style="color: white; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">S</span>
                    </div>
                    <h1 style="color: #333; margin-bottom: 10px; font-size: 28px;">Password Reset Request</h1>
                    <p style="color: #666; margin-bottom: 25px; font-size: 16px;">You requested to reset your password on SlugLime.</p>
                    <h2 style="color: #28a745; margin-bottom: 20px; font-size: 22px;">Hello, ${name}!</h2>
                    <p style="color: #333; margin-bottom: 30px; font-size: 16px; line-height: 1.6;">To reset your password, please click the button below. This will take you to a secure page where you can create a new password.</p>
                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #6CA0DC 0%, #4A90E2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(108, 160, 220, 0.3); transition: all 0.3s ease;">Reset Password</a>
                    <p style="color: #666; margin-top: 30px; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="color: #6CA0DC; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #6CA0DC;">${resetUrl}</p>
                    <p style="color: #666; margin-top: 30px; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
                    <p style="color: #ff4444; margin-top: 20px; font-size: 14px; font-weight: bold;">If you didn't request this password reset, please ignore this email.</p>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">© 2024 SlugLime. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `,
  };

  await transporter.sendMail(mailOptions);
}

exports.register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    if (!username || !name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: "User already exists." });
    }
    const hashed = await bcrypt.hash(password, 10);

    let avatarUrl = '';
    if (req.file) {
      avatarUrl = req.file.path; 
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      username,
      name,
      email,
      password: hashed,
      avatar: avatarUrl,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });
    await user.save();

    await sendVerificationEmail(email, name, verificationToken);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.emailVerificationToken;
    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
      user: userObj,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    if (user.suspended) {
      if (user.suspendedUntil && user.suspendedUntil > new Date()) {
        const until = user.suspendedUntil.toLocaleString();
        return res
          .status(403)
          .json({ error: `Your account is suspended until ${until}.` });
      } else if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        user.suspended = false;
        user.suspendedUntil = null;
        user.suspensionReason = "";
        await user.save();
      } else if (!user.suspendedUntil) {
        return res
          .status(403)
          .json({ error: "Your account is permanently suspended." });
      }
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj, token });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token." });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully!",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.changeEmail = async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    if (!userId || !newEmail) {
      return res
        .status(400)
        .json({ error: "userId and newEmail are required." });
    }
    const existing = await User.findOne({ email: newEmail });
    if (existing) {
      return res.status(400).json({ error: "Email already in use." });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    user.email = newEmail;
    await user.save();
    res.json({ success: true, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "userId, oldPassword, and newPassword are required." });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect." });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
};

exports.changeEmailWithVerification = async (req, res) => {
  try {
    const { userId, newEmail } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.pendingEmail = newEmail;
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    await sendEmailChangeVerification(newEmail, user.name, verificationToken);

    res.json({
      success: true,
      message:
        "Verification email sent to new email address. Please check your inbox and click the verification link to complete the email change.",
    });
  } catch (err) {
    console.error("Email change error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
      pendingEmail: { $exists: true, $ne: null },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email changed successfully!",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Email change verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account with this email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({
      success: true,
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required." });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

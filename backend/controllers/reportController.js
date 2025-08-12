const Report = require("../models/Report");
const Post = require("../models/Post");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "garsh5444@gmail.com",
    pass: "lavipmdevvokbfvj",
  },
});

async function sendEmail(to, subject, text) {
  if (!to) {
    return;
  }
  try {
    await transporter.sendMail({
      from: "Sluglime <your_gmail@gmail.com>",
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
  }
}

exports.createReport = async (req, res) => {
  try {
    const { postId, reason, details, reporterId, reporterEmail } = req.body;

    if (!postId || !reason || !reporterEmail)
      return res.status(400).json({ error: "Missing fields" });
    const post = await Post.findById(postId).populate("author");
    if (!post) return res.status(404).json({ error: "Post not found" });
    const authorEmail = post.author?.email || "";
    const postLink = postId;
    const report = new Report({
      postId,
      reason,
      details,
      postLink,
      reporterId,
      reporterEmail,
      authorEmail,
    });

    await report.save();

    const reportCount = await Report.countDocuments({ postId });
    if (reportCount >= 5) {
      await Post.findByIdAndUpdate(postId, { hidden: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate("postId");
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.adminAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, duration } = req.body;

    const report = await Report.findById(id).populate({
      path: "postId",
      populate: {
        path: "author",
        select: "username name email",
      },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const post = report.postId;
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    let reporterMsg = "";
    let authorMsg = "";
    let authorEmail = post.author?.email || report.authorEmail || "";
    let reporterEmail = report.reporterEmail;

    if (action === "safe") {
      report.status = "dismissed";
      reporterMsg = "We've marked the post as safe. No action was needed.";
      if (reporterEmail)
        await sendEmail(reporterEmail, "Report Update", reporterMsg);
    } else {
      reporterMsg =
        "Thanks, we've reviewed this post and taken appropriate action.";
      if (action === "warn") {
        authorMsg =
          "You have received a warning regarding your post on Sluglime. Please adhere to our community guidelines.";
        report.status = "resolved";
      } else if (action === "delete") {
        authorMsg =
          "Your post has been removed by the admin for violating our policies.";
        await Post.findByIdAndDelete(post._id);
        report.status = "resolved";
      } else if (action === "suspend") {
        let suspendedUntil = null;
        let reason = "Severe policy violations.";
        if (duration === "1h")
          suspendedUntil = new Date(Date.now() + 1 * 60 * 60 * 1000);
        else if (duration === "6h")
          suspendedUntil = new Date(Date.now() + 6 * 60 * 60 * 1000);
        else if (duration === "1d")
          suspendedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        else if (duration === "1w")
          suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        else if (duration === "perm") suspendedUntil = null;
        authorMsg =
          "Your account has been suspended due to severe policy violations.";
        if (duration === "1h") authorMsg += " Ban duration: 1 hour.";
        else if (duration === "6h") authorMsg += " Ban duration: 6 hours.";
        else if (duration === "1d") authorMsg += " Ban duration: 1 day.";
        else if (duration === "1w") authorMsg += " Ban duration: 1 week.";
        else if (duration === "perm") authorMsg += " Ban duration: Permanent.";
        if (post.author)
          await User.findByIdAndUpdate(post.author._id, {
            suspended: true,
            suspendedUntil,
            suspensionReason: reason,
          });
        report.status = "resolved";
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }
      if (reporterEmail)
        await sendEmail(reporterEmail, "Report Update", reporterMsg);
      if (authorEmail)
        await sendEmail(authorEmail, "Action Taken on Your Post", authorMsg);
    }
    report.resolvedAt = new Date();
    await report.save();

    await Report.findByIdAndDelete(id);

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

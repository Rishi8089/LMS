import nodemailer from "nodemailer";
import Enrollment from "../models/EnrollmentsModel.js";
import dotenv from "dotenv";

dotenv.config();

/* ======================================================
   STABLE GMAIL TRANSPORTER (NO HANGS)
====================================================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ======================================================
   SEND 30-DAY REMINDER
====================================================== */
const sendDueDateReminder = async (
  employeeEmail,
  employeeName,
  courseTitle,
  dueDate
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: employeeEmail,
    subject: `📢 Course Deadline Reminder: ${courseTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px;">
      <p class="isSelectedEnd">Hello ${employeeName},</p>
      <p class="isSelectedEnd">This is a friendly reminder that the deadline to complete the course <strong>${courseTitle}</strong> is approaching.</p>
      <p class="isSelectedEnd">📅 <strong>Due Date:</strong> ${dueDate.toDateString()}<br>⏳ <strong>Days Remaining:</strong> 3 days</p>
      <p class="isSelectedEnd">Please ensure that you complete the course before the due date to avoid missing out on your learning progress and certification.</p>
      <p class="isSelectedEnd">If you have already completed the course, kindly ignore this email. Otherwise, we encourage you to log in and complete the remaining modules as soon as possible.</p>
      <p class="isSelectedEnd">If you face any difficulties or need assistance, feel free to reach out to the support team.</p>
      <p>Best regards,<br>Training Team<br>Strategy Boolean</p>
      </div>

    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${employeeEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Email failed for ${employeeEmail}`, error.message);
    return false;
  }
};

/* ======================================================
   CHECK & SEND 30-DAY REMINDERS
====================================================== */
const checkAndSendDueDateReminders = async () => {
  try {
    console.log("Running daily due date reminder check...");

    const today = new Date();

    // 📅 3 days from now
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // 📅 2 days from now
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    const enrollments = await Enrollment.find({
      dueDate: {
        $gte: twoDaysFromNow,
        $lte: threeDaysFromNow
      },
      status: "enrolled"
    })
      .populate("employee", "name email")
      .populate("course", "title");

    console.log(`🔍 Found ${enrollments.length} enrollments`);

    for (const enrollment of enrollments) {

      // 🔴 SAFETY CHECK
      if (!enrollment.employee || !enrollment.course) {
        console.warn(
          `⚠️ Skipping enrollment ${enrollment._id} (missing employee or course)`
        );
        continue;
      }

      await sendDueDateReminder(
        enrollment.employee.email,
        enrollment.employee.name,
        enrollment.course.title,
        new Date(enrollment.dueDate)
      );
    }

  } catch (error) {
    console.error("❌ Reminder job error:", error);
  }
};


export { sendDueDateReminder, checkAndSendDueDateReminders };

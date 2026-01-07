import axios from 'axios';
import Employee from '../models/EmployeeModel.js';
import Course from '../models/CourseModel.js';

// Send due date reminder using EmailJS REST API
const sendDueDateReminder = async (employeeEmail, employeeName, courseTitle, dueDate) => {
  try {
    const templateParams = {
      to_email: employeeEmail,
      to_name: employeeName,
      course_title: courseTitle,
      due_date: dueDate.toDateString(),
      days_remaining: 3
    };

    // Use EmailJS REST API directly to bypass server-side restrictions
    const response = await axios.post(
      `https://api.emailjs.com/api/v1.0/email/send`,
      {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
        accessToken: process.env.EMAILJS_PRIVATE_KEY
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Email sent successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error.response?.data || error.message);
    return false;
  }
};

// Function to check and send due date reminders
const checkAndSendDueDateReminders = async () => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find employees with courses due in 3 days
    const employeesWithDueCourses = await Employee.find({
      'enrolledCourses.dueDate': {
        $gte: tomorrow,
        $lte: threeDaysFromNow
      },
      'enrolledCourses.status': 'enrolled'
    }).populate('enrolledCourses.course');

    console.log(`Found ${employeesWithDueCourses.length} employees with courses due in 3 days`);

    for (const employee of employeesWithDueCourses) {
      for (const enrolledCourse of employee.enrolledCourses) {
        if (enrolledCourse.dueDate && enrolledCourse.status === 'enrolled') {
          const dueDate = new Date(enrolledCourse.dueDate);
          const daysDiff = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 3) {
            const course = await Course.findById(enrolledCourse.course);
            if (course) {
              console.log(`Sending reminder to ${employee.email} for course ${course.title}`);
              await sendDueDateReminder(
                employee.email,
                employee.name,
                course.title,
                dueDate
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendDueDateReminders:', error);
  }
};

export { sendDueDateReminder, checkAndSendDueDateReminders };

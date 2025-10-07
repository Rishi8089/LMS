# TODO: Fix All Bugs in LMS Codebase

## Backend Fixes
- [x] Remove unused Enrollment model and EnrollmentsController
- [x] Add progress field to Employee.enrolledCourses
- [x] Uncomment and enable email/password validation in authController
- [ ] Improve database connection error handling in connectDB
- [ ] Add rate limiting to auth endpoints

## Frontend Fixes
- [x] Replace hardcoded API URLs with serverUrl in Home.jsx and CourseCard.jsx
- [ ] Add state update after enrollment in CourseCard.jsx
- [x] Add loading states in Home.jsx
- [ ] Implement global error handling

## General Fixes
- [ ] Create .env.example file
- [ ] Remove unused dependencies (jwt-decode)
- [ ] Abstract filtering logic into custom hook
- [ ] Update server.js to remove unused routes

## Admin Panel Integration
- [x] Removed admin panel integration

## Testing
- [ ] Test enrollment flow after fixes
- [ ] Test API endpoints
- [ ] Test frontend interactions

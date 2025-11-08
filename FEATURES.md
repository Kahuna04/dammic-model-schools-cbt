# New Features Documentation

## Overview
Enhanced CBT system with class management, staff permissions, Excel export, and Word document question upload.

## Features Implemented

### 1. Class Management for Students
- **Classes Available**: JSS1, JSS2, JSS3, SSS1, SSS2, SSS3
- Students are now grouped by class
- Class field is required when adding students
- Email is now **optional** for students (only admission number and class are required)

### 2. Staff Management with Permissions
- Add staff members with email (required for staff)
- Assign permissions to staff:
  - **Can Create Exams**: Allow staff to create and manage exams
  - **Can Grade Submissions**: Allow staff to grade student submissions
  - **Can Manage Students**: Allow staff to manage student accounts

### 3. User Management Features
- **Add Users**: Add both students and staff with appropriate fields
- **Edit Users**: Update user details including name, class, admission number, etc.
- **Delete Users**: Remove users from the system (except admins)
- **Filter by Role**: Filter view by Students, Staff, or Admins
- **Filter by Class**: Filter students by their class level

### 4. Excel Export
- Export student data with credentials to Excel
- Filter by class before exporting
- Exported file includes:
  - Name
  - Admission Number
  - Class
  - Email (if provided)
  - Username
  - Password (auto-generated: surname + first initial, lowercase)
  - Date Joined

**How to Use**:
1. Go to "Manage Users" page
2. Optionally filter by class
3. Click "Export to Excel"
4. File downloads with all student credentials

### 5. Word Document Question Upload
- Upload questions from a Word document
- Automatically creates an exam with all questions
- System parses questions and marks correct answers

**Word Document Format**:
```
1. What is the capital of France?
A. London
B. Berlin
C. Paris*
D. Madrid

2. Which planet is known as the Red Planet?
A. Mars*
B. Venus
C. Jupiter
D. Saturn
```

**Requirements**:
- Number questions sequentially (1., 2., 3., etc.)
- Use A., B., C., D. for options
- Mark correct answer with asterisk (*)
- All questions have equal marks

**Upload Process**:
1. Navigate to `/dashboard/admin/upload-questions`
2. Select Word document (.doc or .docx)
3. Enter exam details:
   - Exam Title
   - Exam Description (optional)
   - Total Number of Questions
   - Marks Per Question
   - Duration in Minutes
   - Passing Percentage
4. Submit to create exam

### 6. Database Schema Updates
- `User` model now includes:
  - `classLevel`: ClassLevel enum (JSS1-3, SSS1-3)
  - `permissions`: JSON field for staff permissions
  - `email`: Now optional (nullable)

## API Endpoints

### User Management
- `GET /api/admin/users` - Fetch all users
- `POST /api/admin/users` - Create new user (student or staff)
- `PUT /api/admin/users/[id]` - Update user details
- `DELETE /api/admin/users/[id]` - Delete user

### Excel Export
- `GET /api/admin/export?class={CLASS_LEVEL}` - Export students to Excel
  - Use `class=ALL` for all students
  - Use `class=JSS1` for specific class

### Question Upload
- `POST /api/admin/questions/upload` - Upload questions from Word document
  - Multipart form data with file and exam details

## Pages

### User Management
- **Path**: `/dashboard/admin/users`
- **Features**: Add, edit, delete users; filter by role/class; export to Excel

### Question Upload
- **Path**: `/dashboard/admin/upload-questions`
- **Features**: Upload Word documents with questions to create exams

## Password Generation
- **Format**: `surname + first_initial` (lowercase)
- **Example**: 
  - Name: John Doe → Password: `doej`
  - Name: Mary Smith → Password: `smithm`

### 7. Exam Assignment to Classes
- Assign exams to specific classes (JSS1-3, SSS1-3)
- Set exam status (Draft, Published, Archived)
- Only published exams are visible to students
- Set start and end times (optional)
- Students only see exams assigned to their class

**How to Use**:
1. From admin dashboard, click "Assign" next to any exam
2. Select exam status:
   - **Draft**: Not visible to students
   - **Published**: Visible to assigned classes
   - **Archived**: No longer available
3. Select which classes can see the exam
4. Optionally set start/end times
5. Click "Save Assignment"

### 8. Download Exam Results
- Export exam results to Excel
- Includes student details, scores, and pass/fail status
- Two sheets: Results and Summary
- Grouped by class and sorted by name

**Excel Contents**:
- **Results Sheet**:
  - Name, Admission Number, Class, Email
  - Status, Score, Total Marks, Percentage
  - Pass/Fail status, Submission time
- **Summary Sheet**:
  - Exam details (title, marks, duration)
  - Statistics (total submissions, passed, failed, not graded)

**How to Use**:
1. From admin dashboard, click "Results" next to any exam
2. Excel file downloads automatically
3. File named: `exam_results_[exam_title]_[date].xlsx`

## Quick Access Links

### Admin Dashboard
- **Upload Questions**: `/dashboard/admin/upload-questions`
- **Manage Users**: `/dashboard/admin/users`
- **Assign Exam**: `/dashboard/admin/exams/[id]/assign`
- **Download Results**: `/api/admin/exams/[id]/results`

## Notes
- Admin accounts cannot be deleted
- Email is required for Staff but optional for Students
- Students use Admission Number as username
- Staff use Email as username
- All passwords follow the same generation pattern for consistency
- Only published exams assigned to a student's class are visible to them
- Draft exams are not visible to students until published

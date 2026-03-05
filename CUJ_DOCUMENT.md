# Critical User Journeys (CUJ) - Wonder Mentorship Homework Partner

This document maps every critical user journey in the Wonder Mentorship platform, covering both student and parent personas from first visit through ongoing engagement.

---

## CUJ Overview Map

```
                          Landing Page (/)
                         /                \
                   Student                Parent
                  Sign Up                Sign Up
                     |                      |
               Enter Join Code        Add Children
                     |                (get join codes)
                     |                      |
              Student Dashboard      Parent Dashboard
               /          \          /      |       \
          Grade HW    Practice    Children  Report  Donate
```

---

## CUJ 1: Parent Onboarding

**Persona:** Parent, new to the platform
**Path:** `/` -> `/auth/signup` -> `/parent` -> `/parent/children`
**Goal:** Create an account, add children, and get join codes to share

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/` | Clicks "I'm a Parent" | Navigates to `/parent` (redirected to login if not authenticated) |
| 2 | `/auth/signup` | Selects "Parent" role, enters name, email, password | Account created in Supabase Auth + `profiles` table |
| 3 | `/parent` | Views empty dashboard | Sees "Start by adding your children" prompt |
| 4 | `/parent/children` | Enters child's name and grade level, clicks "Add Child" | `students` record created with unique 6-character join code |
| 5 | `/parent/children` | Reads join code (e.g., `ABC123`) | Shares code with child verbally or on paper |

### Success Criteria
- Parent account created with `role = "parent"`
- Child profile created with `join_code` generated
- Join code visible on the Manage Children page

### Failure States
- Signup error (duplicate email, weak password) -> error message on form
- Profile insert fails -> "Account created but profile setup failed. Please try logging in."
- Join code collision (rare) -> auto-retries with new code

---

## CUJ 2: Student Onboarding and Family Linking

**Persona:** Student (grades 3-8), has a join code from parent
**Path:** `/` -> `/auth/signup` -> `/student/join` -> `/student`
**Goal:** Create an account and link to parent's family

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/auth/signup` | Selects "Student" role, enters name, email, password | Account created, routed to `/student/join` |
| 2 | `/student/join` | Enters 6-character join code from parent | System looks up `students` record by `join_code` |
| 3 | `/student/join` | Clicks "Join" | `students.user_id` updated to student's auth ID |
| 4 | `/student` | Arrives at student dashboard | Name and grade auto-fill on all student pages going forward |

### Success Criteria
- Student account created with `role = "student"`
- `students.user_id` linked to student's auth ID
- Parent's dashboard shows child as "Active"
- Student's name and grade pre-populate on homework/practice pages

### Failure States
- "Invalid code" -> code doesn't exist in database
- "This code has already been used" -> `user_id` is already set on that record
- "Failed to link account" -> database update error
- Already linked -> shows "You're all set!" with link to dashboard

---

## CUJ 3: Returning User Login

**Persona:** Any existing user (student or parent)
**Path:** `/auth/login` -> `/student` or `/parent`
**Goal:** Log in and reach the correct dashboard

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/auth/login` | Enters email and password | `supabase.auth.signInWithPassword()` called |
| 2 | `/auth/login` | System checks `profiles.role` | Routed to `/parent` if parent, `/student` if student |

### Success Criteria
- Session established, persists across navigation
- Correct portal loaded based on role

### Failure States
- Invalid credentials -> error message on form
- Missing profile -> defaults to student view

---

## CUJ 4: Homework Grading (Text Input)

**Persona:** Student, has completed homework on paper or digitally
**Path:** `/student/grade`
**Goal:** Get instant feedback on homework answers

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/student/grade` | Page loads | Name and grade auto-filled from linked profile (if linked) |
| 2 | `/student/grade` | Selects "Type It" mode (default) | Text input area shown |
| 3 | `/student/grade` | Types problems and answers (e.g., `1. 24 + 37 = 61`) | Text captured in form |
| 4 | `/student/grade` | Clicks "Check My Work" | `POST /api/grade` with `{studentName, gradeLevel, problems, studentId}` |
| 5 | Backend | Claude grades each problem | Returns JSON with grades array, overall_score, encouragement |
| 6 | Backend | `sanitizeStudentContent()` runs on all text | Donation/payment language stripped from response |
| 7 | Backend | If `studentId` exists | `grading_sessions` + `grading_results` records saved to DB |
| 8 | `/student/grade` | Results displayed | Per-problem cards (green=correct, amber=try again) with explanations and hints |

### Success Criteria
- Each problem graded with score (0 or 1)
- Encouraging, grade-appropriate explanations
- Overall score displayed (e.g., "4/5")
- Results saved to database for parent reporting
- No donation/payment language in any response

### Failure States
- "Something went wrong. Please try again!" -> API or Claude error
- Submit button disabled until text is entered
- Database save failure logged but doesn't block response to student

---

## CUJ 5: Homework Grading (Photo Upload)

**Persona:** Student, has handwritten homework
**Path:** `/student/grade`
**Goal:** Upload a photo of homework and get AI-powered grading

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/student/grade` | Clicks "Upload a Photo" toggle | File upload area shown with drag-to-upload zone |
| 2 | `/student/grade` | Selects or drags image file | File validated (type: JPEG/PNG/GIF/WebP, size: <10MB) |
| 3 | `/student/grade` | Image preview displayed | Base64 encoding generated via FileReader |
| 4 | `/student/grade` | Clicks "Check My Work" | `POST /api/grade` with `{studentName, gradeLevel, image, imageType, studentId}` |
| 5 | Backend | Claude Vision reads the homework image | Extracts problems and student answers from photo |
| 6 | Backend | Claude grades extracted problems | Same grading flow as text input |

### Success Criteria
- AI correctly reads handwritten/printed homework from photo
- Grading results match text-input quality
- Image preview shown before submission
- "Remove" button allows re-upload

### Failure States
- "Please upload an image file" -> non-image file selected
- "Image must be under 10MB" -> oversized file
- Submit button disabled until image uploaded
- Blurry/unreadable photos -> AI may misread problems (graceful degradation)

---

## CUJ 6: Practice Problem Generation

**Persona:** Student, wants extra practice on specific topics
**Path:** `/student/practice`
**Goal:** Get custom practice problems with step-by-step solutions

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/student/practice` | Page loads | Name and grade auto-filled from linked profile |
| 2 | `/student/practice` | Selects topics via toggle buttons | Multiple topics can be selected (e.g., Fractions + Word Problems) |
| 3 | `/student/practice` | Clicks "Generate Problems" | `POST /api/practice` with `{studentName, gradeLevel, topics, studentId}` |
| 4 | Backend | Claude generates 5 grade-appropriate problems | Returns `practice_problems` array with problem, solution, explanation |
| 5 | Backend | Content sanitized + session saved to DB | `practice_sessions` record created |
| 6 | `/student/practice` | Problems displayed (solutions hidden) | Each problem shown with "Show Solution" button |
| 7 | `/student/practice` | Student clicks "Show Solution" on a problem | Solution and step-by-step explanation revealed |

### Available Topics
Addition, Subtraction, Multiplication, Division, Fractions, Decimals, Percentages, Algebra, Geometry, Word Problems

### Success Criteria
- 5 problems generated per request
- Difficulty matches grade level
- Solutions hidden by default (encourages independent work)
- Session saved with topics for parent reporting

### Failure States
- "Something went wrong. Please try again!" -> API error
- Generate button disabled until at least 1 topic selected
- Loading spinner during generation ("Creating practice problems...")

---

## CUJ 7: Parent Views Child Progress (Dashboard)

**Persona:** Parent, checking on child's learning
**Path:** `/parent`
**Goal:** See at-a-glance stats for all children

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/parent` | Page loads | Fetches all children and their `grading_sessions` |
| 2 | `/parent` | Views child cards | Each child shows: Sessions count, Problems count, Accuracy % |
| 3 | `/parent` | Checks link status | "Active" badge (linked) or "Not linked" badge (awaiting join) |

### Computed Stats
- **Sessions** = count of `grading_sessions` records
- **Problems** = sum of `total_problems` across all sessions
- **Accuracy** = `total_correct / total_problems * 100` (0% if no problems)

### Success Criteria
- All children displayed with real-time stats
- Stats update after each student homework session
- Clear visual distinction between linked and unlinked children

---

## CUJ 8: Parent Generates Weekly Report

**Persona:** Parent, wants a summary of child's week
**Path:** `/parent/report`
**Goal:** Get an AI-generated progress report based on real activity data

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/parent/report` | Page loads | Dropdown populated with linked children |
| 2 | `/parent/report` | Selects child from dropdown | Child selected for report |
| 3 | `/parent/report` | Optionally adds strengths and areas to improve | Freeform text (comma-separated) |
| 4 | `/parent/report` | Clicks "Generate Report" | `POST /api/report` with `{studentId, strengths, improvementAreas}` |
| 5 | Backend | Queries last 7 days of data | Fetches `grading_sessions` + `practice_sessions` since 7 days ago |
| 6 | Backend | Computes: problems completed, accuracy, unique topics | Aggregated from real session data |
| 7 | Backend | Claude generates narrative report | Returns `weekly_summary`, `highlights[]`, `suggestions[]` |
| 8 | `/parent/report` | Report displayed | Summary, green highlights section, blue suggestions section |

### Data Pulled Automatically
- Total problems completed (grading + practice)
- Accuracy average (correct / total from grading sessions)
- Topics practiced (unique topics from practice sessions)

### Success Criteria
- Report reflects actual student activity from past 7 days
- Highlights concrete achievements
- Suggestions are actionable
- Parent only needs to select child and click generate

### Failure States
- "You haven't added any children yet" -> links to `/parent/children`
- "Something went wrong" -> API or Claude error
- Zero activity week -> still generates report with 0 stats

---

## CUJ 9: Parent Donation Flow

**Persona:** Parent, considering supporting the nonprofit
**Path:** `/parent/donate`
**Goal:** Learn about program impact and optionally donate

### Steps

| Step | Page | Action | Result |
|------|------|--------|--------|
| 1 | `/parent/donate` | Page loads | Auto-fetches donation message via `POST /api/donation` |
| 2 | `/parent/donate` | Reads impact message | AI-generated message about student impact (under 120 words) |
| 3 | `/parent/donate` | Clicks $5, $10, or $25 button | `POST /api/donation` with `{type: "thank_you", amount, frequency: "one-time"}` |
| 4 | `/parent/donate` | Thank-you message displayed | Personalized message showing estimated students helped |

### Guardrails
- Donation content is **parent-facing only** (never shown to students)
- Messages are gentle and never pressuring
- Cost transparency: "$0.50 per student per month" shown
- Student portal content sanitized to remove any donation language

### Success Criteria
- Impact message loads on page visit
- Thank-you message appears after amount selection
- Non-pressuring tone maintained throughout

### Failure States
- "Failed to load. Please try again." -> initial message load error
- "Something went wrong. Please try again." -> thank-you generation error

---

## CUJ 10: Authentication Middleware (Background)

**Persona:** System-level, applies to all users
**Path:** All routes except `/`, `/auth/login`, `/auth/signup`, `/auth/callback`
**Goal:** Protect authenticated routes and maintain sessions

### Behavior

| Condition | Action |
|-----------|--------|
| User is authenticated | Request proceeds, session refreshed |
| User is NOT authenticated + public path | Request proceeds |
| User is NOT authenticated + protected path | Redirect to `/auth/login` |
| Supabase not configured | Middleware skipped (allows build without credentials) |

### Public Paths
- `/` (landing page)
- `/auth/login`
- `/auth/signup`
- `/auth/callback`

---

## CUJ 11: Student Content Safety (Background)

**Persona:** System-level, applies to all student-facing AI responses
**Path:** `/api/grade`, `/api/practice`
**Goal:** Ensure students never see donation, payment, or cost messaging

### Blocked Patterns
| Pattern | Matches |
|---------|---------|
| `/donat/i` | donate, donation, donations |
| `/contribut/i` | contribute, contribution |
| `/payment/i` | payment, payments |
| `/paypal/i` | paypal |
| `/\$\d+/` | $5, $10, $25, etc. |
| `/cost per/i` | cost per student |
| `/fund/i` | fund, funding |
| `/sponsor/i` | sponsor, sponsored |
| `/tax.deducti/i` | tax deductible, tax deduction |

### Behavior
- Splits text into sentences
- Removes any sentence matching a blocked pattern
- Remaining sentences rejoined
- Applied to: `explanation`, `hint`, `encouragement`, `problem` text

---

## Database Entity Relationships

```
profiles (auth users)
  |
  |-- role = "parent"
  |     |
  |     +-- students (one parent -> many children)
  |           |
  |           +-- grading_sessions (one student -> many sessions)
  |           |     |
  |           |     +-- grading_results (one session -> many results)
  |           |
  |           +-- practice_sessions (one student -> many sessions)
  |
  |-- role = "student"
        |
        +-- students.user_id (links to one student record)
```

---

## Journey Metrics Summary

| CUJ | Steps to Complete | API Calls | DB Writes |
|-----|-------------------|-----------|-----------|
| Parent Onboarding | 5 | 2 (auth + insert) | 2 (profile + student) |
| Student Onboarding | 4 | 2 (auth + update) | 1 (profile) + 1 (update student) |
| Login | 2 | 2 (auth + profile read) | 0 |
| Homework Grading | 4 | 1 (Claude) | 1 session + N results |
| Practice Problems | 3 | 1 (Claude) | 1 session |
| Weekly Report | 3 | 1 (Claude) + 2 reads | 0 |
| Donation Flow | 2 | 2 (Claude) | 0 |

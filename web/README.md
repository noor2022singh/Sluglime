# Sluglime Web (Next.js 14)

## Setup

1. Copy `.env.example` to `.env.local`.
2. Install deps: `npm install`
3. Start dev server: `npm run dev`

## Implemented Features

- JWT auth with student/teacher registration and college selection.
- College-specific communities (`/community/[collegeId]`).
- Post creation with text, multi-file uploads (images/PDFs) via Cloudinary.
- Public feed (`/public`) for public posts.
- Permission guard to ensure users create posts only in their own college.
- Like/unlike posts and threaded comments with unlimited nesting.
- Pagination in feeds.
- Next.js middleware route protection.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET,POST /api/posts`
- `GET /api/posts/[postId]`
- `PATCH /api/posts/[postId]/like`
- `GET,POST /api/comments`
- `GET /api/colleges`

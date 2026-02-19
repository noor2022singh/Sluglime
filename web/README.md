# Sluglime Web (Next.js 14)

A full-stack college community platform built with Next.js 14 App Router, MongoDB Atlas + Mongoose, JWT auth, Tailwind CSS, and Cloudinary uploads.

## 1) What is already implemented

- JWT auth (register/login/logout) with `Student`/`Teacher` role selection and mandatory college selection.
- College communities (`/community/[collegeId]`) with scoped post creation permission.
- Posts with text + multi-file image/PDF support + public visibility flag.
- Global public feed (`/public`), likes/unlikes, and nested threaded comments.
- API routes for auth/posts/comments/colleges.
- Middleware-protected routes for authenticated pages.
- Pagination in feed APIs/pages and loading UIs.

## 2) What is **not configured yet** (required before first run)

You must configure the following:

1. **MongoDB Atlas connection**
   - Create a MongoDB Atlas project and cluster.
   - Add your DB user and IP allowlist.
   - Set `MONGODB_URI` in `.env.local`.

2. **JWT secret**
   - Set a strong random `JWT_SECRET` in `.env.local`.

3. **Cloudinary account**
   - Create a Cloudinary account.
   - Set:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`

4. **College records**
   - Add initial records to `colleges` collection (name + code), otherwise register dropdown will be empty.
   - Quick seed option: `npm run seed:colleges` (after setting `MONGODB_URI`).

## 3) Environment file

Copy and fill:

```bash
cp .env.example .env.local
```

`./.env.example`:

```env
MONGODB_URI=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 4) How to start locally

```bash
npm install
npm run dev
```

Then open: `http://localhost:3000`

## 5) Suggested first-time test flow

1. Insert a few colleges in MongoDB Atlas.
2. Open `/register` and create a student/teacher account.
3. Create a post from `/create-post` (with image/PDF).
4. View your college feed in `/dashboard`.
5. Mark a post public and verify it appears on `/public`.
6. Open `/post/[postId]`, add comments, and reply to create nested threads.
7. Open another college page via `/community/[collegeId]` and verify:
   - you can view/download content,
   - you can comment,
   - you cannot create posts outside your own college.

## 6) API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/colleges`
- `GET,POST /api/posts`
- `GET /api/posts/[postId]`
- `PATCH /api/posts/[postId]/like`
- `GET,POST /api/comments`

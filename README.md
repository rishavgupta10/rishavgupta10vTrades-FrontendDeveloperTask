# WORKHIVE Auth Frontend

A modern Next.js authentication frontend built for user sign-in, sign-up, OTP verification, password reset, and OAuth-based login flows.

## Overview

This project provides a polished authentication experience for a SaaS-style application using:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn-inspired UI components
- Google and Microsoft OAuth support

## Features

- User sign in and sign up forms
- OTP verification and resend flow
- Forgot password flow
- Change password flow
- Responsive auth layout
- Inline validation and form feedback
- OAuth login support for Google and Microsoft
- Demo-friendly fallback behavior when provider credentials are not configured

## Project Structure

- `app/` — application routes and pages
- `components/auth/` — authentication screens and reusable UI
- `components/ui/` — shared design system elements
- `hooks/` — OAuth and auth-related hooks
- `lib/` — API helpers, validation, and auth logic
- `public/` — static assets

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Lucide Icons

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   If you do not have an `.env.example`, create `.env.local` manually with the values below.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the app in your browser:

   ```bash
   http://localhost:3000
   ```

## Environment Variables

Add the following variables to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_microsoft_client_id
NEXT_PUBLIC_MICROSOFT_TENANT_ID=common
```

Notes:
- These are public client IDs, not secrets.
- If they are not configured, the app falls back to a demo OAuth simulation for local development.

## Available Scripts

```bash
pnpm dev
pnpm build
pnpm start
```

## Authentication Flow

The application supports the following user journeys:

- Sign up with email and password
- Email OTP verification
(Note: Get the valid OTP from the network tab in dev tools. This is just for development purposes. In Production you'll receive it via email or SMS.)
- Sign in to the dashboard
- Forgot password request
- Verify OTP for password reset
- Change password
- Google or Microsoft sign-in

## Notes

This project is designed as a frontend authentication demo and includes mock server-side behavior for local development. It is ideal for showcasing UI flow, validation, and authentication UX patterns.

## License

This project is for educational and demo purposes.

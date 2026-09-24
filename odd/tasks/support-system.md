# Feature: Support System with Image Upload and Telegram Notifications (Supabase Edge Function)

## Description
Provide an integrated support area for all authenticated users to submit tickets with text, image attachments (with clipboard paste support), and automated client context. Real-time Telegram notifications are delegated completely to a Supabase Edge Function to protect against shared hosting (Hostinger / Phusion Passenger / LiteSpeed) process terminations.

## Tasks
- [x] Task 1: Create Supabase migration `00021_support_tickets.sql` with table, storage bucket, and RLS policies.
- [x] Task 2: Build Supabase Edge Function `supabase/functions/telegram-support/index.ts` to dispatch Telegram alerts on DB insert.
- [x] Task 3: Offload outbound network calls from Next.js Server Action in `app/actions/support.ts` for Hostinger resilience.
- [x] Task 4: Build client support widget/modal with context capture and screenshot paste support in `components/support/support-widget.tsx`.
- [x] Task 5: Integrate support widget and navigation into `AppShell`, `Header`, and `Sidebar`.
- [x] Task 6: Build superadmin ticket management view in `app/(sa)/support/page.tsx`.
- [x] Task 7: Run unit tests, typecheck, and verify full project compilation.

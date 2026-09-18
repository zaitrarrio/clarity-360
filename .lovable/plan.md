# Signed-in controls on marketing pages

## Goal
Show the existing **My workspace** link and profile menu in marketing-page headers whenever a visitor is signed in.

## Changes
- Reuse one signed-in header control component so the workspace link, account menu, and sign-out behavior stay consistent.
- Add those controls to the main marketing page and branded intro page without changing their signed-out calls to action.
- Verify signed-in and signed-out header states at desktop and mobile widths.

## Technical details
- Keep session state in the shared header module and preserve TanStack links for navigation.
- Retain the existing tenant branding and account menu destinations.

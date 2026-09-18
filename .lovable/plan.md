# Restore completed intake answers

## What will change
- When a signed-in user opens Intake normally, load their most recently created operating plan instead of redirecting them away.
- Reconstruct every intake field and selection from the saved business and intake responses, including business name, stage, industry/domain, audience and footprint choices, website, and objective.
- Keep `Build a new plan` isolated: opening Intake with the new-plan option will continue to show a blank form.
- Show the existing loading state while saved answers are retrieved, then fall back safely to a blank form if no prior plan exists.

## Technical details
- Add an authenticated server function that reads the user's latest business and its ordered intake responses under existing access policies.
- Add a single parser that maps the saved response keys into the current `Seed` shape and validates arrays/selections before displaying them.
- Update the Intake page to call that function on entry and populate its controlled fields, without changing draft/fork generation behavior.
- Verify returning-user, new-plan, desktop, and mobile behavior plus the current build health.

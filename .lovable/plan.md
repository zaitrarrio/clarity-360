# Add workspace sidebar

## Experience
- Add a collapsible left sidebar to the signed-in workspace with links to My Operating Plan, My Content, My Agenda, and My Actions.
- Show the active destination clearly, retain an icon-only rail when collapsed, and provide a visible menu control on mobile.
- Keep public, sign-in, intro, and plan-building screens outside the workspace sidebar.

## Pages
- Reuse the existing operating plan, agenda, and actions pages.
- Add a My Content page that gathers generated content and artifacts already produced by actions, with clear empty and loading states.

## Technical details
- Build a shared workspace shell using the existing sidebar design components and TanStack Router active-path state.
- Apply the shell to the four workspace destinations and remove duplicate top navigation from the workspace header.
- Add unique page metadata for My Content and verify desktop and mobile layouts.

# Tanbo Restaurant Design System v1

## Purpose

This design system defines the visual language for every restaurant project built from this template.

The goal is consistency, premium quality, and commercial presentation.

Reference products:

- Apple
- Linear
- Vercel
- Stripe
- Toast POS
- Square
- Uber Eats
- DoorDash

Never imitate Bootstrap, Material UI, or generic admin templates.

## Design Principles

Every interface should feel:

- Premium
- Calm
- Spacious
- Professional
- Easy to scan
- Fast to use

Avoid unnecessary decoration.

Less but better.

## Typography

Font:

- Inter

Scale:

- Display: `48px`
- Heading 1: `36px`
- Heading 2: `30px`
- Heading 3: `24px`
- Heading 4: `20px`
- Body: `16px`
- Secondary: `14px`
- Caption: `12px`

Font weights:

- Regular
- Medium
- Semibold
- Bold only for emphasis

## Grid

Use an 8px spacing system.

Allowed spacing:

- `8px`
- `16px`
- `24px`
- `32px`
- `40px`
- `48px`
- `64px`
- `80px`

Avoid random values.

## Radius

- Buttons: `16px`
- Inputs: `16px`
- Cards: `24px`
- Images: `20px`
- Badges: `999px`

Keep consistency.

## Shadows

Use soft shadows only.

- No heavy floating cards.
- No exaggerated blur.
- Reference Apple and Linear.

## Borders

- Use `1px` subtle borders.
- Use low-contrast borders.
- Avoid thick outlines.

## Colors

Use CSS variables.

Never hardcode colors inside components.

Core tokens:

- Primary
- Secondary
- Surface
- Background
- Success
- Warning
- Danger
- Text
- Muted

Theme switching should only require editing theme variables.

## Buttons

Primary:

- Filled
- Rounded
- `48px` height
- Medium weight

Secondary:

- Outline or subtle surface

Ghost:

- Minimal

Interaction:

- Hover: small lift
- Active: scale `0.98`
- Transition: `200ms`

## Inputs

- Height: `48px`
- Rounded: `16px`
- Clear focus ring
- No browser default styling

## Cards

- Large image
- Comfortable whitespace
- Clear hierarchy
- Soft shadow
- `24px` radius
- No dashboard-template appearance

## Food Cards

Priority:

1. Image
2. Title
3. Price
4. Button
5. Description

Rules:

- Image ratio: `4:3`
- Image occupies roughly `60%` of the card
- Maximum description: 2 lines
- Price and Add button stay on one row

## Hero Sections

- Large typography
- Strong visual hierarchy
- One primary CTA
- One secondary CTA
- Large restaurant imagery
- Avoid oversized gradients

## Category Pills

- Height: `44px`
- Rounded
- Scrollable
- Sticky
- Active state clearly visible

## Cart

Desktop:

- Sticky panel

Mobile:

- Floating bottom summary

Checkout button:

- Large
- `48px`
- Full width

## Kitchen Dashboard

- Large table number
- Large order status
- Easy scanning
- Minimal decoration
- Operational clarity first

## Admin Dashboard

Reference:

- Linear
- Stripe
- Vercel

Rules:

- High information density
- Large whitespace
- Consistent cards
- Charts should not dominate the page

## Motion

Allowed:

- Fade
- Slide
- Scale
- Hover

Duration:

- `200ms-250ms`

Avoid decorative animation.

## Icons

- Lucide only
- Use consistent sizing:
  - `16px`
  - `18px`
  - `20px`
  - `24px`
- Do not mix icon styles

## Images

- Professional photography only
- No blurry assets
- No low-resolution images
- Prefer dark premium food photography

## Responsive

- Mobile first
- No horizontal scrolling
- Touch targets: minimum `44px`
- Desktop should breathe

## Accessibility

- Visible focus states
- Keyboard navigation
- Readable contrast
- Large touch areas
- ARIA where appropriate

## Never Do

Do not use:

- Bootstrap styling
- Material UI styling
- Glassmorphism overload
- Heavy gradients
- Random colors
- Random spacing
- Template dashboards
- Oversized shadows
- Inconsistent radius

## Every Pull Request

Before merging, verify:

- Typography
- Spacing
- Radius
- Buttons
- Cards
- Animation
- Responsive
- Accessibility
- Consistency

Every screen should feel like it belongs to the same product.

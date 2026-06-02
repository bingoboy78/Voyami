You are a senior full-stack product engineer and product designer.

I have a high-fidelity HTML prototype for a responsive travel planning web app called “Albania Travel Hub”. Your task is to convert this visual prototype into a real production-ready full-stack application while preserving the visual design, spacing, layout, responsive behavior, and product UX as closely as possible.

The design reference is located at:

`design-reference/travel-hub-final.html`

Treat this HTML file as the visual source of truth.

## Product context

This is a shared travel guide / trip hub for a group trip.

Trip example:
- Country: Albania
- Route: Tirana → Berat
- Duration: 4 days
- Group: 3 couples, 6 people
- Main scenario: usage during the trip
- Language: Russian
- Default theme: light
- Optional theme: dark

The product goal is to give the group one synchronized source of truth for:
- daily itinerary
- map/place planning
- restaurants and practical information
- documents / vouchers / tickets
- shared chat and notes
- budget tracking
- participants and roles
- AI-assisted route and place recommendations
- offline access

## Important design requirement

Do not redesign the product from scratch.

Extract and preserve the visual system from the prototype:
- CSS variables
- light/dark theme colors
- modern minimal look
- neutral surfaces
- blue primary accent
- rounded cards
- sidebar desktop navigation
- mobile bottom navigation
- dashboard-first entry point
- itinerary as the main product surface
- document vault as a real travel file collection
- dense but readable product UI

The final app should feel like the prototype, not like a generic SaaS dashboard.

## Tech stack

Use:

- Next.js App Router
- TypeScript
- React Server Components where appropriate
- Prisma ORM
- PostgreSQL
- CSS variables + component CSS or Tailwind using the extracted tokens
- Auth.js / NextAuth or Supabase Auth
- File upload storage abstraction
- PWA support for offline mode
- API route for AI features

If a dependency choice is ambiguous, make a practical default and document it.

## Main app screens

Implement these 8 main screens as real routes or route segments:

1. Dashboard
   - trip status overview
   - next event
   - important documents
   - fresh updates
   - quick actions

2. Itinerary
   - days list
   - timeline per day
   - activities with time, category, title, description, tags
   - owner can edit
   - participants can comment/suggest

3. Map
   - list of saved places and stops
   - route overview
   - practical logistics
   - map provider can initially be placeholder/mock if API key is absent

4. Places / Restaurants
   - filterable places
   - categories: restaurant, coffee, spot, practical
   - save to itinerary
   - comments or notes

5. Chat and Notes
   - group chat
   - trip updates
   - notes
   - participants can comment
   - owner can pin or convert notes into official trip info

6. Budget
   - total budget
   - expenses
   - per-person split
   - payer
   - category
   - participants involved
   - balance calculations

7. Documents
   - travel vault
   - all participants can view
   - only owner can upload/edit/delete
   - file types: PDF, PNG, JPG, screenshots
   - categories: tickets, hotels, transport, insurance, other
   - offline availability flag
   - preview panel
   - download/share actions

8. Participants and AI
   - participants
   - owner/member roles
   - permissions
   - AI assistant panel
   - AI actions:
     - generate route
     - recommend restaurants
     - suggest practical tips
     - summarize chat
     - answer trip questions

## Permissions model

Roles:
- OWNER
- MEMBER

Owner can:
- edit trip
- edit itinerary
- upload/edit/delete documents
- manage participants
- pin updates
- accept suggestions

Member can:
- view all trip info
- view all documents
- comment
- suggest changes
- add notes/proposals
- add expenses if allowed

## Data model

Create a Prisma schema for at least:

- User
- Trip
- TripParticipant
- Day
- Activity
- Place
- Document
- ChatMessage
- Note
- Expense
- ExpenseParticipant
- Suggestion
- AIRequestLog

Include timestamps and ownership fields.

Documents should include:
- id
- tripId
- uploadedById
- title
- fileName
- fileType
- fileUrl
- category
- size
- isOfflineAvailable
- isPinned
- relatedDayId optional
- createdAt
- updatedAt

Expenses should support:
- amount
- currency
- paidBy
- participants involved
- category
- description
- date

## Backend/API requirements

Create backend routes or server actions for:

Trips:
- get trip
- update trip
- invite participant

Itinerary:
- create/update/delete activity
- reorder activities
- get days

Places:
- create/update/delete place
- filter places by category
- save place to itinerary

Documents:
- upload file
- list documents
- filter documents
- update metadata
- delete document
- get preview/download URL

Chat/Notes:
- send message
- list messages
- create note
- pin note
- convert suggestion to itinerary item

Budget:
- create expense
- update expense
- delete expense
- calculate balances

AI:
- POST `/api/ai`
- accepts action type and trip context
- returns route suggestions, restaurants, tips, or chat summary
- do not expose API keys on the client

## Offline mode

Implement a practical offline strategy:

- PWA manifest
- service worker if appropriate
- cache shell assets
- cache current trip data locally
- documents can be marked offline-ready
- show offline status in UI
- if full offline sync is too complex, implement a first production-ready foundation and document next steps

Use localStorage/IndexedDB where appropriate for cached trip data.

## Frontend implementation requirements

Convert prototype into components:

- AppShell
- SidebarNav
- MobileNav
- Topbar
- DashboardCards
- ItineraryTimeline
- MapPanel
- PlacesGrid
- ChatPanel
- BudgetSummary
- DocumentsVault
- DocumentPreview
- ParticipantsGrid
- AIAssistantPanel

Preserve responsive behavior:
- desktop: sidebar navigation
- tablet/mobile: bottom navigation
- mobile should not be a squeezed desktop layout
- dashboard and documents must work well on mobile

## UX details to preserve

- Dashboard is the first screen
- Itinerary is the main planning surface
- Documents screen behaves like a travel vault, not a generic file manager
- Important documents are optimized for fast access from a phone
- Offline mode is visible
- Theme toggle exists
- Owner/member distinction is visible
- Participants can comment/suggest, owner can edit
- Russian UI copy

## Seed data

Create seed data matching the prototype:

Trip:
- Albania
- Tirana → Berat
- 4 days
- 6 participants

Participants:
- Alina / owner
- Maxim
- Sveta
- Ivan
- Nadya
- Roman

Include sample:
- itinerary days
- restaurants
- documents
- expenses
- chat messages
- notes

## Implementation process

Please work in phases:

1. Inspect the design reference and extract tokens/components.
2. Set up project structure.
3. Add Prisma schema and seed data.
4. Build backend routes/server actions.
5. Convert the visual prototype into React components.
6. Connect components to real data.
7. Add document upload flow.
8. Add chat/notes interactions.
9. Add budget calculations.
10. Add AI route stub with clean integration point.
11. Add offline/PWA foundation.
12. Run typecheck, lint, and build.
13. Document how to run locally and what environment variables are required.

## Acceptance criteria

The finished app must:

- visually match the prototype closely
- have all 8 screens implemented
- be responsive desktop/mobile
- have real persisted data via database
- have seeded Travel trip data
- support document upload metadata flow
- support owner/member permissions at UI and backend level
- support chat/notes
- support expenses and balance calculation
- include AI backend route placeholder or real integration point
- include offline/PWA foundation
- build successfully
- include README with setup instructions

Do not replace the design with a generic template.
Do not remove the product-specific travel modules.
Do not use lorem ipsum.
Do not invent unrelated features.


Рекомендованный стек
Я бы делал так:

Frontend: Next.js + TypeScript
Styling: CSS variables + Tailwind или CSS Modules
Backend: Next.js API Routes / Server Actions
Database: PostgreSQL
ORM: Prisma
Auth: NextAuth/Auth.js или Supabase Auth
Files: S3-compatible storage или Supabase Storage
Offline: PWA + local cache
AI: отдельный backend route /api/ai

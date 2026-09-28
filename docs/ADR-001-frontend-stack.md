# Architecture Decision Record (ADR-001): Frontend Stack Selection
## Project: ShopStream Advisor — Merchandising Operations Console

- **Status:** Accepted
- **Date:** 2026-09-28
- **Author:** Merchandising Engineering Lead

---

### Context
ShopStream Advisor requires a high-performance, data-dense, real-time merchandising operations console. The UI must present complex inventory signals, trigger reasons, confidence scores, and AI reasoning alongside interactive charts and confirmation dialogs for operational checkpoints. We evaluated technology stacks suitable for an autonomous commerce advisor.

---

### Decision

We selected **React 18 + Vite + TypeScript + Tailwind CSS** as the foundational frontend stack, complemented by:
1. **React Router v6:** Declarative nested routing for multi-page dashboard layouts (`/dashboard`, `/products`, `/inventory`, `/suggestions`, `/analytics`, `/activity`, `/settings`).
2. **TanStack Query (React Query v5):** Declarative server-state synchronization with 4-second auto-polling for autonomous agentic loop updates, cache invalidation on approvals, and background refetching.
3. **Axios:** Centralized API client layer with unified error interceptors and timeout guards.
4. **Tailwind CSS:** Utility-first styling with modern light-theme SaaS tokens, soft shadows, and responsive grid layouts.
5. **Recharts:** Composable SVG chart rendering for inventory health area charts, demand velocity lines with spike threshold reference markers, and trigger distribution donut charts.
6. **React Hook Form + Zod:** Strongly-typed, zero-re-render form validation for merchandising guardrails and threshold settings.
7. **Lucide React:** Consistent iconography for operational states.

---

### Evaluation: React 18 vs. Angular 17

| Criteria | React 18 + Vite | Angular 17 | Justification |
|---|---|---|---|
| **Build & HMR Speed** | Sub-50ms via Vite ES modules | ~1–3s via Webpack/esbuild CLI | Rapid hackathon iteration and hot reloading. |
| **Server State Sync** | TanStack Query (`useQuery`, `useMutation`) | RxJS + Services + NgRx | TanStack Query provides instant cache invalidation upon approving recommendations without boilerplate state stores. |
| **Component Density** | Functional components & hooks | Modules, decorators, templates | High density of co-located drawer models and confirmation dialogs with minimal boilerplate. |
| **Visual Customization** | Tailwind CSS + headless primitives | Angular Material / CSS | Easy adoption of modern light-theme SaaS aesthetics without fighting rigid component themes. |

---

### Tradeoffs

- **Pros:**
  - High developer velocity and instant feedback loops.
  - Granular control over animation, drawer states, and confirmation dialogs.
  - Seamless integration with Spring Boot REST API endpoints.
  - Declarative polling guarantees the merchandiser sees auto-triggered recommendations within seconds of threshold events.
- **Cons:**
  - Requires deliberate discipline around centralized API folders (which we enforced via `src/api/`).

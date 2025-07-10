# AI Carousel Generator Agent Guide

## Commands
- **Dev**: `npm run dev` (starts on http://localhost:5173)
- **Build**: `npm run build` (TypeScript compilation + Vite build)
- **Lint**: `npm run lint` (ESLint with TypeScript)
- **Preview**: `npm run preview` (preview production build)

## Architecture
- **Frontend**: React + Vite + TypeScript
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Hook Form + Zod validation
- **AI Integration**: OpenAI GPT-4, Groq LLaMA3, Google Gemini APIs
- **Image Service**: Unsplash API for high-quality images
- **Build Tool**: Vite with hot module replacement

## Code Style
- **Import Paths**: Use `@/` alias for src imports (e.g., `@/components/ui/button`)
- **Components**: PascalCase, functional components with TypeScript
- **Styling**: Tailwind classes with `cn()` utility from `@/lib/utils`
- **Forms**: React Hook Form with Zod schemas for validation
- **Types**: Define in `src/types/` directory
- **Theme**: Support for dark/light mode via theme provider
- **Environment**: Use `VITE_` prefix for environment variables

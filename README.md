# HireFlow

**AI-Powered Voice Interviews, Simplified**

HireFlow is a modern interview platform that uses AI to conduct voice interviews, generate intelligent questions, and provide comprehensive feedback. Built with Next.js, powered by Vapi voice AI and Groq AI.

## Features

- **Voice Interviews** - Natural voice conversations powered by Vapi
- **Smart Question Generation** - HireFlow-generated questions tailored to role, level, and tech stack
- **Intelligent Feedback** - Comprehensive scoring and detailed analysis with Gemini AI
- **Dual Dashboards** - Separate interfaces for recruiters and candidates
- **Firebase Backend** - Secure authentication and real-time data storage
- **Real-time Transcription** - Capture every word of the interview
- **Code Editor** - Type code snippets and detailed answers during interviews
- **Proportional Scoring** - Fair, accurate evaluation based on actual performance

## Getting Started

### Prerequisites

Make sure you have your environment variables set up in `.env.local`:

```env
# Groq AI (Free)
GROQ_API_KEY=your-groq-key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_PRIVATE_KEY=your-key

# Vapi Voice AI
VAPI_API_KEY=your-api-key
NEXT_PUBLIC_VAPI_WEB_TOKEN=your-web-token
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-assistant-id (optional)
```

See [VAPI_QUICK_START.md](./VAPI_QUICK_START.md) for detailed Vapi setup instructions.

### Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

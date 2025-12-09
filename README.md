# PhotoMap: Memory Map

PhotoMap is a modern web application that lets you upload, organize, and visualize your photos on an interactive map using their embedded GPS metadata. It also provides AI-generated image detection, batch metadata editing, and privacy-focused local processing. Built with React, Vite, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Features

- 📍 **Map Your Memories:** Instantly see where your photos were taken on a beautiful interactive map (Mapbox GL).
- 🖼️ **Photo Gallery:** Browse, search, and filter your photo collection.
- 🏷️ **Edit Metadata:** View and edit EXIF metadata, including GPS, camera, and more.
- 🤖 **AI Detection:** Detect AI-generated images using a Supabase Edge Function.
- 🗂️ **Batch Processing:** Edit and download multiple photos at once.
- 🔒 **Privacy Mode:** All processing is local by default; no photos are uploaded to a server.
- 🧭 **GPS Tips:** In-app guidance for preserving and checking GPS data.
- 🌈 **Modern UI:** Responsive, accessible, and themeable interface using shadcn/ui and Tailwind CSS.

## Demo

> [Live Demo Coming Soon]

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/) or [yarn]

### Installation

1. **Clone the repository:**
	 ```bash
	 git clone https://github.com/weroperking/memory-map.git
	 cd memory-map
	 ```
2. **Install dependencies:**
	 ```bash
	 pnpm install # or npm install or yarn install
	 ```
3. **Set up environment variables:**
	 - Copy `.env.example` to `.env.local` and fill in:
		 - `VITE_SUPABASE_URL`
		 - `VITE_SUPABASE_PUBLISHABLE_KEY`
	 - (Get these from your [Supabase](https://supabase.com/) project)

4. **Run the development server:**
	 ```bash
	 pnpm dev # or npm run dev or yarn dev
	 ```
	 The app will be available at [http://localhost:8080](http://localhost:8080)

### Mapbox Setup

- This project uses [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/). You need a Mapbox access token:
	- Get a free token at [mapbox.com](https://account.mapbox.com/)
	- Set it in `src/components/PhotoMap.tsx` or via environment variable if you refactor

### Supabase Edge Functions

- The AI detection feature uses a Supabase Edge Function (`ai-detection`).
- See `supabase/functions/ai-detection/index.ts` for implementation.
- Deploy with:
	```bash
	supabase functions deploy ai-detection
	```

## Project Structure

- `src/` — Main source code
	- `components/` — UI and feature components (PhotoUploader, PhotoGallery, PhotoMap, MetadataEditor, etc.)
	- `contexts/` — React context for photo state
	- `hooks/` — Custom React hooks
	- `integrations/supabase/` — Supabase client and types
	- `lib/` — Utility functions (EXIF, metadata, etc.)
	- `pages/` — Main app pages
- `public/` — Static assets
- `supabase/` — Supabase config and edge functions

## Main Technologies

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [exifr](https://github.com/MikeKovarik/exifr) (EXIF parsing)

## Environment Variables

Create a `.env.local` file in the root:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, features, or documentation improvements.

## FAQ

**Q: Why is GPS data missing from my photos?**
A: Many browsers strip GPS metadata for privacy. See the "GPS Tips" dialog in the app for platform-specific advice.

**Q: Are my photos uploaded anywhere?**
A: No, all processing is local unless you use the AI detection feature (which sends only the image to your own Supabase Edge Function).

**Q: How do I deploy this?**
A: You can deploy with Vercel, Netlify, or any static host. For Lovable users, see the Lovable docs.

## License

MIT License. See [LICENSE](LICENSE) for details.

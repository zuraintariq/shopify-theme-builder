# Shopify Theme Builder

Drag-and-drop theme builder for Shopify stores.

## Features

- 🎨 Visual drag-and-drop editor
- 📦 Basic HTML elements (sections, rows, columns, text, images, buttons)
- 🎯 Real-time CSS styling
- 📱 Responsive viewport preview
- 💾 Export to Liquid + CSS
- 🚀 One-click save to theme

## Setup

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in your Shopify app credentials
3. Install dependencies: `npm install`
4. Run locally: `npm run dev`
5. Open: `http://localhost:3000?shop=yourstore.myshopify.com`

## Environment Variables

```
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
SHOPIFY_SCOPES=write_themes,read_themes
HOST=http://localhost:3000
```

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Update HOST to your Vercel URL
5. Update App URL in Shopify Partners

## Elements

### Layout
- Section, Container, Row, Column

### Content
- Heading, Text, Paragraph, List

### Media
- Image, Video, Icon

### Interactive
- Button, Link, Input

### Utility
- Spacer, Divider

## License

MIT

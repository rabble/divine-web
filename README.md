# Divine Web

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https://github.com/rabble/divine-web.git)

A decentralized short-form video platform built on Nostr protocol. Think TikTok, but censorship-resistant and owned by no one.

## ✨ Features

- **📱 Short-form Videos**: Upload and discover bite-sized looping videos
- **🔗 Decentralized**: Built on Nostr protocol - no central authority
- **👥 Social Features**: Follow creators, like, comment, and repost videos
- **🏷️ Hashtag Discovery**: Explore trending topics and hashtags
- **⚡ Lightning Payments**: Zap creators with Bitcoin Lightning Network
- **📋 Video Lists**: Curate and organize videos into custom lists
- **🌙 Dark/Light Theme**: Customizable interface themes
- **📱 Mobile-First**: Responsive design optimized for all devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, shadcn/ui components
- **Nostr**: Nostrify library for protocol integration
- **State Management**: React Query, Context API
- **Video**: HLS.js for adaptive streaming
- **Payments**: WebLN, Alby SDK for Lightning integration
- **Testing**: Vitest, Testing Library
- **Deployment**: Cloudflare Pages, Nostr Deploy CLI

## 🚀 Quick Start

### Development

```bash
# Install dependencies and start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Building

```bash
# Build for production
npm run build
```

### Testing

```bash
# Run full test suite (type-check, lint, unit tests, build)
npm run test
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── comments/       # Video comments system
│   ├── ui/             # shadcn/ui components
│   └── ...             # Video, profile, and app components
├── pages/              # Route components (*Page.tsx)
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── lib/                # Utility functions
└── types/              # TypeScript type definitions
```

## 🔧 Configuration

### Relay Configuration

The app connects to Nostr relays for data. Default relays are configured in `src/App.tsx`:

- OpenVine (primary)
- Ditto
- Nostr.Band
- Damus
- Primal

### Environment Variables

No environment variables required for basic functionality. Optional:

- Lightning wallet configuration
- Custom relay endpoints
- Debug settings

## 🌐 Deployment

### Cloudflare Pages

```bash
# Deploy to production
npm run deploy:cloudflare

# Deploy preview
npm run deploy:cloudflare:preview
```

### Nostr Deploy CLI

```bash
# Deploy to Nostr-based hosting
npm run deploy
```

## 🧪 Development Guidelines

- **Components**: Use PascalCase, place in appropriate subdirectories
- **Hooks**: Prefix with `use`, colocate tests as `*.test.ts`
- **Styling**: TailwindCSS utilities, avoid inline styles
- **Testing**: Write tests alongside components, use Testing Library
- **Commits**: Use imperative mood ("Add feature" not "Added feature")

## 📄 License

This project is open source. See individual files for specific licensing terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run test` to ensure everything passes
5. Submit a pull request

## 🔗 Links

- [Nostr Protocol](https://nostr.com)
- [Lightning Network](https://lightning.network)
- [Nostrify Library](https://github.com/nostrify/nostrify)

---

Built with ❤️ for the decentralized web
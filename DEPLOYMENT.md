# Divine Web Deployment Guide

## Cloudflare Pages Deployment

### Prerequisites
- Cloudflare account
- Wrangler CLI installed (`npm install -D wrangler`)

### Deployment URLs
- **Production**: https://divine-web.pages.dev
- **Preview deployments**: https://[deployment-id].divine-web.pages.dev

### Manual Deployment

1. Build the production version:
```bash
npm run build
```

2. Deploy to production:
```bash
CLOUDFLARE_ACCOUNT_ID=ea14882f4b5d0270ffc376ca39229a84 npm run deploy:cloudflare
```

3. Deploy to preview branch:
```bash
CLOUDFLARE_ACCOUNT_ID=ea14882f4b5d0270ffc376ca39229a84 npm run deploy:cloudflare:preview
```

### Automatic Deployment (GitHub)

When connected to GitHub, Cloudflare Pages will automatically deploy:
- **Main branch** → Production (divine-web.pages.dev)
- **Pull requests** → Preview deployments

### Configuration

The deployment is configured in `wrangler.toml`:
- Build output directory: `dist`
- Build command: `npm run build`
- Redirects: Configured in `public/_redirects` for SPA routing

### Environment Variables

Environment variables can be set in the Cloudflare dashboard:
1. Go to Pages project settings
2. Navigate to Environment variables
3. Add variables for production/preview environments

### Custom Domain

To add a custom domain:
1. Go to the Cloudflare Pages dashboard
2. Select the divine-web project
3. Go to Custom domains
4. Add your domain and follow DNS configuration steps

### Troubleshooting

- **Build failures**: Check that all dependencies are installed and the build runs locally
- **Routing issues**: Ensure `_redirects` file is in the `public` folder
- **404 on refresh**: The `_redirects` file should contain `/* /index.html 200`

### Dashboard

View and manage deployments at:
https://dash.cloudflare.com/ea14882f4b5d0270ffc376ca39229a84/pages/view/divine-web
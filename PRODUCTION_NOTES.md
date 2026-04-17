# Production hardening notes

This package adds:
- robots.txt
- sitemap.xml
- site.webmanifest
- 404.html redirect fallback
- .nojekyll
- canonical, robots, color-scheme, referrer meta
- skip link and improved focus visibility
- reduced motion support
- sticky top bar
- screen-reader page announcements
- escape-to-close sidebar support

Recommended post-deploy checks:
1. Verify GitHub Pages publishes from root.
2. Open all top-level routes.
3. Test on mobile width.
4. Add GA4 ID if desired.

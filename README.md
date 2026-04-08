# Ivanti Neurons Interview Hub

A static GitHub Pages project for enterprise interview preparation across the broader Ivanti ecosystem.

## What this project is
Ivanti Neurons Interview Hub is designed as a structured, searchable and scenario-driven preparation platform for candidates working with Ivanti technologies. Instead of relying on scattered notes, the hub organizes interview preparation by role, module, topic, coding pattern, real-world use case and quiz mode.

This project is built to support preparation across the broader Ivanti landscape, including:

- Ivanti Neurons Platform
- Ivanti Neurons for ITSM
- Ivanti Neurons for MDM
- Ivanti Neurons for UEM
- Ivanti Endpoint Manager
- Ivanti Velocity
- Ivanti automation, integrations and security-oriented workflows

## Included
- role-based preparation paths
- module and product-family navigation
- topic-wise revision coverage
- scripting and integration patterns
- practical use case scenarios
- quiz mode
- bookmarks using browser local storage
- Buy me a coffee CTA
- Google Analytics placeholder for post-deployment setup
- responsive GitHub Pages-ready UI

## Deploy to GitHub Pages
1. Download and unzip this package.
2. Open your GitHub repository.
3. Upload the contents of this folder to the repository root so `index.html` sits at the top level.
4. Commit the upload to your main branch.
5. In GitHub, open **Settings → Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**.
7. Select your branch and choose **/(root)**.
8. Click **Save** and wait for GitHub Pages to publish the site.

## Google Analytics
In `index.html`, replace the value of:

```html
window.IVANTI_GA_ID = "";
```

with your GA4 measurement ID after the site is deployed.

## Support CTA
The project already includes the Cash App support block. Update the payment URL in `index.html` if you ever want to change it.

## Notes
- Bookmarks are stored in the browser using local storage.
- The project uses hash-based routing, so it works cleanly on GitHub Pages.
- All interview content is stored in JSON files inside the `data/` folder for easy editing and expansion.

# Ivanti Neurons Interview Hub

A static GitHub Pages project for Ivanti interview preparation.

## Included
- linked role-based preparation paths
- module detail pages
- topic detail pages with related interview questions
- coding and technical discussion areas
- use case detail pages
- quiz mode
- bookmarks
- light mode by default with dark mode toggle
- social preview image metadata
- Google Analytics placeholder
- buy me a coffee support section

## Main navigation
- Home
- Roles
- Modules
- Topics
- Coding
- Use Cases
- Quiz
- Bookmarks

## Data model
This project links content by role and module so users can move through preparation in a structured way:
- role -> modules
- role -> topics
- role -> coding areas
- role -> use cases
- role -> likely interview questions
- module -> topics
- topic -> related questions

## GitHub Pages deployment
Upload the contents of this project to the root of your repository so `index.html` is at the top level, then publish from:
- Branch: `main`
- Folder: `/(root)`

## Google Analytics
Set this in `index.html` after deployment:
`window.IVANTI_GA_ID = "YOUR_GA4_MEASUREMENT_ID";`

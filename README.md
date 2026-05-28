# Epic Node Portfolio

A GitHub-profile-style personal portfolio that showcases live GitHub repository data and curated LinkedIn career information.

Live site (after deploy): `https://emmanuelm0147.github.io/Epic-Node/`

## Pages

- **Overview** (`index.html`) — intro, social links, featured certifications and projects
- **Certifications** (`certifications.html`) — full certification list from LinkedIn data
- **Projects** (`projects.html`) — filterable repository list with Type, Language, and Sort controls
- **Hire Me** (`hire.html`) — services overview and contact links
- **CV** (`experience.html`) — experience, education, certifications, and skills

## Local development

Serve the folder with any static file server:

```bash
npx serve .
```

Then open `http://localhost:3000`. For GitHub Pages path testing:

```bash
npx serve . -l 3000
```

Visit `http://localhost:3000/Epic-Node/` if you mirror the production base path locally.

## Sync GitHub data

Refresh cached GitHub profile and repository JSON:

```bash
node scripts/sync-github.mjs
```

Optional environment variables:

- `GITHUB_USERNAME` (default: `EmmanuelM0147`)
- `GITHUB_TOKEN` or `GH_TOKEN` — increases API rate limits

Output files:

- `data/github-profile.json`
- `data/github-repos.json`
- `data/github-contributions.json`

A GitHub Action (`.github/workflows/sync-github.yml`) runs this daily and on pushes to `main`.

## Update LinkedIn data

LinkedIn does not provide a public profile API. Edit [`data/linkedin.json`](data/linkedin.json) when your experience, education, certifications, or skills change:

```json
{
  "profileUrl": "https://www.linkedin.com/in/okeowoemmanuelm/",
  "headline": "...",
  "experience": [{ "title", "company", "dates", "description" }],
  "education": [{ "school", "degree", "dates" }],
  "certifications": [{ "name", "issuer", "date", "url" }],
  "skills": ["Node.js", "Python"]
}
```

## Deploy to GitHub Pages

1. Create a repository named `Epic-Node` under `EmmanuelM0147`
2. Push this project to the `main` branch
3. In repo **Settings → Pages**, set **Source** to **GitHub Actions**
4. The deploy workflow publishes the site to `https://emmanuelm0147.github.io/Epic-Node/`

The base path `/Epic-Node` is configured in [`config.json`](config.json) and handled by [`assets/js/shared.js`](assets/js/shared.js).

## Project structure

```
Epic Node/
├── index.html
├── certifications.html
├── projects.html
├── hire.html
├── experience.html
├── config.json
├── data/
│   ├── github-profile.json
│   ├── github-repos.json
│   └── linkedin.json
├── assets/
│   ├── css/github-theme.css
│   └── js/
├── scripts/sync-github.mjs
└── .github/workflows/
```

## Notes

- The projects page loads cached JSON first, then can refresh live from the GitHub API via the **Refresh from GitHub** button.
- The profile README repo (`EmmanuelM0147/EmmanuelM0147`) is excluded from the project list.
- Verify and update LinkedIn entries in `data/linkedin.json` to match your current profile.

# Contributing to FileFork

Thanks for your interest! FileFork is a small project and contributions of any size are welcome — bug reports, typo fixes, new format support, UI polish.

## Before you start

Please open an issue first for anything bigger than a bug fix or minor tweak. It saves you from building something that doesn't fit the project's direction.

**One rule that's non-negotiable**: FileFork processes files in the browser. No uploads, no accounts, no telemetry. PRs that break this promise won't be merged.

## Ways to contribute

- **Report a bug** — [open an issue](https://github.com/reserban/filefork/issues/new). Include the file type, browser, and what you expected vs. what happened.
- **Suggest a feature** — open an issue describing the use case.
- **Fix something** — grab an open issue or send a PR directly for small fixes.

## Local setup

```bash
git clone https://github.com/reserban/filefork.git
cd filefork
npm install
npm run dev
```

Open http://localhost:3000. Requires Node 20+.

## Making changes

1. Create a branch: `git checkout -b fix/short-description`
2. Make your changes.
3. Run the checks:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```
4. Commit and push. Open a PR against `main`.

## Pull request tips

- Keep PRs focused — one change per PR is easier to review.
- Describe what you changed and why. Screenshots help for UI changes.
- If your PR fixes an issue, mention it in the description (e.g. `Fixes #12`).

## Questions?

If anything is unclear, open an issue and ask. There are no stupid questions.

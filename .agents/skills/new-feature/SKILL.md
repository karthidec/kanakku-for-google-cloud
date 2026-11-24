---
name: new-feature
description: Plan, implement, test, and document a new feature for Kanakku for Google Cloud. Use when adding new functionality or triggered via /new-feature.
---

# /new-feature

1. Read AGENTS.md and every file in .agents/rules.
2. Restate the feature in 2 to 3 sentences and list what is out of scope.
3. If it uses any Google API, billing export field, or console URL pattern, look it up in official docs first and summarize what you found.
4. Write an implementation plan: files to add or change, data shapes, permissions needed (should be none new), tests to write, docs to update.
5. Stop and wait for my approval.
6. Write tests first, then the code.
7. Run build, lint, and tests. Fix until all pass.
8. Update docs and CHANGELOG.md.
9. Write a short walkthrough: what changed, how I can try it in Chrome, and any limitation found.

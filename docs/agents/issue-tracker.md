# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `NickSuomi/spritefoundry`. Use the `gh` CLI for issue operations.

## Conventions

- **Create an issue**: `gh issue create --repo NickSuomi/spritefoundry --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --repo NickSuomi/spritefoundry --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --repo NickSuomi/spritefoundry --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo NickSuomi/spritefoundry --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo NickSuomi/spritefoundry --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo NickSuomi/spritefoundry --comment "..."`

After the remote exists, `gh` may infer the repo from `git remote -v`; keep explicit `--repo NickSuomi/spritefoundry` when ambiguity exists.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `NickSuomi/spritefoundry`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo NickSuomi/spritefoundry --comments`.

# ELI5 output style for Claude Code

ELI5 asks Claude to use simple words and short sentences, default to Traditional Chinese, and end each response with what it did, whether it worked, and the next step. Code, comments, and commit messages remain in English. It also asks Claude to explain meaningful risks and report unverified results honestly.

## Install

Copy `eli5.md` to `~/.claude/output-styles/eli5.md`. Check and back up any existing file at that path before replacing it:

```sh
mkdir -p ~/.claude/output-styles
cp claude-code/output-styles/eli5/eli5.md ~/.claude/output-styles/eli5.md
```

Start or restart Claude Code, then select ELI5 with `/output-style` (or `/config` → Output style). In the desktop app, set `"outputStyle": "ELI5"` in the appropriate Claude Code settings file. See the [Claude Code output styles documentation](https://code.claude.com/docs/en/output-styles) for settings and scope.

This style defaults to Traditional Chinese unless the user writes in another language. It follows the original configuration and does not set `keep-coding-instructions`; see the official documentation for how that affects Claude Code's built-in software engineering instructions.

## Version

See [VERSION](VERSION) and [CHANGELOG.md](CHANGELOG.md).

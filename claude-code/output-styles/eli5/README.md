# ELI5 output style for Claude Code

Makes Claude explain things simply.

## What it does

- Uses simple words and short sentences.
- Answers in Traditional Chinese, unless you write in another language.
- Keeps code, code comments and commit messages in English.
- Ends every answer with three parts: what it did, whether it worked, and your next step.
- Still warns you about real risks, and never claims success it did not check.

## Install

1. If `~/.claude/output-styles/eli5.md` already exists, check it and back it up.
2. Copy the file:

   ```sh
   mkdir -p ~/.claude/output-styles
   cp claude-code/output-styles/eli5/eli5.md ~/.claude/output-styles/eli5.md
   ```

3. Start or restart Claude Code.
4. Pick ELI5:
   - Terminal: run `/output-style`, or `/config` → Output style.
   - Desktop app: set `"outputStyle": "ELI5"` in your Claude Code settings file.

## Notes

- It does not set `keep-coding-instructions`. See the [output styles docs](https://code.claude.com/docs/en/output-styles) for what that changes.
- Version: [VERSION](VERSION). Release notes: [CHANGELOG.md](CHANGELOG.md).

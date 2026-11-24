#!/bin/bash
# Preserve the existing status line while sharing usage, session and workspace details.
input=$(cat)
app_home=${HERDR_APP_HOME:-"$HOME/.config/herdr-app"}
umask 077
if mkdir -p "$app_home/data"; then
  dir=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // empty' 2>/dev/null)
  branch=""
  [ -n "$dir" ] && branch=$(git -C "$dir" branch --show-current 2>/dev/null)
  tmp=$(mktemp "$app_home/data/.claude-usage.XXXXXX")
  if [ -n "$tmp" ]; then
    if printf '%s' "$input" | jq -c --argjson updated "$(date +%s)" --arg branch "$branch" '{updated: $updated, context: .context_window.used_percentage, five_hour: .rate_limits.five_hour.used_percentage, five_hour_reset: .rate_limits.five_hour.resets_at, seven_day: .rate_limits.seven_day.used_percentage, seven_day_reset: .rate_limits.seven_day.resets_at, output_style: .output_style.name, model: .model.display_name, effort: .effort.level, fast: .fast_mode, repo: (if .workspace.repo.name then ([.workspace.repo.owner, .workspace.repo.name] | map(select(. != null)) | join("/")) else null end), worktree: (.worktree.name // .workspace.git_worktree), branch: (.worktree.branch // (if $branch == "" then null else $branch end)), cwd: ((.workspace.current_dir // .cwd) as $d | if ($d | type) == "string" and (env.HOME | length) > 0 and ($d | startswith(env.HOME)) then "~" + $d[(env.HOME | length):] else $d end)}' > "$tmp"; then
      # One copy per Herdr terminal, so the panel can follow the focused session.
      if [[ "${HC_TERMINAL_ID:-}" =~ ^[A-Za-z0-9_-]+$ ]] && mkdir -p "$app_home/data/claude-sessions"; then
        copy=$(mktemp "$app_home/data/claude-sessions/.session.XXXXXX") &&
          cp "$tmp" "$copy" && mv -f "$copy" "$app_home/data/claude-sessions/$HC_TERMINAL_ID.json" || rm -f "$copy"
      fi
      mv -f "$tmp" "$app_home/data/claude-usage.json"
    else
      rm -f "$tmp"
    fi
  fi
fi
printf '%s' "$input" | "$@"

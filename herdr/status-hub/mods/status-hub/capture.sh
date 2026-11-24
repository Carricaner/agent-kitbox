#!/bin/bash
# Preserve the existing status line while sharing usage and reset times.
input=$(cat)
app_home=${HERDR_APP_HOME:-"$HOME/.config/herdr-app"}
umask 077
if mkdir -p "$app_home/data"; then
  tmp=$(mktemp "$app_home/data/.claude-usage.XXXXXX")
  if [ -n "$tmp" ]; then
    if printf '%s' "$input" | jq -c --argjson updated "$(date +%s)" '{updated: $updated, context: .context_window.used_percentage, five_hour: .rate_limits.five_hour.used_percentage, five_hour_reset: .rate_limits.five_hour.resets_at, seven_day: .rate_limits.seven_day.used_percentage, seven_day_reset: .rate_limits.seven_day.resets_at, output_style: .output_style.name}' > "$tmp"; then
      mv -f "$tmp" "$app_home/data/claude-usage.json"
    else
      rm -f "$tmp"
    fi
  fi
fi
printf '%s' "$input" | "$@"

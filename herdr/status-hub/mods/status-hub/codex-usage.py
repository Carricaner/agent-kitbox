#!/usr/bin/env python3
import glob
import json
import os
from datetime import datetime
from pathlib import Path


def read_usage(root):
    files = glob.glob(str(Path(root) / "sessions" / "**" / "*.jsonl"), recursive=True)
    files.sort(key=lambda path: os.stat(path).st_mtime, reverse=True)
    # shortcut: inspect the 10 most recently modified sessions, expand if active sessions exceed 10
    latest = None
    for path in files[:10]:
        try:
            with open(path, "rb") as file:
                lines = file.readlines()
            for line in reversed(lines):
                try:
                    event = json.loads(line)
                    payload = event.get("payload", {})
                    if payload.get("type") != "token_count" or not payload.get("info"):
                        continue
                    timestamp = datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00")).timestamp()
                    if latest is None or timestamp > latest[0]:
                        latest = (timestamp, payload)
                    break
                except (ValueError, TypeError, KeyError):
                    continue
        except OSError:
            continue
    if latest is None:
        return None
    updated, payload = latest
    info = payload["info"]
    usage = info.get("last_token_usage") or {}
    window = info.get("model_context_window")
    limits = payload.get("rate_limits") or {}
    primary, secondary = limits.get("primary") or {}, limits.get("secondary") or {}
    return {"updated": updated,
            "context": usage["total_tokens"] / window * 100 if window and usage.get("total_tokens") is not None else None,
            "five_hour": primary.get("used_percent") if primary.get("window_minutes") == 300 else None,
            "five_hour_reset": primary.get("resets_at") if primary.get("window_minutes") == 300 else None,
            "seven_day": secondary.get("used_percent") if secondary.get("window_minutes") == 10080 else None,
            "seven_day_reset": secondary.get("resets_at") if secondary.get("window_minutes") == 10080 else None}


if __name__ == "__main__":
    print(json.dumps(read_usage(os.environ.get("CODEX_HOME", str(Path.home() / ".codex")))))

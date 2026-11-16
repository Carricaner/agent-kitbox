import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("codex_usage", Path(__file__).parent / "mods/status-hub/codex-usage.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CodexUsageTest(unittest.TestCase):
    def test_usage_and_missing_values(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "sessions/2026/11/16/session.jsonl"
            path.parent.mkdir(parents=True)
            self.assertIsNone(module.read_usage(root))
            event = {"timestamp": "2026-11-16T00:00:00Z", "payload": {"type": "token_count", "info": {"last_token_usage": {"total_tokens": 250}, "model_context_window": 1000}, "rate_limits": {"primary": {"window_minutes": 300, "used_percent": 20, "resets_at": 123}}}}
            path.write_text(json.dumps(event) + "\ninvalid\n")
            usage = module.read_usage(root)
            self.assertEqual(usage["context"], 25)
            self.assertEqual(usage["five_hour"], 20)
            self.assertEqual(usage["five_hour_reset"], 123)
            self.assertIsNone(usage["seven_day"])


if __name__ == "__main__":
    unittest.main()

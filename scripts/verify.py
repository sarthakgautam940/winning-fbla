"""Checks computed answers and runnable code against real execution.

Run `npm run content:check` first (it writes tmp/verify-input.json), then:

    scripts/.venv/Scripts/python scripts/verify.py          (Windows)
    scripts/.venv/bin/python scripts/verify.py              (macOS/Linux)
    ... --unit u3     only report items from unit u3's files

For each question with `verify`, the snippet is executed and its value is
matched against the options. Exactly one option must match, and it must be the
keyed answer. For each runnable lesson block, the code is executed and the
output (Python) or result table (SQL) must match what the lesson shows.
"""

from __future__ import annotations

import contextlib
import io
import json
import math
import re
import sqlite3
import statistics
import sys
from fractions import Fraction
from math import comb, perm
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent / "verify"))
from datasets import DATABASES  # noqa: E402

try:
    import numpy as np
except ImportError:  # pragma: no cover
    np = None
try:
    import pandas as pd
except ImportError:  # pragma: no cover
    pd = None

LETTERS = "ABCD"


def make_db(script: str) -> sqlite3.Connection:
    con = sqlite3.connect(":memory:")
    con.executescript(script)
    return con


def _con(db):
    if isinstance(db, sqlite3.Connection):
        return db
    if db not in DATABASES:
        raise ValueError(f"unknown database {db!r}")
    return make_db(DATABASES[db])


def sql(db, query: str):
    return _con(db).execute(query).fetchall()


def scalar(db, query: str):
    result = sql(db, query)
    if len(result) != 1 or len(result[0]) != 1:
        raise ValueError(f"scalar() expected one value, got {result!r}")
    return result[0][0]


def rows(db, query: str) -> int:
    return len(sql(db, query))


def strip_markup(text: str) -> str:
    t = text.replace("$$", "").replace("`", "").replace("**", "")
    t = re.sub(r"\\text\{([^}]*)\}", r"\1", t)
    t = re.sub(r"\\(,|;|!| )", "", t)
    return re.sub(r"\s+", " ", t).strip().rstrip(".")


def option_number(text: str):
    """Return (value, decimals, is_percent) for an option that is a number."""
    t = strip_markup(text).replace(",", "").replace("$", "")
    m = re.fullmatch(r"\\frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}", t) or re.fullmatch(
        r"(-?\d+(?:\.\d+)?)\s*/\s*(-?\d+(?:\.\d+)?)", t
    )
    if m:
        return float(Fraction(m.group(1)) / Fraction(m.group(2))), 6, False
    m = re.fullmatch(r"(?:about |approximately |≈ ?)?(-?\d+(?:\.(\d+))?)\s*(%|percent)?(?: [a-zA-Z /²³]+)?", t)
    if not m:
        return None
    decimals = len(m.group(2)) if m.group(2) else 0
    return float(m.group(1)), decimals, bool(m.group(3))


def matches(ans, option: str, decimals_shown: int | None = None) -> bool:
    """decimals_shown is the most precise option in the question; a whole-number
    option then cannot absorb an answer such as 14.4 when 14.4 is also offered."""
    if isinstance(ans, bool):
        raise ValueError("verify returned a bool; return the option text or a number instead")
    if isinstance(ans, (list, tuple)):
        ans = ", ".join(str(x) for x in ans)
    if np is not None and isinstance(ans, np.generic):
        ans = ans.item()
    if isinstance(ans, (int, float, Fraction)):
        parsed = option_number(option)
        if parsed is None:
            return False
        value, decimals, is_percent = parsed
        if decimals_shown is not None:
            decimals = max(decimals, decimals_shown)
        tol = 0.5 * 10 ** (-decimals) + 1e-9
        candidates = [float(ans)]
        if is_percent:
            candidates.append(float(ans) * 100)
        return any(abs(c - value) <= tol for c in candidates)
    return strip_markup(str(ans)).lower() == strip_markup(option).lower()


def run_snippet(code: str):
    env = {
        "math": math,
        "statistics": statistics,
        "Fraction": Fraction,
        "comb": comb,
        "perm": perm,
        "np": np,
        "pd": pd,
        "sql": sql,
        "scalar": scalar,
        "rows": rows,
        "make_db": make_db,
    }
    code = code.strip()
    if "\n" not in code and not re.match(r"^\s*ans\s*=", code):
        return eval(code, env)  # noqa: S307 - trusted, repo-authored snippets
    exec(code, env)  # noqa: S102
    if "ans" not in env:
        raise ValueError("verify block must assign ans")
    return env["ans"]


def fmt_cell(v) -> str:
    if v is None:
        return "NULL"
    if isinstance(v, float):
        return f"{v:g}" if abs(v) < 1e15 else str(v)
    return str(v)


def norm_cell(s: str) -> str:
    s = strip_markup(s)
    try:
        f = float(s)
        return f"{f:g}"
    except ValueError:
        return s


def main() -> int:
    only: list[str] = []
    for flag in ("--only", "--unit"):
        if flag in sys.argv:
            only = [t.strip() for t in sys.argv[sys.argv.index(flag) + 1].split(",") if t.strip()]
    name = "verify-" + re.sub(r"[^a-zA-Z0-9_-]", "", "_".join(only)) + ".json" if only else "verify-input.json"
    path = ROOT / "tmp" / name
    if not path.exists():
        print(f"{path} not found. Run `npm run content:check -- {'--only ' + ','.join(only) if only else ''}` first.")
        return 1
    data = json.loads(path.read_text(encoding="utf8"))
    problems: list[str] = []
    checked = 0

    def wanted(file: str) -> bool:
        return not only or any(t in file for t in only)

    for q in data["questions"]:
        if not wanted(q["file"]):
            continue
        checked += 1
        where = f"{q['file']}  {q['id']}"
        try:
            ans = run_snippet(q["verify"])
        except Exception as e:  # noqa: BLE001
            problems.append(f"ERROR     {where}: verify raised {type(e).__name__}: {e}")
            continue
        parsed_options = [option_number(o) for o in q["options"]]
        shown = max((p[1] for p in parsed_options if p is not None), default=None)
        try:
            hits = [LETTERS[i] for i, opt in enumerate(q["options"]) if matches(ans, opt, shown)]
        except Exception as e:  # noqa: BLE001
            problems.append(f"ERROR     {where}: {e}")
            continue
        if not hits:
            problems.append(f"NOMATCH   {where}: computed {ans!r}, which matches no option")
        elif len(hits) > 1:
            problems.append(f"MULTI     {where}: computed {ans!r} matches options {', '.join(hits)}")
        elif hits[0] != q["answer"]:
            problems.append(f"MISMATCH  {where}: computed {ans!r} matches {hits[0]} but the key is {q['answer']}")

    for block in data["runnable"]:
        if not wanted(block["file"]):
            continue
        checked += 1
        where = f"{block['file']}:{block['line']}"
        if block["lang"] == "python":
            buf = io.StringIO()
            try:
                with contextlib.redirect_stdout(buf):
                    exec(block["code"], {"__name__": "__lesson__"})  # noqa: S102
            except Exception as e:  # noqa: BLE001
                problems.append(f"ERROR     {where}: code raised {type(e).__name__}: {e}")
                continue
            got = "\n".join(line.rstrip() for line in buf.getvalue().rstrip().splitlines())
            want = "\n".join(line.rstrip() for line in block["expectText"].rstrip().splitlines())
            if got != want:
                problems.append(f"OUTPUT    {where}: printed output differs\n--- expected\n{want}\n--- actual\n{got}")
        else:
            try:
                con = _con(block["db"])
                cur = con.execute(block["code"])
                header = [d[0] for d in cur.description] if cur.description else []
                result = [[fmt_cell(v) for v in r] for r in cur.fetchall()]
            except Exception as e:  # noqa: BLE001
                problems.append(f"ERROR     {where}: query failed: {e}")
                continue
            table = block["expectTable"]
            want_header = [strip_markup(h) for h in table["header"]]
            if [h.lower() for h in header] != [h.lower() for h in want_header]:
                problems.append(f"TABLE     {where}: columns {header} but the lesson shows {want_header}")
                continue
            want_rows = [[norm_cell(c) for c in r] for r in table["rows"]]
            got_rows = [[norm_cell(c) for c in r] for r in result]
            if want_rows != got_rows:
                problems.append(f"TABLE     {where}: rows differ\n  expected {want_rows}\n  actual   {got_rows}")

    for p in problems:
        print(p)
    print(f"\nverify: {checked} items checked, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

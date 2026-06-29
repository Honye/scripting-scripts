Redirect Rules automatically rewrite a page's address in Safari and send you to a different one — for example, sending every `www.reddit.com` page to `old.reddit.com`, or a mobile site to its desktop version.

This feature requires Scripting PRO.

---

## How It Works

When you navigate to a page, Scripting checks its URL against your enabled rules in order. The first rule whose pattern matches rewrites the URL using its target template, and Safari is redirected there.

Each rule has a **match mode**:

- **Wildcard** (default, recommended) — `*` matches any run of characters. Each `*` becomes a capture you can reuse in the target as `$1`, `$2`, and so on.
- **Regex** (advanced) — the pattern is a regular expression matched against the whole URL. Use `$0` for the whole match and `$1`–`$9` for capture groups.

The rewritten address must start with `http://` or `https://`.

---

## Add a Rule

In the Safari Browser Scripts settings, open **Redirect Rules** and tap **Add**:

- **Name** — an optional label for the list.
- **Match mode** — Wildcard or Regex.
- **Match pattern** — the URL pattern to match.
- **Redirect to** — the target template, using `$1`, `$2`, … (or `$0` in regex mode).
- **Test** — enter a sample URL to preview the rewrite before saving.

Each rule has an **Enabled** switch. Tap a row to edit it, or swipe to delete.

---

## Examples

**Wildcard** — Reddit to old.reddit:

```
Pattern:  *://www.reddit.com/*
Redirect: https://old.reddit.com/$2
```

`https://www.reddit.com/r/swift` becomes `https://old.reddit.com/r/swift`. (`$1` captured the scheme, `$2` the path.)

**Regex** — mobile Wikipedia to desktop:

```
Pattern:  ^https://([a-z]+)\.m\.wikipedia\.org/(.*)$
Redirect: https://$1.wikipedia.org/$2
```

`https://en.m.wikipedia.org/wiki/Swift` becomes `https://en.wikipedia.org/wiki/Swift`.

---

## Notes

- Rules apply to top-level page navigation only, not to content embedded inside a page.
- A rule that would keep matching its own output will not loop endlessly — once a target has been used for a page, it is not redirected to again.
- Prefer Wildcard mode when you can. Keep regular expressions simple; a very complex regex can slow down matching.
- Changes you make in the settings take effect on your next navigation.

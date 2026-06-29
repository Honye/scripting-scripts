Search Shortcuts let you type a trigger word followed by a query in Safari's address bar and jump straight to a site's search results — for example, typing `gh hello world` can take you to GitHub's search for "hello world".

This feature requires Scripting PRO.

---

## How It Works

When you search from Safari's address bar, Scripting looks at the first word of your query. If it matches a shortcut's trigger, the rest of the query is sent to that shortcut's search URL instead of your default search engine.

- The **first word** is the trigger. A shortcut can have several triggers, and any of them activates it.
- **Everything after it** becomes the search query.
- The query is URL-encoded and substituted into the shortcut's URL where you put `%s`.

It works with Safari's address-bar search on common search engines (Google, Bing, DuckDuckGo, Yahoo, Baidu, Ecosia, Startpage). Make sure your query starts with the trigger word.

---

## Add a Shortcut

In the Safari Browser Scripts settings, open **Search Shortcuts** and tap **Add**:

- **Triggers** — one or more words with no spaces, e.g. `gh`. Add several (such as `gh` and `git`) and any of them activates the shortcut. Use **Add trigger** to add more, and the minus button to remove one.
- **Name** — an optional label for the list.
- **Search URL** — the destination, with `%s` where the query should go.

Each shortcut has an **Enabled** switch. Tap a row to edit it, or swipe to delete.

### Different URLs for iPhone/iPad and Mac

By default one search URL is used on every device. If you want a mobile-optimized site on iPhone/iPad and the full site on Mac, turn on **Use different URLs for iPhone/iPad and Mac**. Both fields are pre-filled with your current URL, so you only change the side you need — for example an `m.` mobile host for iPhone/iPad and the desktop host for Mac. The extension picks the URL that matches the device you are searching on.

---

## Examples

| Triggers | Search URL |
| --- | --- |
| `gh`, `git` | `https://github.com/search?q=%s` |
| `yt` | `https://www.youtube.com/results?search_query=%s` |
| `npm` | `https://www.npmjs.com/search?q=%s` |
| `w` | `https://en.wikipedia.org/w/index.php?search=%s` |

With the `gh` shortcut above, searching `gh swiftui` — or `git swiftui` — opens `https://github.com/search?q=swiftui`.

The destination does not have to be a web search. A custom app URL scheme or a Universal Link also works, so a shortcut can open another app's search directly.

---

## Notes

- Shortcuts are matched only when the first word equals one of the triggers. A normal query that does not start with a trigger passes through to your default search engine unchanged.
- Triggers are matched case-insensitively.
- Changes you make in the settings take effect on your next search.

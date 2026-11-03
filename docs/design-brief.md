# Design brief: the light redesign

Written 2026-11-02 from the user's request ("I want light mode", "genuinely top tier, not this low quality banned blue wash plus low quality cards") and the reference screenshots they sent. This brief survives compactions; the screenshots do not. Read it before touching any UI.

## 1. What is wrong with the current UI

Seen on the user's screenshot of Home (dark, because the theme follows the system setting) and in `src/app/globals.css`:

1. **Wrong default.** `settings.theme` defaults to `"system"`, so a dark OS gets the dark theme. The user wants light.
2. **Blue wash.** The accent is a stock blue (`#2a6fdb`) and `accent-soft` (`#eaf1fd`) puts a blue tint behind text for selected and highlighted states in 15 components. The style rules ban blue and teal washes. The "Open the plan" link is default-looking link blue.
3. **Card soup.** Every block is the same bordered card: same radius, same 1px gray border, same weight. Nothing leads the eye. Cards sit inside cards.
4. **Templated tiles.** "Quick practice" is three identical icon-in-a-rounded-square + title + blurb cards, the most generic AI dashboard pattern there is.
5. **Weak data.** Progress is a hairline gray bar that is nearly invisible; numbers other than the countdown have no presence; nothing on Home shows mastery at a glance.
6. **No identity.** A generic bar-chart glyph for the logo, no visual system for the eight knowledge areas, no signature component a student would remember.
7. **Layout defects.** A narrow center column with dead space on wide screens, and the profile chip at the bottom of the sidebar is clipped by the viewport.

## 2. What the references do better

- **Pro Problems** (skill grid on cream): every skill is a tile, color encodes status (green, amber, red, purple), locks and checks are small badges on the tile corner. The whole curriculum is visible in one view. Left rail is plain text with counts (8/78), no boxes.
- **Bedrock** (paper canvas, black outlines): warm off-white background, ink-black pill buttons, one hot accent (vermilion) reserved for the primary action, a yellow highlight for the current item, custom level icons as the only decoration, a big confident predicted-score number centered at the top of Exams, practice-test cards that state their status ("Paused in Module 1, question 2") with a resume button.
- **OnePrep**: white content panel, black pill "Continue" buttons, a planner that is a vertical timeline (date and weekday on the left, a task card on the right), analytics as one bordered strip of four stats split by hairlines, a "lowest-accuracy skills" list with percentages and a Practice link, designed empty states (icon, one-line message, one action).
- **ShiftGraph** ("Theme: paper"): warm paper background, white cards with soft borders and generous radius, a large page title with a one-line status sentence under it ("1 open drift event. 1 high outstanding."), clean tables with right-aligned numbers, a quiet right rail for secondary stats, one dark-navy primary button.
- **CookSAT**: light canvas, section headers with a share line ("35% of Math"), per-skill progress rings and counts, clear practice buttons.
- **Mobile references** (stock, wallet, class booking): large confident type, black pill CTAs, monochrome charts with one highlight, warm cream backgrounds, very little chrome.

Shared principles: a warm light canvas; strong type hierarchy with big numbers; ink-black primary actions; one accent used rarely; color used to mean something (status, area), never as decoration; structure through alignment, tables, timelines and grids rather than boxes around everything; designed empty states.

## 3. Direction: "paper"

Light only by default. Dark stays in Settings only if it passes the same visual review as light; otherwise remove it. Existing saved `"system"` settings map to light.

### Color tokens (light)

| Token | Value | Use |
|---|---|---|
| bg | #F6F4EF | canvas (warm paper) |
| surface | #FFFFFF | cards, panels, inputs |
| surface-2 | #EFECE5 | hover, segmented controls, code background |
| line | #E4E0D7 | hairlines, card borders |
| line-strong | #CFCAC0 | inputs, emphasized dividers |
| ink | #1A1814 | text, primary buttons |
| ink-2 | #4F4A42 | secondary text |
| ink-3 | #6E685F | tertiary text (meets 4.5:1 on bg) |
| accent | #E0512B | vermilion: the current or next thing, the main call to action on a page, the countdown. Never as a background wash. |
| good / warn / bad | #1E8A4C / #B7790A / #C8402E | status text and fills, with very light warm tints for status chips |

No blue anywhere in the UI chrome. Charts keep a colorblind-safe categorical palette.

### Area colors

Each of the eight knowledge areas gets one muted color for its tag dot, its column in charts, and its group label in the skill grid. Status still comes from the green, amber, red scale, so area color is never the only signal.

### Type

Keep Figtree (it is the gate's font, which the user approved) and JetBrains Mono for code only. Headings 700 to 800 with slight negative tracking: page title 32 to 36 px, section title 20 px, card title 16 to 17 px, body 15 to 16 px. Tabular figures for every number. Sentence case labels; no tiny gray all-caps labels, no decorative "01, 02" numbering.

### Components

- **Buttons**: primary is an ink-black pill with white text; the single most important action on a page may use the vermilion pill; secondary is a white pill with a hairline border; tertiary is a text button with an arrow.
- **Cards**: white, 1px `line` border, radius 16, padding 24, a soft shadow only on interactive cards. Never nest bordered cards; inside a card use dividers.
- **Stat strip**: one bordered strip, stats split by hairlines, label above a big tabular number, a one-line delta or note under it.
- **Skill grid** (signature): one tile per skill, labeled with its number, colored by mastery (not started paper, learning amber, solid green, mastered deep green), a small lock or check badge on the corner, grouped in rows by unit with the unit name at the left. On Practice it is the main view; Home and Progress show a compact version.
- **Roadmap** (signature): a vertical timeline, Regionals, then States, then Nationals, each with its date (confirmed or estimated, labeled), days left, and the milestones before it (units finished, practice tests taken, target score). The next event is highlighted with the accent.
- **Lists and tables**: rows with hairline dividers, numbers right-aligned, the action at the row's right edge.
- **Empty states**: a monochrome icon, one sentence, one action.
- **Callouts in lessons**: neutral tint with a 3px left rule (key idea ink, test tip green, common trap vermilion). No blue.

### Layout

Sidebar on the paper canvas, text items with icons, the active item a white pill with a hairline border; the profile chip must never clip. Content max width about 1120 px; Home and Progress use a two-column layout on wide screens (main column plus a right rail), single column below 1024 px. Every page starts with a large title and one plain status sentence under it.

## 4. Page plan

- **Home**: greeting and one status sentence; "Continue" card (current lesson, progress, primary button); roadmap rail with the next competition and countdown; Today (the plan's items as rows); compact skill grid; quick actions as plain rows, not tiles.
- **Learn**: units as sections, lessons as rows with status, time, and quiz score; the next lesson highlighted.
- **Lesson**: paper canvas, white reading column, outline rail; callouts restyled; checks and worked examples in the new card style.
- **Practice**: the skill grid as the main view, with filters (area, status) and drills.
- **Practice tests**: Bedrock-style test cards with status and resume; predicted score range at the top.
- **Test runner and report**: real-test look, calm and focused; report leads with the score, the band, and the area table.
- **Flashcards, Review, Progress, Plan, Reference, Settings**: same system; Plan becomes the roadmap plus the week view.

## 5. Constraints that still hold

The gate stays exactly as approved (dark, typewriter, caret pre-aligned). No IBM Plex, no Times-like fonts, no em dashes, no middots, no emoji, no gradients, no glows, no blue or teal washes, no pill badges used as decoration, no placeholders.

## 6. Changes requested after the first pass (2026-11-02, binding)

- No red anywhere. The accent is ink (monochrome UI); wrong and missed answers use amber (`--bad` #94550c on white, 5.9:1), warnings olive-gold; the chart palette has no red slot.
- Difficulty is color-coded everywhere: green Core, yellow Competitive, purple Champion (`--core-*`, `--comp-*`, `--champ-*`; each text color at least 5.39:1 on its tint). Question Bank tiles take their tier color, with status as corner badges (green check right, amber x missed, ink lock locked), as in Pro Problems. Difficulty labels use the same colors.
- Mastery tiles (Home, Progress) use an ink scale, darker for stronger, so they never compete with difficulty colors.
- "Practice" is now "Question Bank" (route stays /practice), icon Grid2x2Check.
- Logo: a W drawn as one line that ends higher than it starts, capped by a gold point; ink and gold only (`src/components/shell/Logo.tsx`, favicon `src/app/icon.svg`).
- Few lines: no sidebar edge or group dividers, no row dividers in lists (rounded hover rows instead), no rules inside cards, no roadmap connector lines, callouts as tinted blocks. Tables in lesson content keep their rules.
- Few kickers: no "Start here", "Up next", or stage labels above headings.

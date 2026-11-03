# 📜 Ghazal (غزل) — Modern Persian Poetry PWA & Literary Explorer

> **Ghazal** is an advanced, intelligent, and 100% offline-first Persian Poetry web application and research toolkit built on the prestigious **Ganjoor (گنجور)** open dataset.

---

## 🔗 Official Links

* **Live Web App / PWA:** [ghazal.mhkarami97.ir](https://ghazal.mhkarami97.ir/)
* **Cafe Bazaar Android Store:** [Cafe Bazaar — Ghazal App](https://cafebazaar.ir/app/mhk.ghazal)
* **GitHub Repository:** [github.com/MHKarami97/ghazal](https://github.com/MHKarami97/ghazal)
* **Author / Developer:** [Mohammad Hossein Karami (mhkarami97.ir)](https://mhkarami97.ir/)
* **Data Source:** [Ganjoor Open Database & API](https://ganjoor.net/)

---

## 🌟 Overview

**Ghazal** bridges centuries of classical and modern Persian literary heritage with contemporary web technologies. It is not just a digital reader, but an interactive companion for poetry enthusiasts, researchers, and learners. With full offline data storage in IndexedDB, readers can download complete poetic compendiums (*Divans*), search across thousands of couplets instantly, explore geographic references on an interactive map, inspect historical timelines, and memorize poetry using spaced repetition algorithms (SM-2).

---

## 🎯 Key Features

### 1. 100% Local-First & Offline Architecture
* **Total Independence:** Download any poet's complete works directly into browser/device storage (IndexedDB).
* **Live Progress & Cancellation:** Transparent progress modal displaying exact downloaded kilobytes and percentages, with immediate cancellation support.
* **Instant Full-Text Search:** Query hundreds of thousands of verses locally with zero network latency.
* **Persistent Cached Metrics:** Heavy linguistic analysis and comparison metrics are calculated once and stored locally.

### 2. Poetic Metres (Aruz), Rhymes & Musicality
* **Metre-Based Filtering:** Browse classical Persian meters including legendary forms like *Motaqareb* (Ferdowsi's Shahnameh metre) and *Hazaj* (Baba Taher's Dobayti).
* **Similar Metre & Rhyme Recommendations:** On each poem's page, discover other verses matching the exact rhythm and rhyme scheme.
* **Four-Choice Metre Quiz:** Test and sharpen classical rhythm recognition skills with named traditional Persian metres.

### 3. Regional Dialects & Indigenous Languages
* **Beyond Standard Persian:** Explore historical poetry penned in Persian regional dialects and languages:
  * Kurdish
  * Azerbaijani Turkish
  * Arabic
  * Mazandarani (Tabari)
  * Gilaki
* **Optimized Typography:** Powered by Vazirmatn fonts ensuring accurate rendering of dialect-specific diacritics and letters in right-to-left layout.

### 4. Historical & Geographic Poetry Exploration
* **Poetry in Geography (Map of Regions):** Interactive map highlighting cities, rivers, mountains, and lands referenced in poems with direct access to every related couplet.
* **Poetry & History (Interactive Timeline):** Visual chronologies of poets, historical rulers, and contemporaries.
* **Who Mentions Whom (Allusion & Participant Tracker):** Track explicit mentions and literary allusions across historical literary circles.
* **Court & Patronage Network Graphs:** Explore connections between poets, viziers, and patrons.

### 5. Poetry Memorization & Interactive Challenges
* **Step-by-Step Spaced Repetition (SuperMemo SM-2):** Progressive word masking allows gradual, effortless memorization of favourite couplets.
* **Daily Challenge:** A fresh daily literary puzzle with local streak tracking and score history.
* **Literary Games & Quizzes:**
  * "Whose verse is this?"
  * "What is the next hemistich?"
  * "Rhyming Couplet Matcher"

### 6. Reading, Divination & Social Sharing
* **Modern Hafez Fortune (Faal):** Daily fortune reading with commentary and random fortune generation.
* **Poem of the Day:** Featured daily poem with one-click full reader loading.
* **Visual Card Generator:** Turn any couplet into a customized image card for Instagram, Telegram, and social media.
* **Personal Collections & PDF Export:** Organize custom collections ("My Favorites", "Travel Poems") and export them neatly formatted in PDF.
* **Two-Poet Comparator:** Compare thematic distributions, prevalent metres, and shared geographical motifs side-by-side.

---

## 📱 User Experience (UI/UX)

* **Refined Aesthetics:** Elegant Iranian typographic balance and modern minimalist design.
* **Light / Dark Themes:** Seamless dark and light themes respecting system preferences.
* **Vazirmatn Typography:** Dynamic text sizing, line-height tuning, and high legibility across all screens.
* **Universal Responsiveness:** Flawless experience on mobile, tablet, and widescreen desktops.
* **Global Activity Indicators:** Real-time feedback for background API calls and sync tasks.

---

## 🛠️ Tech Stack

* **Framework:** Vue 3 (Script Setup, Composition API)
* **Language:** TypeScript
* **Build System:** Vite
* **State Management:** Pinia
* **Local Database:** Dexie.js (IndexedDB)
* **PWA & Offline Service Worker:** Vite Plugin PWA, Workbox
* **Maps & Visualizations:** Leaflet.js, Canvas API
* **Styles & UI:** Tailwind CSS, Lucide Icons, Vazirmatn Font

---

## 🖼️ Media Kit & Promotional Assets (`public/share/`)

High-resolution promotional banners and cross-device screenshots ready for publication:

### Social Media & Ad Banners (Light & Dark Modes in `public/share/banners/`)
Rendered with Chrome DevTools Protocol at 2x retina without clipping:
* **Light Mode:** `public/share/banners/light/` (Default)
* **Dark Mode:** `public/share/banners/dark/`

* `banner-1200x630-social.png` — Standard OpenGraph / Twitter / LinkedIn card (1200x630)
* `poster-1080x1080-square.png` — High-impact square poster for Instagram posts (1080x1080)
* `banner-1080x1920-story.png` — Vertical story format for Instagram / Status (1080x1920)
* `banner-728x90-leaderboard.png` — Standard website leaderboard ad (728x90)
* `banner-300x250-rectangle.png` — Full Medium Rectangle sidebar banner (300x250, perfectly uncropped)

### Responsive Screenshots (Light & Dark Modes in `public/share/screenshots/`)
Extracted using Chrome DevTools Protocol with mobile device metrics emulation (390x844 @2x retina) and desktop widescreen (1440x900):
* **Light Mode:** `public/share/screenshots/light/` (13 mobile + 13 desktop captures)
* **Dark Mode:** `public/share/screenshots/dark/` (13 mobile + 13 desktop captures)

1. `mobile-01-home.png` / `desktop-01-home.png` — Home page with Daily Poem and stats
2. `mobile-02-poets.png` / `desktop-02-poets.png` — Poets directory and historical eras
3. `mobile-03-poet-detail.png` / `desktop-03-poet-detail.png` — Divan view (Hafez) and category reader
4. `mobile-04-faal.png` / `desktop-04-faal.png` — Hafez fortune reading with commentary
5. `mobile-05-memorize.png` / `desktop-05-memorize.png` — Spaced repetition memorizer (SM-2)
6. `mobile-06-daily-challenge.png` / `desktop-06-daily-challenge.png` — Daily challenge puzzle and score tracking
7. `mobile-07-metres.png` / `desktop-07-metres.png` — Classical metres explorer and rhyme finder
8. `mobile-08-dialects.png` / `desktop-08-dialects.png` — Regional dialects and languages (Kurdish, Turkish, Gilaki, Tabari)
9. `mobile-09-collections.png` / `desktop-09-collections.png` — Personal bookmarks and PDF export
10. `mobile-10-compare.png` / `desktop-10-compare.png` — Two-poet stylistic & statistical comparator
11. `mobile-11-explore.png` / `desktop-11-explore.png` — Interactive poetry geography map and timeline
12. `mobile-12-search.png` / `desktop-12-search.png` — Offline local full-text search
13. `mobile-13-settings.png` / `desktop-13-settings.png` — Settings, offline packages, and about box

---

## 📜 Credits & License

Authored and maintained by [Mohammad Hossein Karami](https://mhkarami97.ir/).
Special gratitude to the [Ganjoor](https://ganjoor.net/) project for maintaining Iran's open cultural treasure trove.

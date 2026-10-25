# EKAMBANI SYSTEM (GitHub Pages / PWA edition)

Files (all go in the **root** of your repository, keeping the `icons/` folder):

```
index.html        <- the application (HTML + CSS + JS + IndexedDB + Google API code)
manifest.json
sw.js
icons/            icon-32/180/192/512.png, icon-maskable-512.png
README.md         (optional to upload)
```

## 1. Deploy to GitHub Pages
1. Create a repository (e.g. `system`). Upload `index.html`, `manifest.json`, `sw.js` and the whole `icons` folder to the repository root (drag the extracted folder's *contents*, not the folder itself).
2. Settings > Pages > Source: "Deploy from a branch", Branch `main`, folder `/ (root)` > Save.
3. Open `https://<user>.github.io/<repo>/` (HTTPS is required for the service worker, install and Google sign-in).
All paths are relative, so it works under the `/<repo>/` sub-path.

## 2. Google Cloud setup (needed only for online sync; the app runs without it)
1. console.cloud.google.com > create/select a project.
2. APIs & Services > Library: enable **Google Sheets API** and **Google Drive API**.
3. OAuth consent screen: User type External, add yourself as a test user (or publish). Scopes used: `.../auth/spreadsheets` and `.../auth/drive.file`.
4. Credentials > Create credentials > **OAuth client ID** > Web application. Authorized JavaScript origins: `https://<user>.github.io` (origin only, no path). No redirect URI is needed.
5. Copy the **Client ID**. Do **not** create or use a client secret or API key; none is used.

## 3. Connect inside the app
1. Open the app > Login. The built-in setup number `1997001233` works ONLY while the Admin sheet (inside the System Data spreadsheet) holds no account numbers and setup has not been completed. Then: Admin > Settings > the gear icon at its top-left > + > enter your own number > Save. Success is reported only after the Admin sheet was written online and read back; the setup number then stops working. If the device is offline or Sheets is not connected, saving is refused (nothing is stored locally and claimed as saved). A sign-in that could not be checked online is labelled "not verified online".
2. Admin > **APIs**. Sheets section: pencil icon > paste Client ID and your existing Spreadsheet ID (or URL) > Save > **Connect to Google**. Drive section: same with the Client ID (can be the same one).
3. Existing tabs (Home, Computer, Mobile Phone, Inventory, Admin, Users, About, VerificationCode, Sheet1, Business Code, Ads, Settings, AdAccessLog, Web Apps) and their headers are reused. Missing tabs are created only when data has to be written to them. "Create new spreadsheet" is optional.
4. Access tokens last about an hour and are kept in memory; click Connect again when the status says "Reconnect needed".

## How sync works / limits (read this)
- IndexedDB is the working database. Every save is stored locally first; the Admin top bar pill shows Offline / pending / Synced / conflict.
- Sync is per tab: if a tab has local changes it is written back as a whole (one request, so retries cannot create duplicate rows). If the same tab also changed in Google since the last sync, **nothing is overwritten**; you choose "Keep this device's version" or "Use Google's version" in Admin > APIs.
- Photos are saved on the device first and uploaded to a Drive folder this app creates (default "System Uploads"). The `drive.file` scope cannot see your old "TechShop Uploads" folder, but old image links keep working. Retries look up an existing upload by id, so no duplicates.
- Formulas in synced tabs are preserved on write-back; the app shows the formula text for such cells.
- **Architecture limit:** GitHub Pages has no server. A visitor's browser can read your private spreadsheet only if signed in with an authorized Google account, so catalog data (products, lessons, ...) is visible on devices that have synced, i.e. the administrator's. Verification-code single-use and ad unlocks are enforced per device, not globally. Making visitors see shared data needs a decision (e.g. a separate public catalog sheet) that was not part of this migration.
- Web Apps opened **in the system** show a centered indeterminate linear bar until the frame's `load` event (or 30 s). Browsers expose no percentage or reliable error event for cross-origin frames. Web Apps set to open in a new tab load in the browser's own tab.

## Test offline
1. Open the site online once (installs the service worker and caches the shell + SweetAlert/fonts).
2. DevTools > Application > Service Workers > Offline (or airplane mode) > reload: the app opens; add/edit records in Admin; the pill shows pending.
3. Go online: pending changes sync if connected (or click "Sync now").

## Install
- **Android (Chrome/Edge/Samsung Internet):** More page > Install EKAMBANI SYSTEM, or browser menu > Install app / Add to Home screen.
- **Windows (Chrome/Edge):** More page > Install EKAMBANI SYSTEM, or the install icon in the address bar.
- Firefox on Windows and some browsers cannot install web apps; the More page then shows browser-specific instructions instead of a button.
- To release an update, change `VERSION` in `sw.js`; the new version applies after all tabs are closed and the app is reopened (local records are never touched).

## Added in this update
- **Public empty states:** lessons show exactly "No lessons yet"; other sections show neutral wording (no admin instructions). If Sheets is configured but this device has never managed to load a sheet, the page says "Content could not be refreshed" instead of claiming it is empty. Cached content is never cleared by a failed request.
- **Admin > History** (separate History spreadsheet): Spreadsheet ID/URL with edit icon, Save/Cancel, Create New Spreadsheet, Next (pages through the table, wrapping to page 1), Sync Now, Month/Year filters, Location/Visitor table, most-visited location and total visits. Uses the same Google sign-in/Client ID as Sheets. Existing tab "History" (or the first tab) is used; a `VisitId` column is added only if missing, to prevent duplicate rows on retry.
- **Visit recording:** a visit = a device opening the app >= 30 minutes after its previous visit. Location = the device's time zone (approximate; no GPS, no IP look-up). Visitor = an anonymous code derived from a random per-device id. Visits are saved on the device first and appear as "not shared yet" until a Google-authorized device syncs them.
- **Web Apps Access Type** (Free / Verification Code / Ad) using the existing code and ad unlock flows. New `AccessType` column on the Web Apps tab (added only if missing).
- **APKs & Projects "Opens In" toggle** (same switch as Web Apps; new `OpenInNewTab` column on Sheet1; blank = new tab, as before). OFF opens the link inside the app. Direct download links may download instead of displaying in the in-app frame, and some sites forbid framing.
- **Ads:** Admin > Ads has an "Auto Ad Rotation" switch (saved in the existing Settings tab as key `adRotation`, 8th and last allowed row). ON: with several enabled ads the ad changes with a 45-second time slot (no timers, so no duplicate timers). OFF: always the first enabled ad. **Ad gate:** about 30 s after a first visit, then about every 5-10 minutes; it uses the existing ad dialog whose completion rule is the existing 5-second wait / sponsor-link click. The ad is a YouTube embed + link, which gives no real "finished" signal, so the gate does not claim one. The gate never appears over another dialog, the admin panel, an open web app, a hidden tab or while offline.
- **Freshness:** Google Sheets has no push notifications. Authorized devices poll every 60 s and on reconnect; changed pages re-render without a reload.

## Limits you must know about
- **Anonymous visitors cannot write to or read private Google Sheets from a static site.** Without a backend, visitors' visits cannot reach the shared History sheet, and a visitor's device (which has no Google sign-in) cannot download lessons/products saved on another device. Shared data reaches **devices signed in to an authorized Google account** only. Fixing this needs your approval of an architecture change (for example a small server/Cloud Function holding the credentials, or a deliberately public read-only catalog sheet). Nothing here pretends otherwise.
- The built-in setup number is in the page source; it protects nothing by itself. After setup it is rejected because the Admin sheet then holds a number.
- Verification codes and ad unlocks are enforced per device.

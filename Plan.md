# BeanCraft — Expo + PHP/MySQL CRUD app (class project)

You are building "BeanCraft", a coffee-bean inventory mobile app. It is a class
project whose graded focus is CRUD operations against a PHP + MySQL REST API
hosted on Freehostia (free plan), reachable through a DuckDNS/Freehostia URL,
with every endpoint testable in Postman. Build it in phases and STOP after each
phase so I can test before you continue.

## Design source (Figma MCP)

File key: LcmkJSKLWaXdx7a5rCHEUk
Screens (node IDs):

- Login ............ 2:3
- READ (stash list) 1:2
- CREATE (new bean) 1:620
- UPDATE (edit bean) 1:300
- DELETE (details + confirm bottom sheet) 1:904
- Profile .......... 2:104

For every screen, call get_design_context and get_screenshot on its node before
coding it. Match layout, spacing, radii, colors, and typography closely.
Before building screens, extract the shared design tokens (colors, font
families/weights/sizes, spacing, radii, shadows) from the file into
src/theme/tokens.ts, and load the fonts with @expo-google-fonts. Build shared
components once and reuse them: TopBar, BottomNav (Inventory, Brew Log, Stats,
Profile), Card, Chip/Tag, TextField, SegmentedControl, PrimaryButton,
BottomSheet, Toast. Use a local placeholder image or icon wherever the design
shows a photo; there is no image upload.

## Scope — what must actually work

1. Auth: register + login + logout, with the token stored in expo-secure-store.
   Unauthenticated users see only Login (add a simple Register screen styled
   like Login, since "Create Roaster Account" links to it).
2. READ: the stash list loads the logged-in user's beans from the API.
   Pull-to-refresh, loading state, empty state, and error state are required.
   The search bar and filter chips filter the loaded list on the client.
   The "Active Bags" pill shows the real count.
3. CREATE: the New Bean Entry form saves to the API and returns to the list.
4. UPDATE: tapping a card's ⋮ menu → Edit opens the edit screen pre-filled
   from the API. These persist: section 1 (roaster/origin details),
   section 2 (remaining grams, including the −15g/−18g/−20g/Restock buttons),
   and section 4 (score + cupping notes). Section 3 (Extraction Profile) is
   static UI.
5. DELETE: tapping a card opens Bean Details. Delete opens the confirmation
   bottom sheet, which calls the API and returns to the list with a toast.
   Replace the brew-log copy in the sheet with: "This will permanently remove
   this bag from your stash. This action cannot be undone." Show the real
   bean name, roaster, process, date added, and bag weight in it.
6. Profile: show the real name and email; "Confirm Log Out" works.

## Static UI only (render faithfully, no logic)

OCR/QR scan card, "Continue with Google/Apple" buttons, Forgot password,
Brew Log and Stats tabs (simple "Coming soon" screens in the same style),
Profile gear/stats/export/cloud-sync sections, the favorite heart, and
Extraction Profile inputs. Tapping any of these shows a "Coming soon" toast.

## Data model (MySQL)

users: id (PK, AI), name, email (UNIQUE), password_hash, api_token (UNIQUE,
nullable), created_at
beans: id (PK, AI), user_id (FK → users.id, ON DELETE CASCADE), name,
roaster, origin, farm, process_method, roast_level, roast_date (DATE),
altitude, tasting_notes (comma-separated string), bag_weight_g (INT),
remaining_g (INT), price (DECIMAL 8,2), rating (DECIMAL 2,1, nullable),
cupping_notes (TEXT, nullable), created_at, updated_at
Required fields: name, roaster, bag_weight_g. remaining_g defaults to
bag_weight_g on create.
Deliver this as backend/schema.sql, importable through phpMyAdmin.

## Backend (plain PHP 7.4+ compatible, PDO, no framework, no Composer)

Put everything under backend/api/ so I can upload it by FTP or the file
manager:

- config.php: DB credentials as constants (placeholders I will fill in),
  plus a PDO connection with ERRMODE_EXCEPTION.
- helpers.php: JSON response helper, input parsing (JSON body), CORS headers,
  auth guard that resolves the user from the token.
- status.php: GET → {"status":"ok","db":"connected","time":...}
  This is my Postman health check.
- register.php: POST {name,email,password} → 201 + user + token
- login.php: POST {email,password} → 200 + user + token
- logout.php: POST → clears token
- beans.php:
  GET → list of the user's beans (newest first)
  GET ?id=N → one bean (404 if not the user's)
  POST → create (201)
  PUT ?id=N → update (partial updates allowed)
  DELETE ?id=N → delete
  Rules:
- Every response is JSON: {"success":bool,"data":...,"message":...}, with
  correct HTTP status codes (200/201/400/401/404/405/422/500).
- Use prepared statements everywhere, password_hash/password_verify, and
  bin2hex(random_bytes(32)) for tokens. Scope every bean query by user_id.
- Validate input server-side and return 422 with field errors.
- Free shared hosts often strip the Authorization header and sometimes block
  PUT/DELETE. So read the token from "Authorization: Bearer <t>" OR
  "X-Auth-Token: <t>", and also accept POST with "\_method": "PUT"/"DELETE"
  (or ?\_method=) as a fallback. Include an .htaccess that forwards the
  Authorization header. The app should send X-Auth-Token by default.
- Never echo PHP errors to clients in production; log them instead.

Also generate backend/BeanCraft.postman_collection.json with a {{baseUrl}}
and {{token}} variable, every endpoint above, example bodies, and a test
script on Login/Register that saves the token to {{token}} automatically.

## App (Expo, TypeScript)

- Expo SDK (latest stable), expo-router OR React Navigation (pick one and say
  why in one line), expo-secure-store, @expo-google-fonts.
- src/config.ts holds API_BASE_URL (placeholder for my DuckDNS/Freehostia
  URL). No URLs are hard-coded anywhere else.
- src/api/client.ts: one fetch wrapper that adds the token header, a 15s
  timeout, JSON parsing, and a friendly error message for network failures.
  Expose typed functions: login, register, logout, getBeans, getBean,
  createBean, updateBean, deleteBean.
- Auth context that restores the session on launch.
- Forms: controlled inputs, inline validation matching the server rules,
  disabled Save button while submitting, keyboard-aware scrolling.
- If the base URL is http:// rather than https://, configure Android
  cleartext traffic (expo-build-properties) so builds can reach it, and tell
  me you did.
- Keep components small and readable: this is a class project I need to
  explain line by line.

## Phases (stop after each, summarize what to test, and wait for me)

1. backend/: schema.sql, PHP API, .htaccess, Postman collection, plus a short
   DEPLOY.md (import schema in phpMyAdmin, fill config.php, upload files,
   test status.php in Postman).
2. Expo scaffold, theme tokens from Figma, fonts, shared components,
   navigation shell with bottom nav and placeholder tabs.
3. Login + Register + session restore + Profile (logout).
4. READ screen wired to the API (search/filter on the client).
5. CREATE screen.
6. UPDATE screen.
7. Bean Details + DELETE bottom sheet + toasts.
8. Polish pass: compare each screen to its Figma screenshot and fix
   mismatches. Test empty/error/loading states and a small Android screen.

Before Phase 1, ask me for anything you genuinely need (for example, whether
my host gives me https). Otherwise use sensible defaults and state them.

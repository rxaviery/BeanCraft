# BeanCraft

A coffee-bean inventory and brew-journal mobile app. Track every bag in your
stash, log brews that use coffee from the bag, and see each bean's price in
other currencies with live exchange rates.

Built with **React Native (Expo)** on a self-hosted **PHP + MySQL REST API**,
plus one third-party public API.

## Third-party API

**ExchangeRate-API (open access)** — `https://open.er-api.com/v6/latest/PHP`

- Free, no API key. Returns how much of each currency one Philippine peso buys.
- Used on **Bean Details → "Price around the world"**: the bean's peso price is
  converted to USD, EUR, JPY and GBP, with the rate and last-update time.
- Code: [`mobile/src/api/rates.ts`](mobile/src/api/rates.ts) (fetch + JSON parsing),
  [`mobile/src/components/PriceAroundWorld.tsx`](mobile/src/components/PriceAroundWorld.tsx) (UI).

## Custom REST API

PHP 7.4 + MySQL, hosted on Freehostia at `http://rxaviery.duckdns.org`.
Every response is JSON: `{ "success": bool, "data": ..., "message": "..." }`.

| Endpoint | Methods | Purpose |
|---|---|---|
| `status.php` | GET | Health check (API + database) |
| `register.php`, `login.php`, `logout.php` | POST | Accounts and login tokens |
| `beans.php` | GET, GET `?id=`, POST, PUT `?id=`, DELETE `?id=` | Beans CRUD |
| `brews.php` | GET (`?bean_id=`), GET `?id=`, POST, PUT `?id=`, DELETE `?id=` | Brew log CRUD (keeps the bean's grams in sync) |

Hosts that block PUT/DELETE can send POST with `"_method": "PUT"` or `"DELETE"`.
All endpoints are in the Postman collection
[`backend/BeanCraft.postman_collection.json`](backend/BeanCraft.postman_collection.json).

## Features

- **Create** — New Bean form with validation; the list updates when you return.
- **Read** — Stash list with search, roast filters and pull-to-refresh; tap a bean for details.
- **Update** — Edit form pre-filled from the API; quick "−15g / Restock" buttons.
- **Delete** — Confirmation sheet before removing a bean.
- **Brew Log** — Log, edit and delete brews; each brew takes its dose from the bag.
- **Stats** — Beans on hand, stash value, roast mix, top origins, running-low list.
- **Accounts** — Register, login, session restore, logout; logged-out users only see Login.

## Project structure

```
backend/
  schema.sql                  MySQL tables (users, beans, brews)
  api/                        PHP endpoints (upload this folder's files to the host)
  BeanCraft.postman_collection.json
  DEPLOY.md                   Step-by-step hosting guide
  smoke_test.py               End-to-end API checks
mobile/
  src/app/                    Screens (Expo Router: each file is a route)
  src/components/             Shared UI components
  src/api/                    client.ts (our API), rates.ts (third-party API)
  src/config.ts               API addresses
```

## Running it

**Backend** — follow [`backend/DEPLOY.md`](backend/DEPLOY.md): import `schema.sql`
in phpMyAdmin, set the database login in `api/config.php`, upload `api/`.

**App**

```bash
cd mobile
npm install
npx expo start      # then scan the QR code with Expo Go, or press "w" for web
```

The API address is in [`mobile/src/config.ts`](mobile/src/config.ts).

**API tests**

```bash
python backend/smoke_test.py http://rxaviery.duckdns.org
```

## Author

Renz Xaviery O. Pastrana

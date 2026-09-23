# Deploying the BeanCraft API

Final URL: `http://YOURNAME.duckdns.org/api/status.php` (http only — there's no SSL
certificate for a DuckDNS name on a shared host).

## 1. Create the tables

Freehostia → MySQL Databases → phpMyAdmin for `renpas12_db` → **Import** →
choose `backend/schema.sql` → **Go**. You should see the `users` and `beans` tables.

## 2. Point DuckDNS at Freehostia

1. Find your Freehostia server IP. It's on the control panel's account/hosting
   details page, or run `nslookup YOURSITE.freehostia.com` in a terminal.
2. On duckdns.org, type that IP into your domain's **current ip** box and click
   **update ip**.
   Don't install the DuckDNS update script: it would replace the IP with your
   home IP.
3. In the Freehostia panel, add `YOURNAME.duckdns.org` as a hosted domain (you
   manage the DNS elsewhere, at DuckDNS). A shared server hosts many sites on one IP,
   so it only serves your files to domain names it knows about.
4. Wait a few minutes. `nslookup YOURNAME.duckdns.org` should return the Freehostia IP.

If Freehostia won't let you add the domain, stop and tell me.

## 3. Upload the API

Upload everything inside `backend/api/` to an `api` folder in the web root of
`YOURNAME.duckdns.org`, using the File Manager or FTP. Make sure `.htaccess` goes too:
it starts with a dot, so some FTP clients hide it.

## 4. Fill in config.php

Edit `api/config.php` **on the server** (File Manager → Edit) and set `DB_USER`
and `DB_PASS` from the MySQL Databases page. The copy in git keeps `CHANGE_ME`,
so your password never gets committed.

## 5. Test with Postman

1. Import `backend/BeanCraft.postman_collection.json`.
2. Collection → Variables → set `baseUrl` to `http://YOURNAME.duckdns.org/api`.
3. Run **Status**. Expect `"db": "connected"`.
4. Run **Register** (or **Login**). The token saves itself.
5. Run the Beans requests top to bottom: Create saves `beanId` for the rest.

Also open the status URL in your **phone's browser**. If you see a page other than
JSON, the host is changing API responses before they reach the app.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `"db": "unreachable"` | Wrong `DB_USER`/`DB_PASS` in config.php. |
| 500 with "Server error" | Read `api/error.log` in the File Manager. |
| 401 with a Bearer header | Header is being stripped; use `X-Auth-Token` instead (the app does). |
| 405 on PUT/DELETE | Host blocks them; use the "POST fallback" requests. |
| Freehostia default page | Step 2.3 (domain not added in Freehostia) is missing or still propagating. |

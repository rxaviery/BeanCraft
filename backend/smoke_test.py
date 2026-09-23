"""End-to-end check of the BeanCraft API. Standard library only.

Usage:  python smoke_test.py http://YOURNAME.duckdns.org/api
Creates a throwaway user, runs every endpoint, deletes its bean, logs out.
"""
import json
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:8765"


def call(method, path, body=None, token=None, headers=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "BeanCraft-smoke-test/1.0")  # host firewall blocks "Python-urllib"
    if token:
        req.add_header("X-Auth-Token", token)
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data, timeout=15) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read())


def check(label, got, expected):
    assert got == expected, f"{label}: expected {expected}, got {got}"
    print(f"ok  {label}")


status, res = call("GET", "/status.php")
check("status", (status, res["data"]["db"]), (200, "connected"))

email = f"test{int(time.time())}@example.com"
status, res = call("POST", "/register.php", {"name": "Test", "email": email, "password": "secret123"})
check("register", status, 201)
status, res = call("POST", "/register.php", {"name": "Test", "email": email, "password": "secret123"})
check("register duplicate -> 422", (status, "email" in res["data"]["errors"]), (422, True))
status, res = call("POST", "/login.php", {"email": email, "password": "wrong-pass"})
check("login wrong password", status, 401)
status, res = call("POST", "/login.php", {"email": email.upper(), "password": "secret123"})
check("login", status, 200)
token = res["data"]["token"]

check("no token", call("GET", "/beans.php")[0], 401)
check("bearer header", call("GET", "/beans.php", headers={"Authorization": f"Bearer {token}"})[0], 200)

status, res = call("POST", "/beans.php", {"roaster": "X", "bag_weight_g": 0, "roast_date": "2026-02-30"}, token)
check("create invalid -> 422", (status, sorted(res["data"]["errors"])), (422, ["bag_weight_g", "name", "roast_date"]))

status, res = call("POST", "/beans.php", {"name": "Pink Bourbon", "roaster": "Manhattan", "bag_weight_g": 250, "price": "24"}, token)
check("create", (status, res["data"]["remaining_g"], res["data"]["price"]), (201, 250, 24.0))
bean_id = res["data"]["id"]

status, res = call("GET", f"/beans.php?id={bean_id}", token=token)
check("get one", (status, res["data"]["name"]), (200, "Pink Bourbon"))
status, res = call("GET", "/beans.php", token=token)
check("list", (status, len(res["data"])), (200, 1))

status, res = call("PUT", f"/beans.php?id={bean_id}", {"remaining_g": 235, "rating": 4.5}, token)
check("partial update", (status, res["data"]["remaining_g"], res["data"]["rating"], res["data"]["name"]), (200, 235, 4.5, "Pink Bourbon"))
status, res = call("PUT", f"/beans.php?id={bean_id}", {"remaining_g": 300}, token)
check("remaining > bag -> 422", status, 422)
status, res = call("POST", f"/beans.php?id={bean_id}", {"_method": "PUT", "remaining_g": 217}, token)
check("POST _method=PUT", (status, res["data"]["remaining_g"]), (200, 217))

check("other id -> 404", call("GET", "/beans.php?id=999999", token=token)[0], 404)

# Brews: logging uses coffee from the bean (remaining is 217g here).
def remaining():
    return call("GET", f"/beans.php?id={bean_id}", token=token)[1]["data"]["remaining_g"]

status, res = call("POST", "/brews.php", {"method": "V60", "dose_g": 0}, token)
check("brew invalid -> 422", (status, sorted(res["data"]["errors"])), (422, ["bean_id", "dose_g"]))
status, res = call("POST", "/brews.php", {"bean_id": bean_id, "method": "V60", "dose_g": 15, "water_g": 250, "brew_time_s": 165, "rating": 4}, token)
check("brew create", (status, res["data"]["bean_name"], res["data"]["water_g"]), (201, "Pink Bourbon", 250))
brew_id = res["data"]["id"]
check("brew takes 15g", remaining(), 202)
status, res = call("PUT", f"/brews.php?id={brew_id}", {"dose_g": 18, "bean_id": 999999}, token)
check("brew update (bean can't change)", (status, res["data"]["dose_g"], res["data"]["bean_id"]), (200, 18.0, bean_id))
check("dose change adjusts stock", remaining(), 199)
status, res = call("GET", f"/brews.php?bean_id={bean_id}", token=token)
check("brews for one bean", (status, len(res["data"])), (200, 1))
check("brew delete", call("DELETE", f"/brews.php?id={brew_id}", token=token)[0], 200)
check("delete puts coffee back", remaining(), 217)
call("POST", "/brews.php", {"bean_id": bean_id, "method": "Espresso", "dose_g": 18}, token)

check("delete via ?_method", call("POST", f"/beans.php?id={bean_id}&_method=DELETE", token=token)[0], 200)
check("delete again -> 404", call("DELETE", f"/beans.php?id={bean_id}", token=token)[0], 404)
check("deleting a bean deletes its brews", len(call("GET", "/brews.php", token=token)[1]["data"]), 0)
check("wrong method -> 405", call("GET", "/login.php")[0], 405)

check("logout", call("POST", "/logout.php", token=token)[0], 200)
check("old token rejected", call("GET", "/beans.php", token=token)[0], 401)
print("\nAll checks passed.")

import os
import re
import json
import csv
import sys
import requests
from pathlib import Path

API_KEY = os.environ["KASSALAPP_API_KEY"].strip()
URL = "https://kassal.app/api/v1/physical-stores"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json",
}
EMAIL_PATTERN = re.compile(r"ep0*(\d+)@europris\.no", re.IGNORECASE)

all_items = []
page = 1

while True:
    response = requests.get(
        URL,
        headers=HEADERS,
        params={
            "group": "EUROPRIS_NO",
            "page": page,
            "size": 100,
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    items = payload.get("data", [])
    if not isinstance(items, list):
        raise RuntimeError("API zwróciło nieoczekiwany format danych.")

    all_items.extend(items)

    meta = payload.get("meta", {})
    current_page = int(meta.get("current_page", page))
    last_page = int(meta.get("last_page", current_page))

    print(f"Pobrano stronę {current_page}/{last_page}: {len(items)} rekordów")

    if current_page >= last_page:
        break
    page += 1

stores = []
missing_email_number = []
seen_numbers = set()

for item in all_items:
    email = str(item.get("email") or "").strip()
    match = EMAIL_PATTERN.search(email)

    if not match:
        missing_email_number.append({
            "api_id": item.get("id"),
            "name": str(item.get("name") or "").strip(),
            "address": str(item.get("address") or "").strip(),
            "email": email,
        })
        continue

    number = int(match.group(1))  # ep077 -> 77

    if number in seen_numbers:
        continue
    seen_numbers.add(number)

    position = item.get("position") or {}
    stores.append({
        "number": number,
        "name": str(item.get("name") or f"Europris {number}").strip(),
        "address": str(item.get("address") or "").strip(),
        "email": email,
        "phone": str(item.get("phone") or "").strip(),
        "latitude": position.get("lat"),
        "longitude": position.get("lng"),
    })

stores.sort(key=lambda x: (x["name"].casefold(), x["number"]))
missing_email_number.sort(key=lambda x: x["name"].casefold())

Path("stores.json").write_text(
    json.dumps(stores, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

with Path("stores.csv").open("w", newline="", encoding="utf-8-sig") as handle:
    writer = csv.writer(handle, delimiter=";")
    writer.writerow([
        "number", "name", "address", "email", "phone", "latitude", "longitude"
    ])
    for store in stores:
        writer.writerow([
            store["number"],
            store["name"],
            store["address"],
            store["email"],
            store["phone"],
            store["latitude"],
            store["longitude"],
        ])

Path("stores_without_number.json").write_text(
    json.dumps(missing_email_number, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

print(f"Gotowa baza: {len(stores)} sklepów z potwierdzonym numerem.")
print(f"Bez numeru w adresie e-mail: {len(missing_email_number)} sklepów.")

if len(stores) < 50:
    print("BŁĄD: znaleziono podejrzanie mało sklepów. Nie zapisuję wyniku do repozytorium.", file=sys.stderr)
    sys.exit(2)

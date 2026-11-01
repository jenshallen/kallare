#!/usr/bin/env python3
"""Bygger den krypterade källarkopian (data.enc + wrap.json) till mobilappen.

Användning:
  python3 tools/build_snapshot.py --wines DIR --verticals DIR --mobile FILE [--run FILE] [--out .]

  --wines      katalog med ett JSON-dokument per vin (ArtifactData list ... out_dir), filnamn <id>.json
  --verticals  katalog med vertikal-dokument (<id>.json)
  --mobile     JSON med meta/mobile: {"key": <base64, 32 byte>, "wrap": {...}, "importedOps": [...]}
  --run        JSON med meta/run (valfri; ger lastRun)

Krypteringen är AES-256-GCM med nyckeln "key". wrap.json innehåller samma nyckel krypterad med
Jens lösenord (PBKDF2-SHA256) och skapas i vinlistan – det här skriptet kopierar bara wrap-delen.
Inget i klartext skrivs till utkatalogen.
"""
import argparse, base64, datetime, glob, json, os, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEEP = ["year","name","producer","sub","region","country","type","style","size","qty","buy","value",
        "parker","altScore","altShort","altCritic","from","to","winPref","waFrom","waTo","waReviewer",
        "waDate","waSummary","waUrl","place","loc","myNote","valuedAt","prof"]
VKEEP = ["order","name","producer","region","country","type","match","sbLatest","sbLabel","sbUrl",
         "sbPrice","ackYear","notProduced"]

def load_dir(d):
    out = []
    for f in sorted(glob.glob(os.path.join(d, "*.json"))):
        doc = json.load(open(f, encoding="utf-8"))
        doc["id"] = doc.get("id") or os.path.splitext(os.path.basename(f))[0]
        out.append(doc)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wines", required=True); ap.add_argument("--verticals", required=True)
    ap.add_argument("--mobile", required=True); ap.add_argument("--run"); ap.add_argument("--out", default=".")
    a = ap.parse_args()
    mobile = json.load(open(a.mobile, encoding="utf-8")); mobile = mobile.get("data", mobile)
    key = base64.b64decode(mobile["key"]); assert len(key) == 32, "nyckeln ska vara 32 byte"
    run = {}
    if a.run and os.path.exists(a.run):
        run = json.load(open(a.run, encoding="utf-8")); run = run.get("data", run)
    wines = [{k: w[k] for k in ["id"] + KEEP if k in w and w[k] is not None} for w in load_dir(a.wines)]
    verts = [{k: v[k] for k in ["id"] + VKEEP if k in v and v[k] is not None} for v in load_dir(a.verticals)]
    verts.sort(key=lambda v: v.get("order", 99))
    snap = {"generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "lastRun": run.get("lastRun"), "wines": wines, "verticals": verts,
            "importedOps": mobile.get("importedOps", [])[-500:]}
    iv = os.urandom(12)
    ct = AESGCM(key).encrypt(iv, json.dumps(snap, ensure_ascii=False).encode("utf-8"), None)
    enc = {"v": 1, "iv": base64.b64encode(iv).decode(), "ct": base64.b64encode(ct).decode(),
           "generatedAt": snap["generatedAt"]}
    json.dump(enc, open(os.path.join(a.out, "data.enc"), "w"))
    json.dump(mobile["wrap"], open(os.path.join(a.out, "wrap.json"), "w"))
    print(f"data.enc: {len(wines)} viner, {len(verts)} vertikaler, {sum(w.get('qty',0) for w in wines)} flaskor")

if __name__ == "__main__":
    sys.exit(main())

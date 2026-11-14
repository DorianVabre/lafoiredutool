"""Build the static routing asset from matching Dofus 3 exports.

Usage: python scripts/build-travel-data.py GRAPH_JSON METADATA_DIR
METADATA_DIR contains mapsinformationdata, waypointsdata, subareasdata,
worldmapsdata JSON exports and i18n_fr.json from ledouxm/dofus-sqlite.
GRAPH_JSON is the world/graph export of D3B's data-12.pack (3.7.13.17).
Unknown conditions and ambiguous zaap arrival zones are excluded.
"""
import collections
import hashlib
import json
import pathlib
import sys

graph_path, metadata_dir = map(pathlib.Path, sys.argv[1:])
graph = json.loads(graph_path.read_text(encoding="utf-8"))
assert graph["info"]["ClientVersion"] == "3.7.13.17", "Use matching metadata and a new versioned asset for another build."


def rows(name):
    return [r["data"] for r in json.loads((metadata_dir / (name + ".json")).read_text(encoding="utf-8"))["references"]["RefIds"]]


maps = {m["id"]: m for m in rows("mapsinformationdata")}
texts = json.loads((metadata_dir / "i18n_fr.json").read_text(encoding="utf-8"))
subareas = {s["id"]: texts.get(str(s["nameId"]), "Zone inconnue") for s in rows("subareasdata")}
worlds = {w["id"]: texts.get(str(w["nameId"]), "Monde " + str(w["id"])) for w in rows("worldmapsdata")}
nodes, by_map = [], collections.defaultdict(list)
for i, v in enumerate(graph["vertices"]):
    m = maps[v["MapId"]]
    nodes.append([v["MapId"], v["Zone"], m["worldMap"], m["posX"], m["posY"], m["subAreaId"]])
    by_map[v["MapId"]].append(i)
links, interactive = [], []
for e in graph["edges"]:
    if not nodes[e["From"]][0] or not nodes[e["To"]][0]:
        continue
    ts = [t for t in graph["transitions"][e["FirstTransition"]:e["FirstTransition"] + e["TransitionCount"]] if t["CriterionId"] == -1]
    if not ts:
        continue
    links.extend([e["From"], e["To"]])
    if all(t["Type"] == 32 for t in ts):
        interactive.extend([e["From"], e["To"]])
zaaps = []
for w in rows("waypointsdata"):
    candidates = by_map[w["mapId"]]
    if w["activated"] and len(candidates) == 1:
        zaaps.append({"node": candidates[0], "name": subareas.get(w["subAreaId"], "Zaap")})
zaaps.sort(key=lambda z: (z["name"].casefold(), z["node"]))
data = {
    "schema": 1, "version": "3.7.13.17", "date": "2026-11-03",
    "sourceGraphSha256": hashlib.sha256(graph_path.read_bytes()).hexdigest(),
    "policy": "unconditional-transitions-single-zone-zaaps",
    "excludedActiveZaaps": 2, "nodes": nodes, "links": links,
    "interactive": interactive, "zaaps": zaaps,
    "areas": {str(k): v for k, v in subareas.items() if any(n[5] == k for n in nodes)},
    "worlds": {str(k): v for k, v in worlds.items() if any(n[2] == k for n in nodes)}
}
out = pathlib.Path(__file__).resolve().parents[1] / "data" / "trajets-3.7.13.17.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
out.with_suffix('.js').write_text('globalThis.LAFOIRE_TRAVEL_DATA=' + out.read_text(encoding="utf-8") + ';\n', encoding="utf-8")
print(f"{out.name}: {len(nodes)} zones, {len(links)//2} liens, {len(zaaps)} zaaps, {out.stat().st_size} octets")

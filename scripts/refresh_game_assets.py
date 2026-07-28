#!/usr/bin/env python3
"""Refresh Nuclear Option asset identifiers from the locally installed game.

The game stores its built-in missions and exported reference tables as TextAsset
objects in NuclearOption_Data/resources.assets.  Built-in mission JSON is the
most reliable source for the exact identifiers accepted by the mission editor.

Requires:
    python -m pip install UnityPy
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import UnityPy
from UnityPy import config as unity_config


APP_ID = "2168680"
UNITY_VERSION_PATTERN = re.compile(rb"(?:20\d{2}|6000)\.\d+\.\d+[a-z]\d+")
MISSION_CATEGORIES = (
    "aircraft",
    "vehicles",
    "ships",
    "buildings",
    "containers",
    "missiles",
    "scenery",
)

# Recent assets can appear in built-in missions before the game's exported
# UnitValues/UnitParts reference tables are regenerated.
CURRENT_LABELS = {
    "CAS1": "A-19 Brawler",
    "UtilityHelo1": "UH-90 Ibis",
    "VTOLTrainer1": "Alkyon AB-4",
    "FastBomber1": "SFB-81 Darkreach (legacy identifier)",
    "CRAMTrailer1": "CRAM Trailer",
    "HLT-FC": "HLT Fire Control Truck",
    "HLT-MART": "HLT Mobile Artillery",
    "LaserTrailer1": "Laser CIWS Trailer",
    "Truck2-CRAM": "MSV CRAM",
    "Truck2-FC": "MSV Fire Control",
    "Truck2-FT": "MSV Fuel Tanker",
    "Truck2-L": "MSV Flatbed",
    "Truck2-LADS": "MSV Laser Air Defence",
    "Truck2-M": "MSV Munitions Truck",
    "Truck2-MLRS": "MSV MLRS",
    "Truck2-MRAP": "MSV MRAP",
    "Truck2-R": "MSV Radar Truck",
    "Truck2-RSAM": "MSV Stratolance",
    "Truck2-T": "MSV Tractor",
    "Truck2-TBM": "MSV Ballistic Missile Launcher",
    "Truck2-TBM-N": "MSV Nuclear Ballistic Missile Launcher",
    "UGV1_SAM": "Hexhound SAM",
    "UGV1_grenade": "Hexhound GMG",
    "UGVDozer1": "M12 Jackknife",
    "Frigate1": "Argus Class Frigate",
    "SmallCarrier1": "Cursor Class LFD",
    "PatrolBoat1": "Surf Class Patrol Boat",
    "Emplacement1_23mm": "Static 23mm AAA Emplacement",
    "Emplacement1_ATGM": "Static ATGM Emplacement",
    "Emplacement1_MANPADS": "Static MANPADS Emplacement",
    "Emplacement1_MG": "Static Machine Gun Emplacement",
    "ammoDump": "Ammo Dump",
    "ammunitionBunker": "Ammunition Bunker",
    "fuelTank1": "Fuel Tank",
    "gabionBunker1": "Gabion Bunker",
    "guardTower1": "Guard Tower",
    "revetment1": "Aircraft Revetment",
    "FuelContainer3": "Fuel Container",
    "MunitionsContainer1": "Munitions Container",
    "MunitionsPallet1": "Munitions Pallet",
}

LEGACY_IDENTIFIERS = {"FastBomber1"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--install-path",
        type=Path,
        default=Path(r"C:\Program Files (x86)\Steam\steamapps\common\Nuclear Option"),
        help="Nuclear Option installation directory",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "game_assets.json",
        help="Destination JSON file",
    )
    return parser.parse_args()


def read_text_assets(resources_path: Path, unity_version: str) -> dict[str, str]:
    unity_config.FALLBACK_UNITY_VERSION = unity_version
    environment = UnityPy.load(str(resources_path))
    assets: dict[str, str] = {}
    for obj in environment.objects:
        if obj.type.name != "TextAsset":
            continue
        data = obj.read()
        script = data.m_Script
        if isinstance(script, bytes):
            script = script.decode("utf-8-sig")
        assets[data.m_Name] = script
    return assets


def detect_unity_version(game_data_path: Path) -> str:
    matches = UNITY_VERSION_PATTERN.findall(
        (game_data_path / "globalgamemanagers").read_bytes()
    )
    if not matches:
        raise RuntimeError("Could not determine the installed game's Unity version")
    return matches[-1].decode("ascii")


def parse_steam_manifest(install_path: Path) -> dict[str, str]:
    manifest_path = install_path.parents[1] / f"appmanifest_{APP_ID}.acf"
    if not manifest_path.exists():
        return {}
    text = manifest_path.read_text(encoding="utf-8", errors="replace")
    return {
        key: match.group(1)
        for key in ("buildid", "LastUpdated")
        if (match := re.search(rf'"{key}"\s+"([^"]+)"', text))
    }


def parse_semicolon_table(raw: str) -> tuple[str, list[dict[str, str]]]:
    lines = [line.strip() for line in raw.splitlines() if line.strip()]
    if len(lines) < 2:
        return "", []
    version_match = re.search(r"Version\s+([^;]+)", lines[0])
    headers = [value.strip() for value in lines[1].split(";")]
    rows = []
    for line in lines[2:]:
        values = [value.strip() for value in line.split(";")]
        rows.append(
            {
                header: values[index] if index < len(values) else ""
                for index, header in enumerate(headers)
            }
        )
    return version_match.group(1).strip() if version_match else "", rows


def build_reference_labels(text_assets: dict[str, str]) -> tuple[dict[str, str], str]:
    unit_values_version, unit_values = parse_semicolon_table(text_assets["UnitValues"])
    _, unit_parts = parse_semicolon_table(text_assets["UnitParts"])
    labels: dict[str, str] = {}
    for row in unit_parts:
        internal_type = row.get("Part", "")
        unit_name = row.get("UnitName", "")
        if internal_type and unit_name and internal_type not in labels:
            labels[internal_type] = unit_name

    # UnitValues contains munitions that do not occur as top-level mission units.
    for row in unit_values:
        internal_type = row.get("Code", "")
        unit_name = row.get("UnitName", "")
        if internal_type and unit_name:
            labels.setdefault(internal_type, unit_name)
    labels.update(CURRENT_LABELS)
    return labels, unit_values_version


def mission_documents(text_assets: dict[str, str]) -> dict[str, dict[str, Any]]:
    missions = {}
    for name, raw in text_assets.items():
        if not raw.lstrip().startswith("{"):
            continue
        try:
            document = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if any(category in document for category in MISSION_CATEGORIES):
            missions[name] = document
    return missions


def representative_aircraft_templates(
    missions: dict[str, dict[str, Any]]
) -> dict[str, dict[str, Any]]:
    templates: dict[str, dict[str, Any]] = {}
    fields = (
        "loadout",
        "savedLoadout",
        "livery",
        "liveryType",
        "liveryName",
        "fuel",
        "skill",
        "bravery",
        "startingSpeed",
    )
    for mission_name in sorted(missions):
        for aircraft in missions[mission_name].get("aircraft", []) or []:
            internal_type = aircraft.get("type")
            if not internal_type or internal_type in templates:
                continue
            template = {
                field: aircraft[field] for field in fields if field in aircraft
            }
            selected = template.get("savedLoadout", {}).get("Selected", [])
            if selected:
                template["sourceMission"] = mission_name
                templates[internal_type] = template
    return templates


def category_entries(
    missions: dict[str, dict[str, Any]], labels: dict[str, str]
) -> dict[str, list[dict[str, Any]]]:
    uses: dict[str, dict[str, set[str]]] = {
        category: defaultdict(set) for category in MISSION_CATEGORIES
    }
    for mission_name, mission in missions.items():
        for category in MISSION_CATEGORIES:
            for unit in mission.get(category, []) or []:
                if isinstance(unit, dict) and unit.get("type"):
                    uses[category][unit["type"]].add(mission_name)

    output = {}
    for category in MISSION_CATEGORIES:
        output[category] = [
            {
                "type": internal_type,
                "label": labels.get(internal_type, internal_type),
                "legacy": internal_type in LEGACY_IDENTIFIERS,
                "usedByBuiltInMissionCount": len(mission_names),
            }
            for internal_type, mission_names in sorted(uses[category].items())
        ]
    return output


def weapon_mount_entries(
    raw: str, missions: dict[str, dict[str, Any]]
) -> list[dict[str, Any]]:
    _, rows = parse_semicolon_table(raw)
    entries_by_type = {}
    for row in rows:
        internal_type = row.get("Name", "")
        if not internal_type:
            continue
        entries_by_type[internal_type] = {
            "type": internal_type,
            "label": row.get("Display Name", "") or internal_type,
            "weapon": row.get("WeaponName", ""),
            "ammo": int(float(row["Ammo"])) if row.get("Ammo") else 0,
            "source": "MountValues",
        }

    # The game's embedded MountValues export currently lags the executable.
    # Include every textual mount reference used by current built-in missions so
    # newly introduced loadouts are not lost while waiting for a fresh export.
    for mission in missions.values():
        for aircraft in mission.get("aircraft", []) or []:
            for selected in aircraft.get("savedLoadout", {}).get("Selected", []) or []:
                internal_type = selected.get("Key", "")
                if internal_type and internal_type not in entries_by_type:
                    entries_by_type[internal_type] = {
                        "type": internal_type,
                        "label": internal_type,
                        "weapon": "",
                        "ammo": None,
                        "source": "built-in mission loadout",
                    }
    return [entries_by_type[key] for key in sorted(entries_by_type)]


def build_presets(categories: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    aircraft_types = [
        entry["type"] for entry in categories["aircraft"] if not entry["legacy"]
    ]
    return {
        "defaultFactionSupplies": [
            {"unitType": internal_type, "count": 12}
            for internal_type in aircraft_types
        ],
        "factoryProductionTypes": aircraft_types,
        "airPatrolTypes": {
            "helicopters": ["AttackHelo1", "UtilityHelo1"],
            "fixedWing": [
                "SmallFighter1",
                "Multirole1",
                "CAS1",
                "Fighter1",
                "VTOLTrainer1",
            ],
        },
        "objectiveProfiles": {
            "armor": [
                "MBT1",
                "MBT",
                "Linebreaker_IFV",
                "AFV8_IFV",
                "6x6_1_IFV",
                "AFV8_APC",
            ],
            "air-defense": [
                "RadarSAM1",
                "SAMTrailer1",
                "Truck2-RSAM",
                "SPAAG1",
                "SPAAG2",
                "AFV8_SAM",
                "Linebreaker_SAM",
                "Truck2-LADS",
                "CRAMTrailer1",
            ],
            "artillery": [
                "HLT-MART",
                "Truck2-MLRS",
                "Truck2-FT",
                "UGV1_grenade",
            ],
            "mixed": [
                "MBT1",
                "MBT",
                "Linebreaker_IFV",
                "AFV8_IFV",
                "RadarSAM1",
                "Truck2-RSAM",
                "SPAAG2",
                "HLT-MART",
                "Truck2-MLRS",
                "AFV8_APC",
            ],
        },
        "groundForcePools": {
            "armor": ["MBT1", "MBT"],
            "mechanized": [
                "AFV8_IFV",
                "Linebreaker_IFV",
                "6x6_1_IFV",
                "AFV8_APC",
                "Linebreaker_APC",
                "6x6_1_APC",
                "Truck2-MRAP",
                "UGV1_grenade",
            ],
            "antiArmor": ["LightTruck1_AT", "6x6_1_AT"],
            "antiAirArtillery": [
                "SPAAG1",
                "SPAAG2",
                "6x6_1_AA",
                "LightTruck1_AA",
            ],
            "shortRangeSam": ["AFV8_SAM", "Linebreaker_SAM", "UGV1_SAM"],
            "mediumRangeSam": ["RadarSAM1", "SAMTrailer1", "Truck2-RSAM"],
            "pointDefense": [
                "CRAMTrailer1",
                "Truck2-CRAM",
                "LaserTrailer1",
                "Truck2-LADS",
            ],
            "artillery": [
                "HLT-MART",
                "Truck2-MLRS",
            ],
            "logistics": [
                "HLT-FC",
                "HLT-FT",
                "HLT-L",
                "HLT-M",
                "HLT-R",
                "HLT-T",
                "Truck2-FC",
                "Truck2-FT",
                "Truck2-L",
                "Truck2-M",
                "Truck2-R",
                "Truck2-T",
                "UGVDozer1",
            ],
        },
    }


def main() -> None:
    args = parse_args()
    install_path = args.install_path.resolve()
    game_data_path = install_path / "NuclearOption_Data"
    resources_path = game_data_path / "resources.assets"
    if not resources_path.exists():
        raise SystemExit(f"Nuclear Option resources not found: {resources_path}")

    unity_version = detect_unity_version(game_data_path)
    text_assets = read_text_assets(resources_path, unity_version)
    required = {"UnitValues", "UnitParts", "MountValues"}
    missing = required.difference(text_assets)
    if missing:
        raise SystemExit(f"Missing required game TextAssets: {sorted(missing)}")

    labels, unit_values_version = build_reference_labels(text_assets)
    missions = mission_documents(text_assets)
    categories = category_entries(missions, labels)
    manifest = parse_steam_manifest(install_path)
    build_hash_path = install_path / "build-hash.txt"

    output = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "method": "installed-game TextAssets: built-in missions, UnitValues, UnitParts, MountValues",
            "steamBuildId": manifest.get("buildid", ""),
            "gameBuildHash": (
                build_hash_path.read_text(encoding="utf-8").strip()
                if build_hash_path.exists()
                else ""
            ),
            "unityVersion": unity_version,
            "unitValuesVersion": unit_values_version,
            "builtInMissionCount": len(missions),
            "builtInMissions": sorted(missions),
            "notes": [
                "Mission JSON identifiers are authoritative for scenario export.",
                "The embedded UnitValues table can lag the executable; current labels fill those gaps.",
                "FastBomber1 is retained as a legacy SFB-81 Darkreach identifier but is not used for new supplies.",
            ],
        },
        "categories": categories,
        "weaponMounts": weapon_mount_entries(text_assets["MountValues"], missions),
        "aircraftTemplates": representative_aircraft_templates(missions),
        "presets": build_presets(categories),
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    counts = ", ".join(
        f"{category}={len(entries)}"
        for category, entries in categories.items()
    )
    print(f"Wrote {args.output}")
    print(f"Steam build {manifest.get('buildid', 'unknown')}; {counts}")


if __name__ == "__main__":
    main()

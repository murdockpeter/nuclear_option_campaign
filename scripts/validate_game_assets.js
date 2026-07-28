const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assetPath = path.join(root, "data", "game_assets.json");
const assets = JSON.parse(fs.readFileSync(assetPath, "utf8"));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(assets.schemaVersion === 1, "Unsupported game asset schema");
assert(assets.source?.steamBuildId, "Missing Steam build provenance");
assert(assets.source?.builtInMissionCount >= 39, "Built-in mission scan is incomplete");

const categoryTypes = {};
for (const [category, entries] of Object.entries(assets.categories || {})) {
  const types = entries.map((entry) => entry.type);
  assert(types.length === new Set(types).size, `Duplicate ${category} identifiers`);
  assert(entries.every((entry) => entry.type && entry.label), `Incomplete ${category} entry`);
  categoryTypes[category] = new Set(types);
}

for (const entry of assets.presets.defaultFactionSupplies || []) {
  assert(categoryTypes.aircraft.has(entry.unitType), `Unknown supply aircraft: ${entry.unitType}`);
  const metadata = assets.categories.aircraft.find((aircraft) => aircraft.type === entry.unitType);
  assert(!metadata.legacy, `Legacy aircraft used in current supplies: ${entry.unitType}`);
}

for (const entry of assets.categories.aircraft || []) {
  assert(assets.aircraftTemplates[entry.type]?.savedLoadout, `Missing aircraft template: ${entry.type}`);
}

const weaponMountTypes = (assets.weaponMounts || []).map((entry) => entry.type);
assert(weaponMountTypes.length === new Set(weaponMountTypes).size, "Duplicate weapon mount identifiers");
assert(weaponMountTypes.length >= 173, "Weapon mount scan is incomplete");

for (const type of assets.presets.factoryProductionTypes || []) {
  assert(categoryTypes.aircraft.has(type), `Unknown factory aircraft: ${type}`);
}

for (const types of Object.values(assets.presets.airPatrolTypes || {})) {
  for (const type of types) {
    assert(categoryTypes.aircraft.has(type), `Unknown patrol aircraft: ${type}`);
    assert(assets.aircraftTemplates[type]?.savedLoadout, `Missing patrol template: ${type}`);
  }
}

for (const [profile, types] of Object.entries(assets.presets.objectiveProfiles || {})) {
  for (const type of types) {
    assert(categoryTypes.vehicles.has(type), `Unknown ${profile} vehicle: ${type}`);
  }
}

const groundForcePools = assets.presets.groundForcePools || {};
const requiredGroundRoles = [
  "armor",
  "mechanized",
  "antiArmor",
  "antiAirArtillery",
  "shortRangeSam",
  "mediumRangeSam",
  "pointDefense",
  "artillery",
  "logistics"
];
for (const role of requiredGroundRoles) {
  const types = groundForcePools[role] || [];
  assert(types.length >= 2, `Ground-force role needs more diversity: ${role}`);
  assert(types.length === new Set(types).size, `Duplicate vehicle in ground-force role: ${role}`);
  for (const type of types) {
    assert(categoryTypes.vehicles.has(type), `Unknown ${role} vehicle: ${type}`);
  }
}

const pooledGroundTypes = new Set(Object.values(groundForcePools).flat());
assert(pooledGroundTypes.size >= 30, "Ground-force pools do not provide enough overall diversity");

const requiredCurrentAssets = {
  aircraft: ["VTOLTrainer1"],
  vehicles: ["HLT-MART", "Truck2-MLRS", "UGVDozer1"],
  ships: ["Frigate1", "SmallCarrier1", "PatrolBoat1"],
  buildings: ["Emplacement1_ATGM", "ammoDump"]
};

for (const [category, types] of Object.entries(requiredCurrentAssets)) {
  for (const type of types) {
    assert(categoryTypes[category].has(type), `Current asset missing: ${category}/${type}`);
  }
}

for (const type of ["HLT-MART", "Truck2-MLRS", "UGVDozer1"]) {
  assert(pooledGroundTypes.has(type), `Current ground asset is not used by generation pools: ${type}`);
}

console.log(
  `Validated Nuclear Option asset catalog for Steam build ${assets.source.steamBuildId}: ` +
    Object.entries(assets.categories)
      .map(([category, entries]) => `${category}=${entries.length}`)
      .join(", ")
);

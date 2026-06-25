const fs = require("fs");
const path = require("path");
const os = require("os");

const DEFAULT_PATHS = {
  installPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Nuclear Option",
  missionsPath: path.join(
    os.homedir(),
    "AppData",
    "LocalLow",
    "Shockfront",
    "NuclearOption",
    "Missions"
  ),
  tempMissionsPath: path.join(
    os.homedir(),
    "AppData",
    "LocalLow",
    "Shockfront",
    "NuclearOption",
    "TempMissions"
  )
};

const CUSTOM_ANCHORS_PATH = path.join(process.cwd(), "data", "map-anchors.json");
const HEARTLAND_PIXEL_LOCATIONS_PATH = path.join(process.cwd(), "data", "heartland_pixel_locations.csv");
const CAMPAIGN_STATE_PATH = path.join(process.cwd(), "data", "campaign_state.json");
const HEARTLAND_LOCATION_HEADERS = [
  "map_key",
  "name",
  "pixel_x",
  "pixel_y",
  "ui_left_percent",
  "ui_top_percent",
  "game_world_x",
  "game_world_z",
  "initial_owner",
  "notes"
];

const MAP_PRESETS = {
  Terrain1: {
    key: "Terrain1",
    label: "Heartland",
    bounds: { minX: -36000, maxX: 36000, minZ: -36000, maxZ: 36000 },
    pixelSize: { width: 3000, height: 3000 },
    imagePath: "../images/Heartland_Color_3000x3000.png",
    airfields: [
      { id: "airbase-a1", name: "Northwest Airbase", x: -24000, z: 25000, faction: "Primeva", ui: { left: 23, top: 23 } },
      { id: "airbase-c3", name: "Western Volcano Field", x: -12500, z: 9000, faction: "Primeva", ui: { left: 33, top: 40 } },
      { id: "airbase-d5", name: "Central Gulf Airbase", x: 2000, z: 7000, faction: "Primeva", ui: { left: 60, top: 41 } },
      { id: "airbase-e6", name: "Desert Forward Strip", x: 15000, z: -2000, faction: "Boscali", ui: { left: 80, top: 47 } },
      { id: "airbase-g4", name: "Southern Interior Base", x: 6000, z: -23000, faction: "Boscali", ui: { left: 57, top: 78 } }
    ]
  },
  IgnusArchipelago: {
    key: "IgnusArchipelago",
    label: "Ignus Archipelago",
    bounds: { minX: -32000, maxX: 32000, minZ: -32000, maxZ: 32000 },
    imagePath: "../images/Ignus.png",
    airfields: [
      { id: "harmony-sands", name: "Harmony Sands", x: -29000, z: 27000, faction: "Primeva", ui: { left: 4.5, top: 6.5 } },
      { id: "bifurca", name: "Bifurca Airport", x: -14000, z: 12000, faction: "Primeva", ui: { left: 29, top: 31 } },
      { id: "hogshead", name: "Hogshead Airbase", x: -3000, z: 23000, faction: "Primeva", ui: { left: 43, top: 11 } },
      { id: "feldspar", name: "Feldspar International Airport", x: 2500, z: 7000, faction: "Primeva", ui: { left: 51, top: 35 } },
      { id: "opal", name: "Opal Airport", x: 17000, z: 1000, faction: "Boscali", ui: { left: 77, top: 44 } },
      { id: "cliffline", name: "Cliffline Airbase", x: 25000, z: 22000, faction: "Boscali", ui: { left: 89, top: 12 } },
      { id: "ashwood-aux", name: "Ashwood Auxiliary Airstrip", x: 21000, z: -22000, faction: "Boscali", ui: { left: 84, top: 79 } },
      { id: "ashwood", name: "Ashwood Airbase", x: 28500, z: -23000, faction: "Boscali", ui: { left: 95, top: 75 } },
      { id: "broken-atoll", name: "Broken Atoll", x: -26000, z: -25000, faction: "Primeva", ui: { left: 6, top: 82 } }
    ]
  }
};

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function writeDataUrlFile(filePath, dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    return false;
  }

  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    return false;
  }

  const buffer = Buffer.from(match[2], "base64");
  fs.writeFileSync(filePath, buffer);
  return true;
}

function writeCsv(filePath, rows) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => row[header] ?? "").join(","))
  ];

  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function applyHeaders(rows, headers) {
  return rows.map((row) => {
    const normalized = {};
    for (const header of headers) {
      normalized[header] = row[header] ?? "";
    }
    return normalized;
  });
}

function loadHeartlandPixelLookup() {
  if (!safeExists(HEARTLAND_PIXEL_LOCATIONS_PATH)) {
    return {};
  }

  try {
    const rows = parseCsv(fs.readFileSync(HEARTLAND_PIXEL_LOCATIONS_PATH, "utf8"));
    return Object.fromEntries(
      rows
        .filter((row) => row.map_key === "Terrain1" && row.name && row.pixel_x && row.pixel_y)
        .map((row) => [
          normalizeLocationKey(row.name),
          {
            pixelX: Number(row.pixel_x),
            pixelY: Number(row.pixel_y),
            left: Number(row.ui_left_percent),
            top: Number(row.ui_top_percent)
          }
        ])
    );
  } catch {
    return {};
  }
}

function loadConfiguredLocationsByMap() {
  const output = {};

  if (safeExists(HEARTLAND_PIXEL_LOCATIONS_PATH)) {
    const rows = parseCsv(fs.readFileSync(HEARTLAND_PIXEL_LOCATIONS_PATH, "utf8"))
      .filter((row) => row.map_key && row.name)
      .map((row) => ({
        mapKey: row.map_key,
        name: row.name,
        pixelX: Number(row.pixel_x || 0),
        pixelY: Number(row.pixel_y || 0),
        uiLeftPercent: Number(row.ui_left_percent || 0),
        uiTopPercent: Number(row.ui_top_percent || 0),
        gameWorldX: row.game_world_x === "" ? null : Number(row.game_world_x),
        gameWorldZ: row.game_world_z === "" ? null : Number(row.game_world_z),
        initialOwner: row.initial_owner || "",
        notes: row.notes || ""
      }));

    for (const row of rows) {
      if (!output[row.mapKey]) {
        output[row.mapKey] = [];
      }
      output[row.mapKey].push(row);
    }
  }

  return output;
}

const HEARTLAND_PIXEL_LOOKUP = loadHeartlandPixelLookup();

const LOCATION_UI_LOOKUPS = {
  Terrain1: HEARTLAND_PIXEL_LOOKUP,
  IgnusArchipelago: {
    "harmony sands": { left: 4.5, top: 6.5 },
    "bifurca airport": { left: 29, top: 31 },
    "hogshead airbase": { left: 43, top: 11 },
    "feldspar international airport": { left: 51, top: 35 },
    "opal airport": { left: 77, top: 44 },
    "cliffline airbase": { left: 89, top: 12 },
    "ashwood auxiliary airstrip": { left: 84, top: 79 },
    "ashwood airbase": { left: 95, top: 75 },
    "broken atoll": { left: 6, top: 82 }
  }
};

function normalizeLocationKey(value) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function loadCustomAnchors() {
  if (!safeExists(CUSTOM_ANCHORS_PATH)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(CUSTOM_ANCHORS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function getCustomLocationUi(customAnchors, mapKey, ...candidates) {
  const lookup = customAnchors?.[mapKey];
  if (!lookup) {
    return null;
  }

  for (const candidate of candidates) {
    const key = normalizeLocationKey(candidate);
    if (key && lookup[key]) {
      return lookup[key];
    }
  }

  return null;
}

function resolveLocationUi(mapKey, ...candidates) {
  const lookup = LOCATION_UI_LOOKUPS[mapKey];
  if (!lookup) {
    return null;
  }

  for (const candidate of candidates) {
    const key = normalizeLocationKey(candidate);
    if (key && lookup[key]) {
      return lookup[key];
    }
  }

  return null;
}

function safeExists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function readJsonIfExists(filePath, fallback = null) {
  if (!safeExists(filePath)) {
    return fallback;
  }

  return readJson(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listMissionFolders(basePath) {
  if (!safeExists(basePath)) {
    return [];
  }

  return fs
    .readdirSync(basePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(basePath, entry.name));
}

function missionDescriptor(folderPath) {
  const folderName = path.basename(folderPath);
  const metaPath = path.join(folderPath, "meta.json");
  const missionJsonPath = path.join(folderPath, `${folderName}.json`);

  const descriptor = {
    folderName,
    folderPath,
    metaPath,
    missionJsonPath,
    hasMeta: safeExists(metaPath),
    hasMissionJson: safeExists(missionJsonPath)
  };

  if (!descriptor.hasMissionJson) {
    return { ...descriptor, status: "missing-json" };
  }

  try {
    const mission = readJson(missionJsonPath);
    const meta = descriptor.hasMeta ? readJson(metaPath) : null;
    const mapPath = mission?.MapKey?.Path || "Terrain1";
    const preset = MAP_PRESETS[mapPath] || MAP_PRESETS.Terrain1;
    const factionNames = Array.from(
      new Set([
        ...(mission.factions || []).map((faction) => faction.factionName).filter(Boolean),
        ...(mission.airbases || []).map((airbase) => airbase.faction).filter(Boolean),
        ...(mission.vehicles || []).map((vehicle) => vehicle.faction).filter(Boolean),
        ...(mission.aircraft || []).map((aircraft) => aircraft.faction).filter(Boolean)
      ])
    );

    const airbases = (mission.airbases || []).map((airbase) => ({
      id: airbase.UniqueName || airbase.DisplayName,
      name: airbase.DisplayName || airbase.UniqueName,
      faction: airbase.faction || "",
      x: airbase.SelectionPosition?.x ?? airbase.Center?.x ?? 0,
      y: airbase.SelectionPosition?.y ?? airbase.Center?.y ?? 0,
      z: airbase.SelectionPosition?.z ?? airbase.Center?.z ?? 0,
      ui: resolveLocationUi(
        mapPath,
        airbase.DisplayName,
        airbase.UniqueName
      )
    }));

    const scenarioStartAirfields = inferScenarioStartAirfields(mission, mapPath);

    return {
      ...descriptor,
      status: "ok",
      missionName: mission.Name || meta?.FileName || folderName,
      meta,
      mission,
      summary: {
        description: mission?.missionSettings?.description || "",
        mapKey: mapPath,
        mapLabel: preset.label,
        factions: factionNames.length ? factionNames : ["Boscali", "Primeva"],
        airbases: airbases.length ? airbases : preset.airfields,
        scenarioStartAirfields,
        counts: {
          aircraft: (mission.aircraft || []).length,
          vehicles: (mission.vehicles || []).length,
          ships: (mission.ships || []).length,
          buildings: (mission.buildings || []).length,
          objectives: (mission.objectives?.Objectives || []).length
        }
      }
    };
  } catch (error) {
    return {
      ...descriptor,
      status: "invalid-json",
      error: error.message
    };
  }
}

function inferScenarioStartAirfields(mission, mapPath) {
  const preset = MAP_PRESETS[mapPath] || MAP_PRESETS.Terrain1;
  const airbases = ((mission.airbases || []).map((airbase) => ({
    id: airbase.UniqueName || airbase.DisplayName,
    name: airbase.DisplayName || airbase.UniqueName,
    faction: airbase.faction || "",
    x: airbase.SelectionPosition?.x ?? airbase.Center?.x ?? 0,
    y: airbase.SelectionPosition?.y ?? airbase.Center?.y ?? 0,
    z: airbase.SelectionPosition?.z ?? airbase.Center?.z ?? 0,
    ui: resolveLocationUi(mapPath, airbase.DisplayName, airbase.UniqueName)
  }))).concat((preset.airfields || []).filter((presetAirfield) => {
    return !(mission.airbases || []).some((airbase) => (airbase.UniqueName || airbase.DisplayName) === presetAirfield.id);
  }));

  const usage = new Map();
  for (const aircraft of mission.aircraft || []) {
    if (!airbases.length || !aircraft.globalPosition) {
      continue;
    }

    let best = null;
    for (const airbase of airbases) {
      const dx = (aircraft.globalPosition.x ?? 0) - airbase.x;
      const dz = (aircraft.globalPosition.z ?? 0) - airbase.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (!best || distance < best.distance) {
        best = { airbase, distance };
      }
    }

    if (best) {
      const key = best.airbase.id;
      const current = usage.get(key) || { ...best.airbase, scenarioCount: 0, aircraftCount: 0 };
      current.aircraftCount += 1;
      usage.set(key, current);
    }
  }

  return Array.from(usage.values());
}

function discoverInstallSummary(installPath) {
  const managedDll = path.join(
    installPath,
    "NuclearOption_Data",
    "Managed",
    "Assembly-CSharp.dll"
  );
  const globalManagers = path.join(installPath, "NuclearOption_Data", "globalgamemanagers");

  return {
    installPath,
    exists: safeExists(installPath),
    managedDllExists: safeExists(managedDll),
    globalManagersExists: safeExists(globalManagers),
    knownMaps: Object.values(MAP_PRESETS).map(({ key, label }) => ({ key, label })),
    inferredBuiltInScenarios: [
      "Convoy Attack",
      "Round Up",
      "Point Blank",
      "Cruise Missile Interception",
      "Furball",
      "Bridge Defense",
      "Blackout",
      "Infiltration",
      "Depot Strike",
      "Dustbowl",
      "Expedition",
      "Shifting Tide",
      "Reprisal",
      "To Sink a Carrier",
      "Escalation",
      "Domination",
      "Terminal Control"
    ]
  };
}

function buildCatalog(paths = DEFAULT_PATHS) {
  const customAnchors = loadCustomAnchors();
  const configuredLocationsByMap = loadConfiguredLocationsByMap();
  const userMissions = listMissionFolders(paths.missionsPath).map(missionDescriptor);
  const tempMissions = listMissionFolders(paths.tempMissionsPath).map(missionDescriptor);
  const missionMaps = new Map();

  for (const entry of [...userMissions, ...tempMissions]) {
    if (entry.status !== "ok") {
      continue;
    }
    const current = missionMaps.get(entry.summary.mapKey) || {
      ...(MAP_PRESETS[entry.summary.mapKey] || MAP_PRESETS.Terrain1),
      sourceMissions: [],
      scenarioStartUsage: new Map()
    };

    current.sourceMissions.push({
      name: entry.missionName,
      folderName: entry.folderName
    });

    for (const airbase of entry.summary.airbases) {
      if (!current.airfields.find((field) => field.id === airbase.id)) {
        current.airfields.push(airbase);
      }
    }

    for (const startAirfield of entry.summary.scenarioStartAirfields || []) {
      const existing = current.scenarioStartUsage.get(startAirfield.id) || {
        ...startAirfield,
        scenarioCount: 0,
        aircraftCount: 0
      };
      existing.scenarioCount += 1;
      existing.aircraftCount += startAirfield.aircraftCount || 0;
      current.scenarioStartUsage.set(startAirfield.id, existing);
    }

    missionMaps.set(entry.summary.mapKey, current);
  }

  for (const preset of Object.values(MAP_PRESETS)) {
    if (!missionMaps.has(preset.key)) {
      missionMaps.set(preset.key, { ...preset, sourceMissions: [], scenarioStartUsage: new Map() });
    }
  }

  return {
    scannedAt: new Date().toISOString(),
    paths,
    install: discoverInstallSummary(paths.installPath),
    userMissions,
    tempMissions,
    maps: Array.from(missionMaps.values()).map((map) => ({
      ...map,
      airfields: (() => {
        const scenarioStarts = Array.from(map.scenarioStartUsage.values());
        const baseList = scenarioStarts.length > 0 ? scenarioStarts : map.airfields;
        return baseList.map((airfield) => ({
          ...airfield,
          ui:
            getCustomLocationUi(customAnchors, map.key, airfield.name, airfield.id) ||
            airfield.ui ||
            resolveLocationUi(map.key, airfield.name, airfield.id)
        }));
      })(),
      scenarioStartAirfields: Array.from(map.scenarioStartUsage.values())
    })),
    factions: [
      { id: "Boscali", label: "Boscali", color: "#b64234" },
      { id: "Primeva", label: "Primeva", color: "#2b70b8" }
    ],
    configuredLocationsByMap,
    customAnchorsPath: CUSTOM_ANCHORS_PATH
  };
}

function sanitizeName(input) {
  return (input || "Untitled Campaign")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function replaceDirectory(sourcePath, targetPath) {
  ensureDir(path.dirname(targetPath));
  if (safeExists(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  fs.cpSync(sourcePath, targetPath, { recursive: true });
}

function buildGeneratedBriefing(payload) {
  const initialState = payload.initialState || {};
  const objective = initialState.objectiveLocation || {};
  const briefingLines = [
    `Start from: ${payload.parameters.startingAirbase}`,
    `Primary objective: ${objective.name || "Unspecified"}`,
    `Enemy profile: ${objective.profile || "Mixed"}`,
    `Expected resistance: ${objective.intensity || "Medium"}`
  ];

  const customDescription = (payload.parameters.description || "").trim();
  return [customDescription, briefingLines.join("\n")].filter(Boolean).join("\n\n");
}

function buildPrimaryObjective(payload) {
  const initialState = payload.initialState || {};
  const objective = initialState.objectiveLocation || {};
  const targetUnits = (initialState.ownershipVehicles || []).filter((vehicle) => {
    return vehicle.UniqueName?.startsWith(`objective_${sanitizeName(objective.name || "").replace(/\s+/g, "_").toLowerCase()}_`);
  });

  return {
    objective: {
      UniqueName: "Destroy_PrimaryObjective",
      Faction: payload.initialState?.startingAirbase?.owner || payload.initialState?.factions?.[0]?.factionName || "",
      DisplayName: `Neutralise ${objective.name || "Objective Area"}`,
      Hidden: false,
      Type: 1,
      TypeName: "DestroyUnits",
      Data: [
        {
          StringValue: "",
          FloatValue: 2,
          VectorValue: { x: 0, y: 0, z: 0 }
        },
        ...targetUnits.map((vehicle) => ({
          StringValue: vehicle.UniqueName,
          FloatValue: 0,
          VectorValue: { x: 0, y: 0, z: 0 }
        }))
      ],
      Outcomes: []
    },
    showMessage: {
      UniqueName: "ShowMissionBrief",
      Type: 3,
      TypeName: "ShowMessage",
      Data: [
        {
          StringValue: `Start from ${payload.parameters.startingAirbase}. Primary objective: ${objective.name || "Objective Area"}.`,
          FloatValue: 0,
          VectorValue: { x: 0, y: 0, z: 0 }
        },
        {
          StringValue: "",
          FloatValue: 1,
          VectorValue: { x: 0, y: 0, z: 0 }
        },
        {
          StringValue: "",
          FloatValue: 0,
          VectorValue: { x: 0, y: 0, z: 0 }
        }
      ],
      Outcomes: []
    }
  };
}

function buildLegacyFactionObjectives(payload) {
  const initialState = payload.initialState || {};
  const startingAirbase = initialState.startingAirbase || {};
  const objective = initialState.objectiveLocation || {};
  const objectiveName = objective.name || "Objective Area";
  const startName = payload.parameters.startingAirbase || startingAirbase.name || "Home Airbase";
  const startX = Number(startingAirbase.gameWorldX ?? startingAirbase.x ?? 0);
  const startY = Number(startingAirbase.gameWorldY ?? startingAirbase.y ?? 0);
  const startZ = Number(startingAirbase.gameWorldZ ?? startingAirbase.z ?? 0);
  const objectiveX = Number(objective.gameWorldX ?? 0);
  const objectiveY = Number(objective.gameWorldY ?? 0);
  const objectiveZ = Number(objective.gameWorldZ ?? 0);
  const ingressX = (startX + objectiveX) / 2;
  const ingressY = (startY + objectiveY) / 2;
  const ingressZ = (startZ + objectiveZ) / 2;
  const objectiveTargets = (initialState.ownershipVehicles || [])
    .filter((vehicle) => vehicle.UniqueName?.startsWith(`objective_${sanitizeName(objectiveName).replace(/\s+/g, "_").toLowerCase()}_`))
    .map((vehicle) => vehicle.UniqueName);

  return [
    {
      objectiveName: "Mission Start",
      message: `Start from ${startName}. Proceed toward ${objectiveName} and destroy the enemy concentration in the target area.`,
      positionTrigger: false,
      victoryObjective: false,
      nonSequentialObjective: false,
      triggerRange: 0,
      position: {
        x: 0,
        y: 0,
        z: 0
      },
      targetUnits: []
    },
    {
      objectiveName: "Ingress",
      message: `Proceed toward ${objectiveName}. This marker indicates the general axis of advance from ${startName}.`,
      positionTrigger: true,
      victoryObjective: false,
      nonSequentialObjective: false,
      triggerRange: 300,
      position: {
        x: ingressX,
        y: ingressY,
        z: ingressZ
      },
      targetUnits: []
    },
    {
      objectiveName,
      message: `${objectiveName} is the designated objective area. Expect ${objective.profile || "mixed"} resistance at ${objective.intensity || "medium"} intensity.`,
      positionTrigger: true,
      victoryObjective: false,
      nonSequentialObjective: false,
      triggerRange: 350,
      position: {
        x: objectiveX,
        y: objectiveY,
        z: objectiveZ
      },
      targetUnits: []
    },
    {
      objectiveName: `Destroy ${objectiveName}`,
      message: `${objectiveName} has been neutralised.`,
      positionTrigger: false,
      victoryObjective: true,
      nonSequentialObjective: false,
      triggerRange: 0,
      position: {
        x: objectiveX,
        y: objectiveY,
        z: objectiveZ
      },
      targetUnits: objectiveTargets
    }
  ];
}

function exportCampaign(payload) {
  const campaignName = sanitizeName(payload?.campaignName || payload?.missionName || "Untitled Campaign");
  const exportRoot = path.join(process.cwd(), "exports", campaignName);
  ensureDir(exportRoot);

  const campaign = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sourcePaths: payload.paths,
    campaignName,
    parameters: payload.parameters,
    initialState: payload.initialState
  };

  const campaignPath = path.join(exportRoot, "campaign.json");
  fs.writeFileSync(campaignPath, JSON.stringify(campaign, null, 2));

  const missionFolder = path.join(exportRoot, campaignName);
  ensureDir(missionFolder);
  const generatedBriefing = buildGeneratedBriefing(payload);
  const primaryObjectiveBundle = buildPrimaryObjective(payload);
  const factions = (payload.initialState?.factions || []).map((faction) => ({
    ...faction,
    supplies: Array.isArray(faction.supplies)
      ? faction.supplies
          .filter((supply) => supply?.unitType && supply.unitType !== "Revoker")
          .map((supply) => ({
            unitType: supply.unitType,
            count: Number(supply.count || 0)
          }))
      : [],
    objectives: Array.isArray(faction.objectives) ? faction.objectives : []
  }));

  const missionJson = {
    JsonVersion: 5,
    WorkshopId: 0,
    MapKey: {
      Type: 1,
      TypeName: "GameWorldPrefab",
      Path: payload.parameters.mapKey
    },
    missionSettings: {
      description: generatedBriefing || `${campaignName} generated by the Electron campaign tool.`,
      allowEventContent: false,
      Tags: [],
      playerMode: 0,
      allowRespawn: payload.parameters.allowRespawn,
      playerStartingRank: payload.parameters.startingRank,
      rankMultiplier: 1.0,
      successfulSortieBonus: 0.25,
      nuclearEscalationThreshold: 0.0,
      strategicEscalationThreshold: 0.0,
      minRankTacticalWarhead: 0,
      minRankStrategicWarhead: 0,
      cameraStartPosition: {
        IsOverride: false,
        Value: {
          Position: { x: 0, y: 0, z: 0 },
          Rotation: { x: 0, y: 0, z: 0, w: 1 }
        }
      },
      missionRoads: { roads: [] },
      missionSeaLanes: { roads: [] },
      wrecksMaxNumber: 0,
      wrecksDecayTime: 0
    },
    environment: {
      timeOfDay: payload.parameters.timeOfDay,
      timeFactor: 0,
      weatherIntensity: payload.parameters.weatherIntensity,
      cloudAltitude: 1800,
      windSpeed: 0,
      windTurbulence: 0,
      windHeading: 0,
      windRandomHeading: 0,
      moonPhase: 14
    },
    aircraft: payload.initialState?.aircraft || [],
    vehicles: [],
    ships: [],
    buildings: [],
    scenery: [],
    containers: [],
    missiles: [],
    pilots: [],
    factions,
    airbases: payload.initialState?.airbases || [],
    unitInventories: [],
    objectives: {
      Objectives: [
        {
          UniqueName: "Mission Start",
          Faction: "",
          DisplayName: "",
          Hidden: true,
          Type: 0,
          TypeName: "None",
          Data: [],
          Outcomes: ["ShowMissionBrief"]
        },
        primaryObjectiveBundle.objective
      ],
      Outcomes: [primaryObjectiveBundle.showMessage]
    }
  };

  missionJson.vehicles = payload.initialState?.ownershipVehicles || [];
  missionJson.buildings = payload.initialState?.targetBuildings || [];

  fs.writeFileSync(
    path.join(missionFolder, `${campaignName}.json`),
    JSON.stringify(missionJson, null, 2)
  );
  fs.writeFileSync(
    path.join(missionFolder, "meta.json"),
    JSON.stringify({ FileName: campaignName }, null, 2)
  );

  let briefingGraphicPath = null;
  if (payload?.briefingGraphic?.dataUrl) {
    const briefingFileName = sanitizeName(
      path.basename(payload.briefingGraphic.fileName || `${campaignName}_briefing`)
        .replace(/\.[^/.]+$/, "")
    );
    briefingGraphicPath = path.join(missionFolder, `${briefingFileName}.png`);
    writeDataUrlFile(briefingGraphicPath, payload.briefingGraphic.dataUrl);
  }

  let installedMissionFolder = null;
  let installed = false;
  let installError = null;
  const liveMissionsPath = payload?.paths?.missionsPath;

  if (liveMissionsPath) {
    try {
      ensureDir(liveMissionsPath);
      installedMissionFolder = path.join(liveMissionsPath, campaignName);
      replaceDirectory(missionFolder, installedMissionFolder);
      installed = true;
    } catch (error) {
      installError = error.message;
    }
  }

  const previousState = readJsonIfExists(CAMPAIGN_STATE_PATH, null);
  const previousMissionCount = Number(previousState?.missionCount || 0);
  const ownershipVehicles = payload.initialState?.ownershipVehicles || [];
  const persistedUnits = payload.initialState?.orderOfBattle?.units || previousState?.orderOfBattle?.units || [];
  const persistedBuildings = payload.initialState?.orderOfBattle?.buildings || previousState?.orderOfBattle?.buildings || [];
  const campaignState = {
    ...(previousState || {}),
    version: 1,
    campaignName,
    mapKey: payload.parameters.mapKey,
    mapLabel: payload.parameters.mapLabel,
    missionCount: previousMissionCount + 1,
    lastExportAt: new Date().toISOString(),
    parameters: payload.parameters,
    factions: payload.initialState?.factions || [],
    locations: (payload.initialState?.locations || []).map((location) => ({
      id: location.id,
      name: location.name,
      gameWorldX: location.gameWorldX ?? null,
      gameWorldY: location.gameWorldY ?? 0,
      gameWorldZ: location.gameWorldZ ?? null,
      owner: location.initialOwner || "Neutral",
      notes: location.notes || ""
    })),
    airbases: payload.initialState?.airbases || [],
    objective: payload.initialState?.objectiveLocation
      ? {
          name: payload.initialState.objectiveLocation.name,
          owner: payload.initialState.objectiveLocation.owner || "Neutral",
          gameWorldX: payload.initialState.objectiveLocation.gameWorldX ?? null,
          gameWorldY: payload.initialState.objectiveLocation.gameWorldY ?? 0,
          gameWorldZ: payload.initialState.objectiveLocation.gameWorldZ ?? null,
          profile: payload.initialState.objectiveLocation.profile || "mixed",
          intensity: payload.initialState.objectiveLocation.intensity || "Medium"
        }
      : previousState?.objective || null,
    orderOfBattle: {
      ...(previousState?.orderOfBattle || {}),
      units: persistedUnits,
      buildings: persistedBuildings,
      staticDefense: ownershipVehicles.filter((vehicle) => {
        return vehicle.UniqueName?.startsWith("baseline_") || vehicle.UniqueName?.startsWith("objective_");
      }),
      frontline: ownershipVehicles.filter((vehicle) => {
        return vehicle.UniqueName?.startsWith("frontline_action_") || vehicle.UniqueName?.startsWith("frontline_patrol_") || vehicle.UniqueName?.startsWith("frontline_convoy_");
      })
    }
  };

  ensureDir(path.dirname(CAMPAIGN_STATE_PATH));
  fs.writeFileSync(CAMPAIGN_STATE_PATH, JSON.stringify(campaignState, null, 2));

  return {
    ok: true,
    exportRoot,
    campaignPath,
    missionFolder,
    briefingGraphicPath,
    installed,
    installedMissionFolder,
    installError,
    campaignStatePath: CAMPAIGN_STATE_PATH
  };
}

function loadCampaignState() {
  const state = readJsonIfExists(CAMPAIGN_STATE_PATH, null);
  return {
    ok: true,
    exists: Boolean(state),
    filePath: CAMPAIGN_STATE_PATH,
    state
  };
}

function saveCampaignState(payload) {
  if (!payload || !payload.mapKey) {
    throw new Error("Invalid campaign state payload");
  }

  const previousState = readJsonIfExists(CAMPAIGN_STATE_PATH, null);
  const nextState = {
    ...(previousState || {}),
    version: 1,
    ...payload,
    missionCount: Number(payload.missionCount ?? previousState?.missionCount ?? 0),
    lastExportAt: payload.lastExportAt ?? previousState?.lastExportAt ?? null,
    parameters: {
      ...(previousState?.parameters || {}),
      ...(payload.parameters || {})
    },
    orderOfBattle: {
      ...(previousState?.orderOfBattle || {}),
      ...(payload.orderOfBattle || {})
    }
  };

  ensureDir(path.dirname(CAMPAIGN_STATE_PATH));
  fs.writeFileSync(CAMPAIGN_STATE_PATH, JSON.stringify(nextState, null, 2));

  return {
    ok: true,
    filePath: CAMPAIGN_STATE_PATH,
    state: nextState
  };
}

function saveMapAnchor(payload) {
  const mapKey = payload?.mapKey;
  const locationName = normalizeLocationKey(payload?.locationName);
  const ui = payload?.ui;

  if (!mapKey || !locationName || typeof ui?.left !== "number" || typeof ui?.top !== "number") {
    throw new Error("Invalid anchor payload");
  }

  if (mapKey === "Terrain1" && typeof ui?.pixelX === "number" && typeof ui?.pixelY === "number") {
    const rows = parseCsv(fs.readFileSync(HEARTLAND_PIXEL_LOCATIONS_PATH, "utf8"));
    const row = rows.find((entry) => normalizeLocationKey(entry.name) === locationName);

    if (!row) {
      throw new Error(`No Heartland CSV row found for ${payload?.locationName}`);
    }

    row.pixel_x = String(Math.round(ui.pixelX));
    row.pixel_y = String(Math.round(ui.pixelY));
    row.ui_left_percent = (Math.max(0, Math.min(100, ui.left))).toFixed(2);
    row.ui_top_percent = (Math.max(0, Math.min(100, ui.top))).toFixed(2);
    writeCsv(HEARTLAND_PIXEL_LOCATIONS_PATH, rows);

    return {
      ok: true,
      customAnchorsPath: HEARTLAND_PIXEL_LOCATIONS_PATH,
      mapKey,
      locationName,
      ui: {
        left: Number(row.ui_left_percent),
        top: Number(row.ui_top_percent),
        pixelX: Number(row.pixel_x),
        pixelY: Number(row.pixel_y)
      }
    };
  }

  const anchors = loadCustomAnchors();
  if (!anchors[mapKey]) {
    anchors[mapKey] = {};
  }

  anchors[mapKey][locationName] = {
    left: Math.max(0, Math.min(100, ui.left)),
    top: Math.max(0, Math.min(100, ui.top))
  };

  ensureDir(path.dirname(CUSTOM_ANCHORS_PATH));
  fs.writeFileSync(CUSTOM_ANCHORS_PATH, JSON.stringify(anchors, null, 2));

  return {
    ok: true,
    customAnchorsPath: CUSTOM_ANCHORS_PATH,
    mapKey,
    locationName,
    ui: anchors[mapKey][locationName]
  };
}

function upsertConfiguredLocation(payload) {
  const mapKey = payload?.mapKey;
  const name = (payload?.name || "").trim();
  const pixelX = Number(payload?.pixelX);
  const pixelY = Number(payload?.pixelY);
  const gameWorldX = payload?.gameWorldX === "" || payload?.gameWorldX == null ? "" : String(Number(payload.gameWorldX));
  const gameWorldZ = payload?.gameWorldZ === "" || payload?.gameWorldZ == null ? "" : String(Number(payload.gameWorldZ));
  const notes = (payload?.notes || "").trim();

  if (!mapKey || !name || Number.isNaN(pixelX) || Number.isNaN(pixelY)) {
    throw new Error("Invalid configured location payload");
  }

  if (mapKey !== "Terrain1") {
    throw new Error(`Configured location saving is not implemented for ${mapKey} yet`);
  }

  const preset = MAP_PRESETS[mapKey];
  const left = ((pixelX / preset.pixelSize.width) * 100).toFixed(2);
  const top = ((pixelY / preset.pixelSize.height) * 100).toFixed(2);

  const rows = safeExists(HEARTLAND_PIXEL_LOCATIONS_PATH)
    ? applyHeaders(parseCsv(fs.readFileSync(HEARTLAND_PIXEL_LOCATIONS_PATH, "utf8")), HEARTLAND_LOCATION_HEADERS)
    : [];

  const headers = HEARTLAND_LOCATION_HEADERS;

  const existing = rows.find((row) => row.map_key === mapKey && normalizeLocationKey(row.name) === normalizeLocationKey(name));
  const target = existing || Object.fromEntries(headers.map((header) => [header, ""]));

  target.map_key = mapKey;
  target.name = name;
  target.pixel_x = String(Math.round(pixelX));
  target.pixel_y = String(Math.round(pixelY));
  target.ui_left_percent = left;
  target.ui_top_percent = top;
  target.game_world_x = gameWorldX;
  target.game_world_z = gameWorldZ;
  target.initial_owner = target.initial_owner || "";
  target.notes = notes;

  if (!existing) {
    rows.push(target);
  }

  writeCsv(HEARTLAND_PIXEL_LOCATIONS_PATH, rows);

  return {
    ok: true,
    filePath: HEARTLAND_PIXEL_LOCATIONS_PATH,
    row: {
      mapKey,
      name,
      pixelX: Number(target.pixel_x),
      pixelY: Number(target.pixel_y),
      uiLeftPercent: Number(target.ui_left_percent),
      uiTopPercent: Number(target.ui_top_percent),
      gameWorldX: target.game_world_x === "" ? null : Number(target.game_world_x),
      gameWorldZ: target.game_world_z === "" ? null : Number(target.game_world_z),
      initialOwner: target.initial_owner || "",
      notes: target.notes
    }
  };
}

function saveLocationOwnership(payload) {
  const mapKey = payload?.mapKey;
  const name = (payload?.name || "").trim();
  const initialOwner = (payload?.initialOwner || "Neutral").trim();

  if (!mapKey || !name) {
    throw new Error("Invalid ownership payload");
  }

  if (mapKey !== "Terrain1") {
    throw new Error(`Ownership saving is not implemented for ${mapKey} yet`);
  }

  const rows = safeExists(HEARTLAND_PIXEL_LOCATIONS_PATH)
    ? applyHeaders(parseCsv(fs.readFileSync(HEARTLAND_PIXEL_LOCATIONS_PATH, "utf8")), HEARTLAND_LOCATION_HEADERS)
    : [];

  const existing = rows.find((row) => row.map_key === mapKey && normalizeLocationKey(row.name) === normalizeLocationKey(name));
  if (!existing) {
    throw new Error(`No configured location row found for ${name}`);
  }

  existing.initial_owner = initialOwner;
  writeCsv(HEARTLAND_PIXEL_LOCATIONS_PATH, rows);

  return {
    ok: true,
    filePath: HEARTLAND_PIXEL_LOCATIONS_PATH,
    row: {
      mapKey,
      name: existing.name,
      initialOwner: existing.initial_owner || "Neutral"
    }
  };
}

module.exports = {
  CAMPAIGN_STATE_PATH,
  CUSTOM_ANCHORS_PATH,
  DEFAULT_PATHS,
  HEARTLAND_PIXEL_LOCATIONS_PATH,
  MAP_PRESETS,
  buildCatalog,
  exportCampaign,
  loadCampaignState,
  saveMapAnchor,
  saveCampaignState,
  saveLocationOwnership,
  upsertConfiguredLocation
};

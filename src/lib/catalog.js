const fs = require("fs");
const path = require("path");
const os = require("os");
const { app } = require("electron");

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

const NUCLEAR_OPTION_APP_ID = "2168680";
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

function safeAppPath(name) {
  try {
    return app?.getPath?.(name);
  } catch {
    return null;
  }
}

function getWritableRoot() {
  return safeAppPath("userData") || process.cwd();
}

function getBundledRoot() {
  if (app?.isPackaged) {
    return app?.getAppPath?.() || process.resourcesPath || process.cwd();
  }

  return process.cwd();
}

function getWritableDataDir() {
  return path.join(getWritableRoot(), "data");
}

function getBundledDataDir() {
  return path.join(getBundledRoot(), "data");
}

function getExportsRoot() {
  if (app?.isPackaged) {
    return path.join(getWritableRoot(), "exports");
  }

  return path.join(process.cwd(), "exports");
}

function getCustomAnchorsPath() {
  return path.join(getWritableDataDir(), "map-anchors.json");
}

function getHeartlandPixelLocationsPath() {
  return path.join(getWritableDataDir(), "heartland_pixel_locations.csv");
}

function getCampaignStatePath() {
  return path.join(getWritableDataDir(), "campaign_state.json");
}

function getAppSettingsPath() {
  return path.join(getWritableDataDir(), "app_settings.json");
}

function getBundledHeartlandPixelLocationsPath() {
  return path.join(getBundledDataDir(), "heartland_pixel_locations.csv");
}

function getBundledGameAssetsPath() {
  return path.join(getBundledDataDir(), "game_assets.json");
}

function loadGameAssets() {
  const gameAssetsPath = getBundledGameAssetsPath();
  if (!safeExists(gameAssetsPath)) {
    return null;
  }

  try {
    return readJson(gameAssetsPath);
  } catch {
    return null;
  }
}

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

function ensureWritableDataBootstrap() {
  const writableDataDir = getWritableDataDir();
  ensureDir(writableDataDir);

  const writableHeartlandPath = getHeartlandPixelLocationsPath();
  const bundledHeartlandPath = getBundledHeartlandPixelLocationsPath();
  const bundledRows = safeExists(bundledHeartlandPath)
    ? parseCsv(fs.readFileSync(bundledHeartlandPath, "utf8"))
    : [];

  const needsSeed =
    !safeExists(writableHeartlandPath) ||
    parseCsv(fs.readFileSync(writableHeartlandPath, "utf8")).length === 0;

  if (needsSeed) {
    if (bundledRows.length > 0) {
      fs.copyFileSync(bundledHeartlandPath, writableHeartlandPath);
    } else {
      fs.writeFileSync(writableHeartlandPath, `${HEARTLAND_LOCATION_HEADERS.join(",")}\n`);
    }
  }
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
  ensureWritableDataBootstrap();
  const heartlandPath = getHeartlandPixelLocationsPath();
  if (!safeExists(heartlandPath)) {
    return {};
  }

  try {
    const rows = parseCsv(fs.readFileSync(heartlandPath, "utf8"));
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
  ensureWritableDataBootstrap();
  const heartlandPath = getHeartlandPixelLocationsPath();

  if (safeExists(heartlandPath)) {
    const rows = parseCsv(fs.readFileSync(heartlandPath, "utf8"))
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
  ensureWritableDataBootstrap();
  const customAnchorsPath = getCustomAnchorsPath();
  if (!safeExists(customAnchorsPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(customAnchorsPath, "utf8"));
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

function normalizeWindowsPath(value) {
  return (value || "").replace(/\\\\/g, "\\");
}

function parseAcfValue(text, key) {
  const match = text.match(new RegExp(`"${key}"\\s+"([^"]+)"`));
  return match ? normalizeWindowsPath(match[1]) : null;
}

function candidateSteamRoots() {
  return [
    "C:\\Program Files (x86)\\Steam",
    "C:\\Program Files\\Steam"
  ];
}

function discoverSteamLibraryPaths() {
  const libraries = new Set();

  for (const steamRoot of candidateSteamRoots()) {
    const libraryFile = path.join(steamRoot, "steamapps", "libraryfolders.vdf");
    if (!safeExists(libraryFile)) {
      continue;
    }

    libraries.add(steamRoot);

    try {
      const contents = fs.readFileSync(libraryFile, "utf8");
      const matches = contents.matchAll(/"path"\s+"([^"]+)"/g);
      for (const match of matches) {
        libraries.add(normalizeWindowsPath(match[1]));
      }
    } catch {
      continue;
    }
  }

  return Array.from(libraries);
}

function discoverNuclearOptionInstallPath() {
  for (const libraryRoot of discoverSteamLibraryPaths()) {
    const manifestPath = path.join(libraryRoot, "steamapps", `appmanifest_${NUCLEAR_OPTION_APP_ID}.acf`);
    if (!safeExists(manifestPath)) {
      continue;
    }

    try {
      const manifest = fs.readFileSync(manifestPath, "utf8");
      const installDir = parseAcfValue(manifest, "installdir");
      if (!installDir) {
        continue;
      }

      const installPath = path.join(libraryRoot, "steamapps", "common", installDir);
      if (safeExists(installPath)) {
        return installPath;
      }
    } catch {
      continue;
    }
  }

  return null;
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

function loadAppSettings() {
  ensureWritableDataBootstrap();
  return readJsonIfExists(getAppSettingsPath(), {
    installPathOverride: "",
    missionsPathOverride: "",
    tempMissionsPathOverride: ""
  });
}

function saveAppSettings(settings = {}) {
  ensureWritableDataBootstrap();
  const nextSettings = {
    installPathOverride: settings.installPathOverride || "",
    missionsPathOverride: settings.missionsPathOverride || "",
    tempMissionsPathOverride: settings.tempMissionsPathOverride || ""
  };

  const appSettingsPath = getAppSettingsPath();
  ensureDir(path.dirname(appSettingsPath));
  fs.writeFileSync(appSettingsPath, JSON.stringify(nextSettings, null, 2));
  return {
    ok: true,
    filePath: appSettingsPath,
    settings: nextSettings
  };
}

function resolveCatalogPaths(requestedPaths = {}) {
  const savedSettings = loadAppSettings();
  const detectedInstallPath = discoverNuclearOptionInstallPath();

  const installPath =
    requestedPaths.installPath ||
    savedSettings.installPathOverride ||
    detectedInstallPath ||
    DEFAULT_PATHS.installPath;

  const missionsPath =
    requestedPaths.missionsPath ||
    savedSettings.missionsPathOverride ||
    DEFAULT_PATHS.missionsPath;

  const tempMissionsPath =
    requestedPaths.tempMissionsPath ||
    savedSettings.tempMissionsPathOverride ||
    DEFAULT_PATHS.tempMissionsPath;

  return {
    installPath,
    missionsPath,
    tempMissionsPath,
    detectedInstallPath,
    installPathSource: requestedPaths.installPath
      ? "request"
      : savedSettings.installPathOverride
        ? "saved-override"
        : detectedInstallPath
          ? "steam-detect"
          : "default",
    appSettings: savedSettings
  };
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

function discoverInstallSummary(installPath, gameAssets = null) {
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
    inferredBuiltInScenarios: gameAssets?.source?.builtInMissions || [
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
  ensureWritableDataBootstrap();
  const resolvedPaths = resolveCatalogPaths(paths);
  const gameAssets = loadGameAssets();
  const customAnchors = loadCustomAnchors();
  const configuredLocationsByMap = loadConfiguredLocationsByMap();
  const userMissions = listMissionFolders(resolvedPaths.missionsPath).map(missionDescriptor);
  const tempMissions = listMissionFolders(resolvedPaths.tempMissionsPath).map(missionDescriptor);
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
    paths: {
      installPath: resolvedPaths.installPath,
      missionsPath: resolvedPaths.missionsPath,
      tempMissionsPath: resolvedPaths.tempMissionsPath,
      detectedInstallPath: resolvedPaths.detectedInstallPath,
      installPathSource: resolvedPaths.installPathSource
    },
    appSettings: resolvedPaths.appSettings,
    install: discoverInstallSummary(resolvedPaths.installPath, gameAssets),
    gameAssets,
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
    customAnchorsPath: getCustomAnchorsPath()
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
  const completionPercent = Number(objective.completionPercent ?? payload.parameters?.objectiveCompletionPercent ?? 50);
  const briefingLines = [
    `Start from: ${payload.parameters.startingAirbase}`,
    `Primary objective: ${objective.name || "Unspecified"}`,
    `Enemy profile: ${objective.profile || "Mixed"}`,
    `Expected resistance: ${objective.intensity || "Medium"}`,
    `Objective completion threshold: ${completionPercent}%`
  ];

  const customDescription = (payload.parameters.description || "").trim();
  return [customDescription, briefingLines.join("\n")].filter(Boolean).join("\n\n");
}

function getWorldPosition(item) {
  const position = item?.position || item?.globalPosition || item?.Center || item || {};
  const x = Number(position.x ?? position.gameWorldX);
  const y = Number(position.y ?? position.gameWorldY ?? 0);
  const z = Number(position.z ?? position.gameWorldZ);
  return Number.isFinite(x) && Number.isFinite(z) ? { x, y, z } : null;
}

function distanceBetween(first, second) {
  if (!first || !second) {
    return null;
  }
  return Math.hypot(second.x - first.x, second.z - first.z);
}

function bearingBetween(first, second) {
  if (!first || !second) {
    return null;
  }
  return (Math.atan2(second.x - first.x, second.z - first.z) * 180 / Math.PI + 360) % 360;
}

function compassDirection(bearing) {
  if (!Number.isFinite(bearing)) {
    return "unknown";
  }
  const directions = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return directions[Math.round(bearing / 45) % directions.length];
}

function markdownValue(value, fallback = "Unspecified") {
  const normalized = String(value ?? "").replace(/[\r\n|]+/g, " ").trim();
  return normalized || fallback;
}

function formatCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number).toLocaleString("en-US") : "unknown";
}

function countLabel(value, singular, plural = `${singular}s`) {
  const count = Number(value || 0);
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatTimeOfDay(hourValue) {
  const hour = Number(hourValue);
  if (!Number.isFinite(hour)) {
    return "Unspecified";
  }
  const normalizedHour = ((hour % 24) + 24) % 24;
  const label = normalizedHour < 5
    ? "Night"
    : normalizedHour < 8
      ? "Dawn"
      : normalizedHour < 12
        ? "Morning"
        : normalizedHour < 15
          ? "Midday"
          : normalizedHour < 19
            ? "Afternoon"
            : normalizedHour < 22
              ? "Dusk"
              : "Night";
  return `${String(Math.round(normalizedHour)).padStart(2, "0")}00 local (${label})`;
}

function getObjectiveVehicles(payload) {
  const initialState = payload.initialState || {};
  const objectiveName = initialState.objectiveLocation?.name || "";
  const objectiveSlug = sanitizeName(objectiveName).replace(/\s+/g, "_").toLowerCase();
  return (initialState.ownershipVehicles || []).filter((vehicle) => {
    const uniqueName = String(vehicle?.UniqueName || "").toLowerCase();
    return uniqueName.startsWith("objective_") && (!objectiveSlug || uniqueName.includes(objectiveSlug));
  });
}

function classifyObjectiveVehicles(vehicles) {
  const counts = {
    airDefense: 0,
    artillery: 0,
    tanks: 0,
    otherGround: 0
  };

  vehicles.forEach((vehicle) => {
    const type = String(vehicle?.type || "").toLowerCase();
    if (/sam|spaag|aaa|air.?defen|radar/.test(type)) {
      counts.airDefense += 1;
    } else if (/art|mlrs/.test(type)) {
      counts.artillery += 1;
    } else if (/mbt|tank/.test(type)) {
      counts.tanks += 1;
    } else {
      counts.otherGround += 1;
    }
  });

  return counts;
}

function buildFullBriefingDocument(payload, campaignName) {
  const parameters = payload.parameters || {};
  const initialState = payload.initialState || {};
  const objective = initialState.objectiveLocation || {};
  const start = initialState.startingAirbase || {};
  const advancedThreats = parameters.advancedThreats || {};
  const resistance = advancedThreats.operationalResistance || {};
  const patrolPlan = advancedThreats.patrolPlan || {};
  const objectiveVehicles = getObjectiveVehicles(payload);
  const targetBuildings = (initialState.targetBuildings || []).filter((building) =>
    String(building?.UniqueName || "").startsWith("objective_")
  );
  const vehicleCounts = classifyObjectiveVehicles(objectiveVehicles);
  const knownTargetCount = objectiveVehicles.length + targetBuildings.length;
  const requiredTargetCount = getRequiredObjectiveTargets(payload).length;
  const completionPercent = Math.max(1, Math.min(100, Number(
    objective.completionPercent ?? parameters.objectiveCompletionPercent ?? 50
  )));
  const friendlyFaction = start.owner || initialState.factions?.[0]?.factionName || "Friendly";
  const enemyFaction = objective.owner || initialState.factions?.[1]?.factionName || "Enemy";
  const startPosition = getWorldPosition(start);
  const objectivePosition = getWorldPosition(objective);
  const directDistance = distanceBetween(startPosition, objectivePosition);
  const directBearing = bearingBetween(startPosition, objectivePosition);
  const approachSector = Number.isFinite(directBearing)
    ? compassDirection((directBearing + 180) % 360)
    : "the departure side";
  const weatherPercent = Math.max(0, Math.min(100, Math.round(Number(parameters.weatherIntensity || 0) * 100)));
  const airDefensePositions = objectiveVehicles
    .filter((vehicle) => /sam|spaag|aaa|air.?defen|radar/i.test(String(vehicle?.type || "")))
    .map(getWorldPosition)
    .filter(Boolean);
  let airDefenseSector = null;
  let preferredIngressSector = null;

  if (objectivePosition && airDefensePositions.length > 0) {
    const averagePosition = airDefensePositions.reduce((sum, position) => ({
      x: sum.x + position.x,
      y: sum.y + position.y,
      z: sum.z + position.z
    }), { x: 0, y: 0, z: 0 });
    averagePosition.x /= airDefensePositions.length;
    averagePosition.y /= airDefensePositions.length;
    averagePosition.z /= airDefensePositions.length;
    const averageDistance = distanceBetween(objectivePosition, averagePosition);
    const averageBearing = bearingBetween(objectivePosition, averagePosition);
    if (averageDistance >= 75 && Number.isFinite(averageBearing)) {
      airDefenseSector = compassDirection(averageBearing);
      preferredIngressSector = compassDirection((averageBearing + 180) % 360);
    }
  }

  const hostileLocations = (initialState.locations || [])
    .filter((location) => {
      const owner = location.initialOwner || location.owner;
      return owner === enemyFaction && location.name !== objective.name;
    })
    .map((location) => ({
      name: markdownValue(location.name),
      distance: distanceBetween(objectivePosition, getWorldPosition(location))
    }))
    .filter((location) => Number.isFinite(location.distance))
    .sort((first, second) => first.distance - second.distance)
    .slice(0, 3);

  const productionTypes = [...new Set(targetBuildings
    .map((building) => building?.factoryOptions?.productionType)
    .filter(Boolean))];
  const helicopterPatrols = Number(patrolPlan.helicopterPatrols || 0);
  const fixedWingPatrols = Number(patrolPlan.fixedWingPatrols || 0);
  const enemyAirSummary = helicopterPatrols === 0 && fixedWingPatrols === 0
    ? "No preplanned enemy helicopter or fixed-wing patrols. Maintain normal radar and visual lookout."
    : `${countLabel(helicopterPatrols, "helicopter patrol")} inside approximately ${Number(patrolPlan.helicopterPatrolRadius || 0).toLocaleString("en-US")} m and ${countLabel(fixedWingPatrols, "fixed-wing patrol")} inside approximately ${Number(patrolPlan.fixedWingPatrolRadius || 0).toLocaleString("en-US")} m.`;
  const airDefenseSummary = vehicleCounts.airDefense > 0
    ? `${countLabel(vehicleCounts.airDefense, "known local air-defense vehicle")}${airDefenseSector ? `, weighted toward the ${airDefenseSector} side of the aimpoint` : ""}.`
    : "No local air-defense vehicles appear on the tactical export; remain alert for theater threats.";
  const mediumRangeSamSummary = resistance.mediumRangeSam
    ? "Medium-range SAM resistance is enabled."
    : "No medium-range SAM resistance is planned.";
  const ingressAdvice = preferredIngressSector
    ? `Where terrain and package geometry permit, favor an offset toward the **${preferredIngressSector}** before the final run-in; the known local air defenses are weighted toward the ${airDefenseSector}.`
    : "Use an offset ingress and keep the main strike element outside the local threat ring until air defenses are located or ruled out.";
  const nearbyThreatText = hostileLocations.length > 0
    ? hostileLocations.map((location) => `${location.name} (${(location.distance / 1000).toFixed(1)} km)`).join(", ")
    : "No additional hostile operating locations are plotted near the objective.";
  const directRouteText = Number.isFinite(directDistance) && Number.isFinite(directBearing)
    ? `${(directDistance / 1000).toFixed(1)} km on bearing ${String(Math.round(directBearing)).padStart(3, "0")} degrees, approaching the objective from the ${approachSector}`
    : "not available from the exported coordinates";
  const knownObjectsText = knownTargetCount > 0 ? String(knownTargetCount) : "an unconfirmed number of";
  const designatedText = requiredTargetCount > 0
    ? `${countLabel(requiredTargetCount, "target element")} ${requiredTargetCount === 1 ? "is" : "are"} assigned to the generated completion objective`
    : "the in-game objective system will identify the required target elements";

  return `# ${markdownValue(campaignName).toUpperCase()}

## Mission Briefing

**Theater:** ${markdownValue(parameters.mapLabel || parameters.mapKey)}<br>
**Friendly force:** ${markdownValue(friendlyFaction)}<br>
**Enemy force:** ${markdownValue(enemyFaction)}<br>
**Departure / recovery:** ${markdownValue(start.name || parameters.startingAirbase)}<br>
**Primary objective:** ${markdownValue(objective.name)}<br>
**Threat posture:** ${markdownValue(objective.profile || parameters.objectiveUnitProfile, "Mixed")} / ${markdownValue(objective.intensity || parameters.objectiveIntensity, "Medium")}<br>
**Objective center:** X ${formatCoordinate(objective.gameWorldX ?? objective.x)} / Z ${formatCoordinate(objective.gameWorldZ ?? objective.z)}<br>
**Time:** ${formatTimeOfDay(parameters.timeOfDay)}<br>
**Weather:** ${weatherPercent}% cloud / weather intensity, cloud base approximately 1,800 m, calm winds<br>
**Respawn:** ${parameters.allowRespawn ? "Authorized" : "Not authorized"}

---

## 1. Situation

${enemyFaction} forces occupy ${markdownValue(objective.name)} with a ${markdownValue(objective.intensity || parameters.objectiveIntensity, "medium").toLowerCase()}-intensity mixed defensive package. The direct route from ${markdownValue(start.name || parameters.startingAirbase)} is **${directRouteText}**. The short route should not be mistaken for a permissive one: front-line axes, patrols, convoys, and defended operating locations may place mobile threats between departure and the objective.

The theater plan contains ${countLabel(patrolPlan.frontlinePairs, "front-line axis", "front-line axes")}, ${countLabel(patrolPlan.frontlinePatrolGroups, "front-line patrol group")}, ${countLabel(patrolPlan.convoyGroups, "convoy group")}, and ${countLabel(patrolPlan.localePatrolGroups, "locale patrol group")}. Placement randomness is ${Number(patrolPlan.randomnessPercent || 0)}%, so the briefing graphics are planning snapshots rather than guarantees of exact mobile-unit position.

Closest plotted enemy operating locations: ${nearbyThreatText}.

Enemy air activity: ${enemyAirSummary}

## 2. Enemy Forces at the Objective

The tactical export shows **${knownObjectsText} known enemy ${knownTargetCount === 1 ? "object" : "objects"}** in the objective area.

| Category | Known exported count |
|---|---:|
| Local air defense | ${vehicleCounts.airDefense} |
| Artillery / MLRS | ${vehicleCounts.artillery} |
| Main battle tanks | ${vehicleCounts.tanks} |
| Other ground and patrol vehicles | ${vehicleCounts.otherGround} |
| Production / target structures | ${targetBuildings.length} |

${airDefenseSummary} ${mediumRangeSamSummary} ${vehicleCounts.artillery > 0 ? `${countLabel(vehicleCounts.artillery, "artillery or rocket system")} can influence the surrounding corridor.` : "No artillery systems are plotted inside the objective package."}${productionTypes.length > 0 ? ` Production facilities are associated with ${productionTypes.map(markdownValue).join(", ")}.` : ""}

Mobile targets may leave their plotted marks after mission start. Treat the tactical sheet as the best available preflight picture and live sensors as authoritative.

## 3. Mission

${friendlyFaction} aircrews will launch from ${markdownValue(start.name || parameters.startingAirbase)}, penetrate the objective corridor, and **neutralize ${markdownValue(objective.name)} by destroying ${completionPercent}% of the designated target elements**.

The tactical sheet depicts all known objects for planning. ${designatedText}; HUD designations and the live objective status are authoritative. Destroying an un-designated object may be tactically useful without advancing the formal completion condition.

## 4. Commander's Intent

Break the objective's defensive system without trading aircraft against intact air defenses. Locate and suppress local SAM or AAA threats first, destroy HUD-designated targets in a deliberate sequence, and withdraw as soon as the objective confirms completion. Aircraft preservation takes priority over clearing every symbol from the tactical sheet.

## 5. Execution

### Phase I — Launch and marshal

Build the package before committing to the objective corridor. Confirm sensors, weapons, fuel, and element assignments while clear of the target. The flight lead should assign SEAD, strike, and cleanup responsibilities before the final run-in.

### Phase II — Ingress

The direct route is ${directRouteText}. It offers the fastest time to target but may cross active patrol or convoy corridors. ${ingressAdvice}

Do not use a hostile airfield or highway strip as a low-altitude turn point. Keep sufficient lateral spacing to prevent one threat system from engaging the entire package.

### Phase III — Air-defense suppression

${vehicleCounts.airDefense > 0 ? `The ${countLabel(vehicleCounts.airDefense, "plotted local air-defense vehicle")} ${vehicleCounts.airDefense === 1 ? "is" : "are"} first priority.` : "Search for unplotted or mobile air-defense threats before committing to close-range attacks."} Use anti-radiation, standoff, or precision weapons where available. A radar shutdown is not confirmation of destruction; verify the threat is suppressed before sending the main strike element inside the local defensive ring.

### Phase IV — Main attack

Attack in the following order:

1. HUD-designated targets required for mission completion.
2. Air-defense systems that still threaten the package.
3. Artillery and rocket systems.
4. Tanks, mechanized vehicles, and other mobile threats.
5. Production structures and remaining targets of opportunity when designated or when fuel and weapons permit.

Assign targets by sector, type, or HUD mark to prevent duplicate attacks. Use separated attack headings and altitude blocks. After each pass, extend clear of the target, assess objective status, and re-attack only with a confirmed target and exit path.

### Phase V — Egress and recovery

On objective completion, egress toward friendly territory and recover at ${markdownValue(start.name || parameters.startingAirbase)}. Avoid wide turns toward the nearby hostile locations listed above. If the objective does not complete after the expected number of kills, check for surviving HUD-designated elements before spending weapons on prominent but un-designated objects.

## 6. Recommended Package

- **SEAD / escort element:** sensors and anti-radiation or standoff weapons, plus self-defense air-to-air missiles.
- **Strike element:** precision weapons suitable for the exported mix of armor, artillery, and structures.
- **Optional cleanup element:** guided rockets, light precision weapons, or cannon for mobile survivors after air defenses are confirmed down.

Carry a self-defense air-to-air option even when no enemy air patrol is scheduled. Match package size to the known object count and the ${completionPercent}% completion requirement.

## 7. Coordinating Instructions

- Positive identification is required before weapons release.
- Call weapons away, direction of attack, and egress direction for every pass.
- Abort a run if the target is lost, friendlies enter the weapon footprint, or the exit path crosses an active threat indication.
- The overcast layer may compress vertical separation; make explicit deconfliction calls near cloud base.
- Do not continue attacking solely to clear the tactical sheet after the objective completes unless directed by flight lead.

## 8. Abort and Contingency Criteria

Reset outside the threat area if local air defenses remain active and cannot be engaged, weather prevents positive identification, the package becomes separated, fuel no longer supports an attack and safe recovery, or aircraft cannot deconflict over the compact objective area. A damaged aircraft should announce its condition, separate along the safest friendly axis, and recover without drawing the rest of the package through an active threat sector.

## 9. Mission Data Card

| Item | Data |
|---|---|
| Departure / recovery | ${markdownValue(start.name || parameters.startingAirbase)} |
| Objective | ${markdownValue(objective.name)} |
| Objective coordinates | X ${formatCoordinate(objective.gameWorldX ?? objective.x)} / Z ${formatCoordinate(objective.gameWorldZ ?? objective.z)} |
| Direct route | ${directRouteText} |
| Completion requirement | Destroy ${completionPercent}% of HUD-designated target elements |
| Known tactical objects | ${knownTargetCount} |
| Local air defense | ${vehicleCounts.airDefense} |
| Artillery / MLRS | ${vehicleCounts.artillery} |
| Tanks | ${vehicleCounts.tanks} |
| Other ground / patrol vehicles | ${vehicleCounts.otherGround} |
| Production / target structures | ${targetBuildings.length} |
| Enemy air patrols | ${helicopterPatrols} helicopter / ${fixedWingPatrols} fixed-wing |
| Weather | ${weatherPercent}% intensity; 1,800 m cloud base; calm winds |
| Friendly respawn | ${parameters.allowRespawn ? "Enabled" : "Disabled"} |

## 10. Read-Aloud Brief

> ${friendlyFaction} flight, this is ${markdownValue(campaignName)}. Launch from ${markdownValue(start.name || parameters.startingAirbase)} and neutralize ${markdownValue(objective.name)}. The direct route is ${directRouteText}. The tactical picture shows ${knownObjectsText} known enemy objects, including ${countLabel(vehicleCounts.airDefense, "local air-defense vehicle")}, ${countLabel(vehicleCounts.artillery, "artillery system")}, ${countLabel(vehicleCounts.tanks, "tank")}, ${countLabel(vehicleCounts.otherGround, "other ground vehicle")}, and ${countLabel(targetBuildings.length, "structure")}.
>
> Suppress air defenses before committing the main strike. Service HUD-designated targets first and destroy ${completionPercent}% of the designated elements. Confirm objective completion, then egress to friendly territory and recover at ${markdownValue(start.name || parameters.startingAirbase)}. Preserve aircraft and do not remain over the target after the mission is complete.

---

**Planning references:** \`${markdownValue(campaignName)}_briefing.png\` and \`${markdownValue(campaignName)}_tactical.png\`<br>
**Controlling principle:** HUD designations and live threat indications supersede the static planning graphics.
`;
}

function getObjectiveTargetNames(payload) {
  const initialState = payload.initialState || {};
  const objective = initialState.objectiveLocation || {};
  const objectiveSlug = sanitizeName(objective.name || "").replace(/\s+/g, "_").toLowerCase();
  const unitTargets = (initialState.ownershipVehicles || [])
    .filter((vehicle) => vehicle.UniqueName?.startsWith(`objective_`) && vehicle.UniqueName.toLowerCase().includes(objectiveSlug))
    .map((vehicle) => vehicle.UniqueName);
  const buildingTargets = (initialState.targetBuildings || [])
    .filter((building) => building.UniqueName?.startsWith(`objective_`))
    .map((building) => building.UniqueName);
  return [...unitTargets, ...buildingTargets];
}

function getRequiredObjectiveTargets(payload) {
  const targetNames = getObjectiveTargetNames(payload);
  if (targetNames.length === 0) {
    return [];
  }

  const completionPercent = Math.max(1, Math.min(100, Number(payload.parameters?.objectiveCompletionPercent || 50)));
  const requiredCount = Math.max(1, Math.ceil(targetNames.length * (completionPercent / 100)));
  return targetNames.slice(0, requiredCount);
}

function buildPrimaryObjective(payload) {
  const initialState = payload.initialState || {};
  const objective = initialState.objectiveLocation || {};
  const requiredTargets = getRequiredObjectiveTargets(payload);
  const completionPercent = Number(payload.parameters?.objectiveCompletionPercent || 50);

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
        ...requiredTargets.map((uniqueName) => ({
          StringValue: uniqueName,
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
          StringValue: `Start from ${payload.parameters.startingAirbase}. Primary objective: ${objective.name || "Objective Area"}. Destroy ${completionPercent}% of designated target elements.`,
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
  const completionPercent = Number(payload.parameters?.objectiveCompletionPercent || 50);
  const ingressX = (startX + objectiveX) / 2;
  const ingressY = (startY + objectiveY) / 2;
  const ingressZ = (startZ + objectiveZ) / 2;
  const objectiveTargets = getRequiredObjectiveTargets(payload);

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
      message: `${objectiveName} is the designated objective area. Expect ${objective.profile || "mixed"} resistance at ${objective.intensity || "medium"} intensity. Destroy ${completionPercent}% of the designated target set.`,
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
      objectiveName: `Neutralise ${objectiveName}`,
      message: `${objectiveName} has been reduced below the required ${completionPercent}% threshold.`,
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
  const exportRoot = path.join(getExportsRoot(), campaignName);
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

  const briefingDocumentPath = path.join(missionFolder, `${campaignName}_full_briefing.md`);
  fs.writeFileSync(
    briefingDocumentPath,
    buildFullBriefingDocument(payload, campaignName),
    "utf8"
  );

  const briefingGraphics = Array.isArray(payload?.briefingGraphics)
    ? payload.briefingGraphics.filter((graphic) => graphic?.dataUrl)
    : payload?.briefingGraphic?.dataUrl
      ? [payload.briefingGraphic]
      : [];
  const briefingGraphicPaths = briefingGraphics.map((briefingGraphic, index) => {
    const briefingFileName = sanitizeName(
      path.basename(briefingGraphic.fileName || `${campaignName}_briefing_${index + 1}`)
        .replace(/\.[^/.]+$/, "")
    );
    const briefingGraphicPath = path.join(missionFolder, `${briefingFileName}.png`);
    writeDataUrlFile(briefingGraphicPath, briefingGraphic.dataUrl);
    return briefingGraphicPath;
  });

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

  const campaignStatePath = getCampaignStatePath();
  const previousState = readJsonIfExists(campaignStatePath, null);
  const previousMissionCount = Number(previousState?.missionCount || 0);
  const ownershipVehicles = payload.initialState?.ownershipVehicles || [];
  const persistedUnits = payload.initialState?.orderOfBattle?.units || previousState?.orderOfBattle?.units || [];
  const persistedBuildings = payload.initialState?.orderOfBattle?.buildings || previousState?.orderOfBattle?.buildings || [];
  const campaignState = {
    ...(previousState || {}),
    version: 1,
    groundForceCompositionVersion: Number(
      payload.initialState?.groundForceCompositionVersion ??
        previousState?.groundForceCompositionVersion ??
        0
    ),
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

  ensureDir(path.dirname(campaignStatePath));
  fs.writeFileSync(campaignStatePath, JSON.stringify(campaignState, null, 2));

  return {
    ok: true,
    exportRoot,
    campaignPath,
    missionFolder,
    briefingDocumentPath,
    briefingGraphicPath: briefingGraphicPaths[0] || null,
    briefingGraphicPaths,
    installed,
    installedMissionFolder,
    installError,
    campaignStatePath
  };
}

function loadCampaignState() {
  ensureWritableDataBootstrap();
  const campaignStatePath = getCampaignStatePath();
  const state = readJsonIfExists(campaignStatePath, null);
  return {
    ok: true,
    exists: Boolean(state),
    filePath: campaignStatePath,
    state
  };
}

function saveCampaignState(payload) {
  if (!payload || !payload.mapKey) {
    throw new Error("Invalid campaign state payload");
  }

  ensureWritableDataBootstrap();
  const campaignStatePath = getCampaignStatePath();
  const previousState = readJsonIfExists(campaignStatePath, null);
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

  ensureDir(path.dirname(campaignStatePath));
  fs.writeFileSync(campaignStatePath, JSON.stringify(nextState, null, 2));

  return {
    ok: true,
    filePath: campaignStatePath,
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
    ensureWritableDataBootstrap();
    const heartlandPath = getHeartlandPixelLocationsPath();
    const rows = parseCsv(fs.readFileSync(heartlandPath, "utf8"));
    const row = rows.find((entry) => normalizeLocationKey(entry.name) === locationName);

    if (!row) {
      throw new Error(`No Heartland CSV row found for ${payload?.locationName}`);
    }

    row.pixel_x = String(Math.round(ui.pixelX));
    row.pixel_y = String(Math.round(ui.pixelY));
    row.ui_left_percent = (Math.max(0, Math.min(100, ui.left))).toFixed(2);
    row.ui_top_percent = (Math.max(0, Math.min(100, ui.top))).toFixed(2);
    writeCsv(heartlandPath, rows);

    return {
      ok: true,
      customAnchorsPath: heartlandPath,
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

  const customAnchorsPath = getCustomAnchorsPath();
  ensureDir(path.dirname(customAnchorsPath));
  fs.writeFileSync(customAnchorsPath, JSON.stringify(anchors, null, 2));

  return {
    ok: true,
    customAnchorsPath,
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
  const derivedWorldX = preset.bounds.minX + (preset.bounds.maxX - preset.bounds.minX) * (pixelX / preset.pixelSize.width);
  const derivedWorldZ = preset.bounds.maxZ - (preset.bounds.maxZ - preset.bounds.minZ) * (pixelY / preset.pixelSize.height);
  const gameWorldX = payload?.gameWorldX === "" || payload?.gameWorldX == null ? String(Math.round(derivedWorldX)) : String(Number(payload.gameWorldX));
  const gameWorldZ = payload?.gameWorldZ === "" || payload?.gameWorldZ == null ? String(Math.round(derivedWorldZ)) : String(Number(payload.gameWorldZ));

  ensureWritableDataBootstrap();
  const heartlandPath = getHeartlandPixelLocationsPath();
  const rows = safeExists(heartlandPath)
    ? applyHeaders(parseCsv(fs.readFileSync(heartlandPath, "utf8")), HEARTLAND_LOCATION_HEADERS)
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

  writeCsv(heartlandPath, rows);

  return {
    ok: true,
    filePath: heartlandPath,
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

  ensureWritableDataBootstrap();
  const heartlandPath = getHeartlandPixelLocationsPath();
  const rows = safeExists(heartlandPath)
    ? applyHeaders(parseCsv(fs.readFileSync(heartlandPath, "utf8")), HEARTLAND_LOCATION_HEADERS)
    : [];

  const existing = rows.find((row) => row.map_key === mapKey && normalizeLocationKey(row.name) === normalizeLocationKey(name));
  if (!existing) {
    throw new Error(`No configured location row found for ${name}`);
  }

  existing.initial_owner = initialOwner;
  writeCsv(heartlandPath, rows);

  return {
    ok: true,
    filePath: heartlandPath,
    row: {
      mapKey,
      name: existing.name,
      initialOwner: existing.initial_owner || "Neutral"
    }
  };
}

module.exports = {
  DEFAULT_PATHS,
  MAP_PRESETS,
  buildCatalog,
  buildFullBriefingDocument,
  exportCampaign,
  getAppSettingsPath,
  getCampaignStatePath,
  getCustomAnchorsPath,
  getHeartlandPixelLocationsPath,
  loadAppSettings,
  loadCampaignState,
  saveAppSettings,
  saveMapAnchor,
  saveCampaignState,
  saveLocationOwnership,
  upsertConfiguredLocation
};

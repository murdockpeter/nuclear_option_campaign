const state = {
  catalog: null,
  selectedMapKey: "Terrain1",
  activeView: "campaign",
  campaignImageReady: false,
  configPoint: null,
  configImageReady: false,
  configZoom: 1
};

const HIDDEN_LOCATION_NAMES = new Set([
  "Central Gulf Airbase",
  "North Coast Enrichment Plant",
  "PRF Base",
  "Southern Interior Base"
]);

const OBJECTIVE_INTENSITY_LABELS = ["Low", "Medium", "High", "Very High"];
const OBJECTIVE_FORCE_COUNTS = [4, 8, 12, 18];
const BASELINE_DEFENDER_COUNT = 3;
const AUTOLOAD_DELAY_MS = 350;
const DEFAULT_FACTION_SUPPLIES = [
  { unitType: "COIN", count: 16 },
  { unitType: "trainer", count: 16 },
  { unitType: "AttackHelo1", count: 12 },
  { unitType: "Multirole1", count: 12 },
  { unitType: "SmallFighter1", count: 12 },
  { unitType: "EW1", count: 8 }
];
const LOCATION_EXPORT_NAME_OVERRIDES = {
  Terrain1: {
    "South Boscali Airfield": "South Boscali General Aviation"
  }
};
const OBJECTIVE_PROFILE_TYPES = {
  armor: ["MBT1", "AFV8_IFV", "AFV8_APC"],
  "air-defense": ["RadarSAM1", "SAMTrailer1", "SPAAG1", "AFV8_SAM"],
  artillery: ["Truck2-FT", "LightTruck1_AT", "AFV8_APC"],
  mixed: ["MBT1", "AFV8_IFV", "RadarSAM1", "SPAAG1", "Truck2-FT", "AFV8_APC"]
};

const els = {
  scanMeta: document.getElementById("scan-meta"),
  catalogStats: document.getElementById("catalog-stats"),
  ownershipList: document.getElementById("ownership-list"),
  mapSelect: document.getElementById("map-select"),
  airfieldSelect: document.getElementById("airfield-select"),
  friendlyFaction: document.getElementById("friendly-faction"),
  enemyFaction: document.getElementById("enemy-faction"),
  objectiveTarget: document.getElementById("objective-target"),
  objectiveUnitProfile: document.getElementById("objective-unit-profile"),
  objectiveIntensity: document.getElementById("objective-intensity"),
  objectiveIntensityValue: document.getElementById("objective-intensity-value"),
  mapTitle: document.getElementById("map-title"),
  mapSubtitle: document.getElementById("map-subtitle"),
  workspaceMap: document.getElementById("workspace-map"),
  workspaceStart: document.getElementById("workspace-start"),
  workspaceObjective: document.getElementById("workspace-objective"),
  workspaceLocationCount: document.getElementById("workspace-location-count"),
  workspaceOwnership: document.getElementById("workspace-ownership"),
  output: document.getElementById("generated-output"),
  campaignName: document.getElementById("campaign-name"),
  description: document.getElementById("campaign-description"),
  startingRank: document.getElementById("starting-rank"),
  startingCash: document.getElementById("starting-cash"),
  timeOfDay: document.getElementById("time-of-day"),
  weatherIntensity: document.getElementById("weather-intensity"),
  allowRespawn: document.getElementById("allow-respawn"),
  enableSam: document.getElementById("enable-sam"),
  enableArtillery: document.getElementById("enable-artillery"),
  enableFactories: document.getElementById("enable-factories"),
  enableGround: document.getElementById("enable-ground"),
  enableShips: document.getElementById("enable-ships"),
  showCampaignView: document.getElementById("show-campaign-view"),
  showConfigView: document.getElementById("show-config-view"),
  campaignView: document.getElementById("campaign-view"),
  campaignStage: document.getElementById("campaign-stage"),
  campaignScroll: document.getElementById("campaign-scroll"),
  campaignCanvas: document.getElementById("campaign-canvas"),
  campaignEmpty: document.getElementById("campaign-empty"),
  campaignMapImage: document.getElementById("campaign-map-image"),
  campaignMarkerLayer: document.getElementById("campaign-marker-layer"),
  configView: document.getElementById("config-view"),
  configStage: document.getElementById("config-stage"),
  configScroll: document.getElementById("config-scroll"),
  configCanvas: document.getElementById("config-canvas"),
  configEmpty: document.getElementById("config-empty"),
  configMapImage: document.getElementById("config-map-image"),
  configMarkerLayer: document.getElementById("config-marker-layer"),
  configZoom: document.getElementById("config-zoom"),
  configReadout: document.getElementById("config-readout"),
  configExistingLocation: document.getElementById("config-existing-location"),
  configLocationName: document.getElementById("config-location-name"),
  configPixelX: document.getElementById("config-pixel-x"),
  configPixelY: document.getElementById("config-pixel-y"),
  configWorldX: document.getElementById("config-world-x"),
  configWorldZ: document.getElementById("config-world-z"),
  configNotes: document.getElementById("config-notes"),
  saveConfigLocation: document.getElementById("save-config-location")
};

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function setText(element, text) {
  element.textContent = text;
}

function mapByKey(key) {
  return state.catalog?.maps?.find((entry) => entry.key === key) || state.catalog?.maps?.[0];
}

function resolveRendererAsset(assetPath) {
  return new URL(assetPath, window.location.href).href;
}

function normalizeName(value) {
  return (value || "").trim().toLowerCase();
}

function configuredLocationsForMap(mapKey) {
  return (state.catalog?.configuredLocationsByMap?.[mapKey] || []).filter((entry) => {
    return !HIDDEN_LOCATION_NAMES.has(entry.name);
  });
}

function inferDefaultOwner(map, locationName) {
  const known = map?.airfields?.find((entry) => {
    return normalizeName(entry.name) === normalizeName(locationName) || normalizeName(entry.id) === normalizeName(locationName);
  });

  return known?.faction || "Neutral";
}

function getOperationalLocations(map = mapByKey(state.selectedMapKey)) {
  if (!map) {
    return [];
  }

  const configured = configuredLocationsForMap(map.key);
  if (configured.length > 0) {
    return configured
      .map((entry) => ({
        id: entry.name,
        name: entry.name,
        pixelX: entry.pixelX,
        pixelY: entry.pixelY,
        gameWorldX: entry.gameWorldX,
        gameWorldZ: entry.gameWorldZ,
        notes: entry.notes || "",
        initialOwner: entry.initialOwner || inferDefaultOwner(map, entry.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...map.airfields]
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      pixelX: null,
      pixelY: null,
      gameWorldX: entry.x,
      gameWorldZ: entry.z,
      notes: "",
      initialOwner: entry.faction || "Neutral"
    }))
    .filter((entry) => !HIDDEN_LOCATION_NAMES.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function resolveGameLocation(map, selectedValue) {
  const location = getOperationalLocations(map).find((entry) => {
    return entry.id === selectedValue || entry.name === selectedValue;
  });

  if (!location) {
    return null;
  }

  return {
    id: location.id,
    name: location.name,
    x: location.gameWorldX,
    z: location.gameWorldZ,
    owner: location.initialOwner
  };
}

function upsertConfiguredLocationInState(row) {
  if (!state.catalog) {
    return;
  }

  if (!state.catalog.configuredLocationsByMap) {
    state.catalog.configuredLocationsByMap = {};
  }

  if (!state.catalog.configuredLocationsByMap[row.mapKey]) {
    state.catalog.configuredLocationsByMap[row.mapKey] = [];
  }

  const list = state.catalog.configuredLocationsByMap[row.mapKey];
  const existingIndex = list.findIndex((entry) => entry.name === row.name);
  const next = {
    mapKey: row.mapKey,
    name: row.name,
    pixelX: row.pixelX,
    pixelY: row.pixelY,
    uiLeftPercent: row.uiLeftPercent,
    uiTopPercent: row.uiTopPercent,
    gameWorldX: row.gameWorldX,
    gameWorldZ: row.gameWorldZ,
    notes: row.notes || "",
    initialOwner: row.initialOwner || inferDefaultOwner(mapByKey(row.mapKey), row.name)
  };

  if (existingIndex >= 0) {
    list[existingIndex] = next;
  } else {
    list.push(next);
  }
}

function updateLocationOwnerInState(mapKey, name, initialOwner) {
  if (!state.catalog?.configuredLocationsByMap?.[mapKey]) {
    return;
  }

  const location = state.catalog.configuredLocationsByMap[mapKey].find((entry) => entry.name === name);
  if (location) {
    location.initialOwner = initialOwner;
  }
}

function renderStats() {
  const mapCount = state.catalog?.maps?.length || 0;
  const configuredCount = Object.values(state.catalog?.configuredLocationsByMap || {}).reduce((count, items) => count + items.length, 0);
  const readyCoords = Object.values(state.catalog?.configuredLocationsByMap || {}).reduce((count, items) => {
    return count + items.filter((item) => item.gameWorldX != null && item.gameWorldZ != null).length;
  }, 0);

  els.catalogStats.innerHTML = `
    <div class="stat-card"><strong>${mapCount}</strong><span>Supported Maps</span></div>
    <div class="stat-card"><strong>${configuredCount}</strong><span>Named Locations</span></div>
    <div class="stat-card"><strong>${readyCoords}</strong><span>Ready Coordinates</span></div>
  `;
}

function renderMapOptions() {
  els.mapSelect.innerHTML = "";
  for (const map of state.catalog.maps) {
    els.mapSelect.appendChild(createOption(map.key, map.label));
  }
  els.mapSelect.value = state.selectedMapKey;
}

function renderFactionOptions() {
  const factions = state.catalog.factions || [];
  for (const select of [els.friendlyFaction, els.enemyFaction]) {
    select.innerHTML = "";
    for (const faction of factions) {
      select.appendChild(createOption(faction.id, faction.label));
    }
  }

  els.friendlyFaction.value = "Boscali";
  els.enemyFaction.value = "Primeva";
}

function renderLocationOptions() {
  const map = mapByKey(state.selectedMapKey);
  const locations = getOperationalLocations(map);
  const previousValue = els.airfieldSelect.value;

  els.airfieldSelect.innerHTML = "";
  for (const location of locations) {
    els.airfieldSelect.appendChild(createOption(location.id, location.name));
  }

  const friendlyOwned = locations.filter((entry) => entry.initialOwner === els.friendlyFaction.value);
  const preferred = locations.find((entry) => entry.id === previousValue) || friendlyOwned[0] || locations[0];
  if (preferred) {
    els.airfieldSelect.value = preferred.id;
  }
}

function renderObjectiveOptions() {
  const map = mapByKey(state.selectedMapKey);
  const locations = getOperationalLocations(map);
  const previousValue = els.objectiveTarget.value;

  els.objectiveTarget.innerHTML = "";
  for (const location of locations) {
    els.objectiveTarget.appendChild(createOption(location.id, location.name));
  }

  const preferredEnemy = locations.find((entry) => entry.initialOwner === els.enemyFaction.value);
  const preferred =
    locations.find((entry) => entry.id === previousValue) ||
    preferredEnemy ||
    locations.find((entry) => entry.id !== els.airfieldSelect.value) ||
    locations[0];

  if (preferred) {
    els.objectiveTarget.value = preferred.id;
  }
}

function renderObjectiveIntensityValue() {
  const level = Number(els.objectiveIntensity.value || 1);
  setText(els.objectiveIntensityValue, OBJECTIVE_INTENSITY_LABELS[level] || "Medium");
}

function renderOwnershipList() {
  if (!state.catalog) {
    els.ownershipList.innerHTML = `<div class="mission-card">Reload catalog first.</div>`;
    return;
  }

  const map = mapByKey(state.selectedMapKey);
  const locations = getOperationalLocations(map);

  if (!locations.length) {
    els.ownershipList.innerHTML = `<div class="mission-card">No configured locations are available for this map yet.</div>`;
    return;
  }

  const ownerOptions = [
    { value: "Neutral", label: "Neutral" },
    { value: els.friendlyFaction.value, label: els.friendlyFaction.value },
    { value: els.enemyFaction.value, label: els.enemyFaction.value }
  ];

  els.ownershipList.innerHTML = locations
    .map((location) => {
      const selectedOwner = location.initialOwner || "Neutral";
      const meta = [
        location.gameWorldX != null && location.gameWorldZ != null
          ? `X ${location.gameWorldX}, Z ${location.gameWorldZ}`
          : "Missing in-game coordinates",
        location.notes || "No notes"
      ].join(" - ");

      return `
        <div class="ownership-row">
          <div>
            <div class="ownership-row__title">${location.name}</div>
            <div class="ownership-row__meta">${meta}</div>
          </div>
          <label class="field">
            <span>Owner</span>
            <select data-owner-select="${location.name}">
              ${ownerOptions
                .map((option) => `<option value="${option.value}" ${option.value === selectedOwner ? "selected" : ""}>${option.label}</option>`)
                .join("")}
            </select>
          </label>
        </div>
      `;
    })
    .join("");
}

function updateWorkspaceSummary() {
  const map = mapByKey(state.selectedMapKey);
  if (!map) {
    setText(els.mapTitle, state.activeView === "campaign" ? "Campaign Workspace" : "Location Config");
    setText(
      els.mapSubtitle,
      "Click Reload Catalog after launch to load Heartland and initialize configuration."
    );
    setText(els.workspaceMap, "-");
    setText(els.workspaceStart, "-");
    setText(els.workspaceObjective, "-");
    setText(els.workspaceLocationCount, "-");
    setText(els.workspaceOwnership, "-");
    return;
  }

  const locations = getOperationalLocations(map);
  const startingAirbase = resolveGameLocation(map, els.airfieldSelect.value);
  const objectiveLocation = resolveGameLocation(map, els.objectiveTarget.value);
  const ownershipCounts = {
    friendly: locations.filter((entry) => entry.initialOwner === els.friendlyFaction.value).length,
    enemy: locations.filter((entry) => entry.initialOwner === els.enemyFaction.value).length,
    neutral: locations.filter((entry) => !entry.initialOwner || entry.initialOwner === "Neutral").length
  };

  setText(els.mapTitle, state.activeView === "campaign" ? map.label : `${map.label} Location Config`);
  setText(
    els.mapSubtitle,
    state.activeView === "campaign"
      ? "Manual ownership setup for a fresh multiplayer campaign start."
      : "Click a map point, name the location, then enter the in-game X/Z coordinates."
  );
  setText(els.workspaceMap, map.label);
  setText(els.workspaceStart, startingAirbase?.name || "-");
  setText(els.workspaceObjective, objectiveLocation?.name || "-");
  setText(els.workspaceLocationCount, String(locations.length));
  setText(
    els.workspaceOwnership,
    `${ownershipCounts.friendly} ${els.friendlyFaction.value} / ${ownershipCounts.enemy} ${els.enemyFaction.value} / ${ownershipCounts.neutral} Neutral`
  );
}

function updateScanMeta() {
  const pathInfo = state.catalog.paths;
  const installExists = state.catalog.install.exists ? "install found" : "install missing";
  setText(
    els.scanMeta,
    `${installExists} - missions: ${pathInfo.missionsPath} - scanned ${new Date(state.catalog.scannedAt).toLocaleString()}`
  );
}

function getConfigViewport() {
  const naturalWidth = els.configMapImage.naturalWidth || 1;
  const naturalHeight = els.configMapImage.naturalHeight || 1;
  const baseWidth = els.configScroll.clientWidth || els.configStage.clientWidth || naturalWidth;
  const width = baseWidth * state.configZoom;
  const height = width * (naturalHeight / naturalWidth);
  return { left: 0, top: 0, width, height };
}

function getCampaignViewport() {
  const naturalWidth = els.campaignMapImage.naturalWidth || 1;
  const naturalHeight = els.campaignMapImage.naturalHeight || 1;
  const baseWidth = els.campaignScroll.clientWidth || els.campaignStage.clientWidth || naturalWidth;
  const width = baseWidth * state.configZoom;
  const height = width * (naturalHeight / naturalWidth);
  return { left: 0, top: 0, width, height };
}

function applyConfigFrame() {
  const viewport = getConfigViewport();
  els.configCanvas.style.width = `${viewport.width}px`;
  els.configCanvas.style.height = `${viewport.height}px`;
  els.configMapImage.style.left = `${viewport.left}px`;
  els.configMapImage.style.top = `${viewport.top}px`;
  els.configMapImage.style.width = `${viewport.width}px`;
  els.configMapImage.style.height = `${viewport.height}px`;
  els.configMarkerLayer.style.left = `${viewport.left}px`;
  els.configMarkerLayer.style.top = `${viewport.top}px`;
  els.configMarkerLayer.style.width = `${viewport.width}px`;
  els.configMarkerLayer.style.height = `${viewport.height}px`;
}

function applyCampaignFrame() {
  const viewport = getCampaignViewport();
  els.campaignCanvas.style.width = `${viewport.width}px`;
  els.campaignCanvas.style.height = `${viewport.height}px`;
  els.campaignMapImage.style.left = `${viewport.left}px`;
  els.campaignMapImage.style.top = `${viewport.top}px`;
  els.campaignMapImage.style.width = `${viewport.width}px`;
  els.campaignMapImage.style.height = `${viewport.height}px`;
  els.campaignMarkerLayer.style.left = `${viewport.left}px`;
  els.campaignMarkerLayer.style.top = `${viewport.top}px`;
  els.campaignMarkerLayer.style.width = `${viewport.width}px`;
  els.campaignMarkerLayer.style.height = `${viewport.height}px`;
}

function setConfigPoint(pixelX, pixelY) {
  state.configPoint = {
    pixelX: Math.round(pixelX),
    pixelY: Math.round(pixelY)
  };
  els.configPixelX.value = state.configPoint.pixelX;
  els.configPixelY.value = state.configPoint.pixelY;
  setText(els.configReadout, `Captured pixel: ${state.configPoint.pixelX}, ${state.configPoint.pixelY}`);
  renderConfigMarkers();
}

function loadConfigFormFromLocation(name) {
  const location = configuredLocationsForMap(state.selectedMapKey).find((entry) => entry.name === name);
  if (!location) {
    return;
  }

  els.configLocationName.value = location.name;
  els.configPixelX.value = location.pixelX || "";
  els.configPixelY.value = location.pixelY || "";
  els.configWorldX.value = location.gameWorldX ?? "";
  els.configWorldZ.value = location.gameWorldZ ?? "";
  els.configNotes.value = location.notes || "";
  state.configPoint = location.pixelX || location.pixelY ? { pixelX: location.pixelX, pixelY: location.pixelY } : null;
  setText(els.configReadout, `Loaded ${location.name}`);
  renderConfigMarkers();
}

function renderConfigLocationOptions() {
  if (!state.catalog) {
    els.configExistingLocation.innerHTML = "";
    els.configExistingLocation.appendChild(createOption("", "Reload catalog first"));
    return;
  }

  const locations = configuredLocationsForMap(state.selectedMapKey).sort((a, b) => a.name.localeCompare(b.name));
  els.configExistingLocation.innerHTML = "";
  els.configExistingLocation.appendChild(createOption("", "New Location"));
  for (const location of locations) {
    els.configExistingLocation.appendChild(createOption(location.name, location.name));
  }
}

function renderConfigMarkers() {
  const map = mapByKey(state.selectedMapKey);
  if (!map || !state.configImageReady) {
    els.configMarkerLayer.innerHTML = "";
    return;
  }

  applyConfigFrame();
  els.configMarkerLayer.innerHTML = "";

  for (const location of configuredLocationsForMap(map.key)) {
    if (!location.pixelX && !location.pixelY) {
      continue;
    }

    const left = (location.pixelX / map.pixelSize.width) * 100;
    const top = (location.pixelY / map.pixelSize.height) * 100;
    const marker = document.createElement("div");
    marker.className = "config-marker";
    marker.style.left = `${left}%`;
    marker.style.top = `${top}%`;
    marker.dataset.locationName = location.name;
    marker.innerHTML = `
      <div class="config-marker__dot"></div>
      <div class="config-marker__label">${location.name}</div>
    `;
    els.configMarkerLayer.appendChild(marker);
  }

  if (state.configPoint) {
    const crosshair = document.createElement("div");
    crosshair.className = "config-crosshair";
    crosshair.style.left = `${(state.configPoint.pixelX / map.pixelSize.width) * 100}%`;
    crosshair.style.top = `${(state.configPoint.pixelY / map.pixelSize.height) * 100}%`;
    els.configMarkerLayer.appendChild(crosshair);
  }
}

function ownershipClassFor(location) {
  if (location.initialOwner === els.friendlyFaction.value) {
    return "campaign-marker campaign-marker--friendly";
  }

  if (location.initialOwner === els.enemyFaction.value) {
    return "campaign-marker campaign-marker--enemy";
  }

  return "campaign-marker campaign-marker--neutral";
}

function renderCampaignMarkers() {
  const map = mapByKey(state.selectedMapKey);
  if (!map || !state.campaignImageReady) {
    els.campaignMarkerLayer.innerHTML = "";
    return;
  }

  applyCampaignFrame();
  const startingAirfield = resolveGameLocation(map, els.airfieldSelect.value);
  const objectiveLocation = resolveGameLocation(map, els.objectiveTarget.value);
  els.campaignMarkerLayer.innerHTML = "";

  for (const location of getOperationalLocations(map)) {
    if (location.pixelX == null || location.pixelY == null) {
      continue;
    }

    const left = (location.pixelX / map.pixelSize.width) * 100;
    const top = (location.pixelY / map.pixelSize.height) * 100;
    const marker = document.createElement("div");
    marker.className = ownershipClassFor(location);
    marker.style.left = `${left}%`;
    marker.style.top = `${top}%`;
    marker.innerHTML = `
      <div class="campaign-marker__dot"></div>
      <div class="campaign-marker__label">${location.name}</div>
    `;

    if (startingAirfield?.name === location.name) {
      marker.innerHTML += `<div class="campaign-marker__ring"></div>`;
    }

    if (objectiveLocation?.name === location.name) {
      marker.innerHTML += `<div class="campaign-marker__objective"></div>`;
    }

    els.campaignMarkerLayer.appendChild(marker);
  }
}

function renderCampaignView() {
  const map = mapByKey(state.selectedMapKey);
  if (!map) {
    state.campaignImageReady = false;
    els.campaignEmpty.textContent = "Click Reload Catalog to load the selected map.";
    els.campaignEmpty.classList.remove("hidden");
    els.campaignMapImage.removeAttribute("src");
    els.campaignMarkerLayer.innerHTML = "";
    return;
  }

  const resolvedSrc = resolveRendererAsset(map.imagePath);
  const sameImage = els.campaignMapImage.src === resolvedSrc;

  if (!sameImage) {
    state.campaignImageReady = false;
    els.campaignEmpty.textContent = `Loading ${map.label} map...`;
    els.campaignEmpty.classList.remove("hidden");
    els.campaignMapImage.src = resolvedSrc;
  } else if (els.campaignMapImage.complete && els.campaignMapImage.naturalWidth > 0) {
    state.campaignImageReady = true;
    els.campaignEmpty.classList.add("hidden");
  }

  renderCampaignMarkers();
}

function scrollConfigToPixel(pixelX, pixelY) {
  const map = mapByKey(state.selectedMapKey);
  if (!map || !state.configImageReady) {
    return;
  }

  const viewport = getConfigViewport();
  const targetLeft = (pixelX / map.pixelSize.width) * viewport.width;
  const targetTop = (pixelY / map.pixelSize.height) * viewport.height;
  els.configScroll.scrollLeft = Math.max(0, targetLeft - els.configScroll.clientWidth / 2);
  els.configScroll.scrollTop = Math.max(0, targetTop - els.configScroll.clientHeight / 2);
}

function renderConfigView() {
  const map = mapByKey(state.selectedMapKey);
  if (!map) {
    state.configImageReady = false;
    els.configEmpty.textContent = "Click Reload Catalog to load Heartland.";
    els.configEmpty.classList.remove("hidden");
    els.configMapImage.removeAttribute("src");
    els.configMarkerLayer.innerHTML = "";
    renderConfigLocationOptions();
    return;
  }

  const resolvedSrc = resolveRendererAsset(map.imagePath);
  const sameImage = els.configMapImage.src === resolvedSrc;

  if (!sameImage) {
    state.configImageReady = false;
    els.configEmpty.textContent = `Loading ${map.label} map...`;
    els.configEmpty.classList.remove("hidden");
    els.configMapImage.src = resolvedSrc;
  } else if (els.configMapImage.complete && els.configMapImage.naturalWidth > 0) {
    state.configImageReady = true;
    els.configEmpty.classList.add("hidden");
  }

  renderConfigLocationOptions();
  renderConfigMarkers();
}

function showView(view) {
  state.activeView = view;
  document.body.classList.toggle("config-mode", view === "config");
  els.campaignView.classList.toggle("hidden", view !== "campaign");
  els.configView.classList.toggle("hidden", view !== "config");
  els.showCampaignView.className = view === "campaign" ? "secondary" : "ghost";
  els.showConfigView.className = view === "config" ? "secondary" : "ghost";
  updateWorkspaceSummary();
  if (view === "config") {
    renderConfigView();
    return;
  }

  renderCampaignView();
}

function sanitizeIdFragment(value) {
  return (value || "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function getExportLocationName(mapKey, locationName) {
  return LOCATION_EXPORT_NAME_OVERRIDES[mapKey]?.[locationName] || locationName;
}

function createDefenderVehicle(type, faction, name, x, z, angleDegrees) {
  const radians = (angleDegrees * Math.PI) / 180;
  const half = radians / 2;
  return {
    type,
    faction,
    UniqueName: name,
    globalPosition: { x, y: 0, z },
    rotation: { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) },
    CaptureStrength: { IsOverride: false, Value: 0 },
    CaptureDefense: { IsOverride: false, Value: 0 },
    unitCustomID: "",
    spawnTiming: "",
    holdPosition: true,
    skill: 0.7,
    waypoints: []
  };
}

function buildBaselineDefenseVehicles(locations) {
  let index = 0;
  const baselineTypes = ["AFV8_IFV", "AFV8_APC", "SPAAG1"];

  return locations
    .filter((location) => location.initialOwner && location.initialOwner !== "Neutral")
    .flatMap((location) => {
      return Array.from({ length: BASELINE_DEFENDER_COUNT }, (_, vehicleIndex) => {
        index += 1;
        const angle = vehicleIndex * (360 / BASELINE_DEFENDER_COUNT);
        const radius = 140 + vehicleIndex * 35;
        const radians = (angle * Math.PI) / 180;
        const x = Number(location.gameWorldX) + Math.cos(radians) * radius;
        const z = Number(location.gameWorldZ) + Math.sin(radians) * radius;
        const type = baselineTypes[vehicleIndex % baselineTypes.length];
        return createDefenderVehicle(
          type,
          location.initialOwner,
          `baseline_${sanitizeIdFragment(location.name)}_${index}`,
          x,
          z,
          angle + 90
        );
      });
    });
}

function buildObjectiveDefenseVehicles(objectiveLocation) {
  if (!objectiveLocation || objectiveLocation.initialOwner === "Neutral") {
    return [];
  }

  const profileKey = els.objectiveUnitProfile.value || "mixed";
  const profileTypes = OBJECTIVE_PROFILE_TYPES[profileKey] || OBJECTIVE_PROFILE_TYPES.mixed;
  const intensityLevel = Number(els.objectiveIntensity.value || 1);
  const unitCount = OBJECTIVE_FORCE_COUNTS[intensityLevel] || OBJECTIVE_FORCE_COUNTS[1];

  return Array.from({ length: unitCount }, (_, index) => {
    const ringIndex = Math.floor(index / 6);
    const angle = (index % 6) * 60 + ringIndex * 15;
    const radius = 220 + ringIndex * 90;
    const radians = (angle * Math.PI) / 180;
    const x = Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius;
    const z = Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius;
    const type = profileTypes[index % profileTypes.length];
    return createDefenderVehicle(
      type,
      objectiveLocation.initialOwner,
      `objective_${sanitizeIdFragment(objectiveLocation.name)}_${index + 1}`,
      x,
      z,
      angle + 180
    );
  });
}

function buildExportAirbases(map, locations) {
  return locations
    .filter((location) => location.gameWorldX != null && location.gameWorldZ != null)
    .map((location) => {
      const exportName = getExportLocationName(map.key, location.name);
      return {
      UniqueName: exportName,
      DisplayName: exportName,
      faction:
        location.initialOwner && location.initialOwner !== "Neutral"
          ? location.initialOwner
          : els.enemyFaction.value,
      Disabled: false,
      Capturable: true,
      CaptureDefense: 10,
      CaptureRange: 1000,
      Center: { x: location.gameWorldX, y: 0, z: location.gameWorldZ },
      SelectionPosition: { x: location.gameWorldX, y: 0, z: location.gameWorldZ },
      VerticalLandingPoints: [],
      ServicePoints: [],
      roads: { roads: [] },
      runways: []
    };
    });
}

function getCampaignPayload() {
  const map = mapByKey(state.selectedMapKey);
  const locations = getOperationalLocations(map).filter((entry) => entry.gameWorldX != null && entry.gameWorldZ != null);
  const startingAirbase = resolveGameLocation(map, els.airfieldSelect.value);
  const objectiveLocation = getOperationalLocations(map).find((entry) => entry.id === els.objectiveTarget.value || entry.name === els.objectiveTarget.value);

  if (!startingAirbase) {
    throw new Error("Select a valid starting airfield.");
  }

  if (startingAirbase.owner !== els.friendlyFaction.value) {
    throw new Error(`Starting airfield must be owned by ${els.friendlyFaction.value}.`);
  }

  if (!objectiveLocation) {
    throw new Error("Select a valid objective location.");
  }

  if (objectiveLocation.gameWorldX == null || objectiveLocation.gameWorldZ == null) {
    throw new Error("Objective location must have in-game coordinates saved.");
  }

  const factions = [
    {
      factionName: els.friendlyFaction.value,
      preventJoin: false,
      preventDonation: false,
      supplies: DEFAULT_FACTION_SUPPLIES,
      startingBalance: Number(els.startingCash.value || 250000),
      playerJoinAllowance: 20,
      playerTaxRate: 0.2,
      regularIncome: 5,
      excessFundsDistributePercent: 0.25,
      killReward: 1,
      startingWarheads: 0,
      reserveWarheads: 0,
      reserveAirframes: 24,
      extraReservesPerPlayer: 4,
      AIAircraftLimit: 6,
      reduceAIPerFriendlyPlayer: 1,
      addAIPerEnemyPlayer: 1,
      objectives: [],
      restrictions: {
        aircraft: [],
        weapons: []
      },
      cameraStartPosition: {
        IsOverride: false,
        Value: {
          Position: { x: 0, y: 0, z: 0 },
          Rotation: { x: 0, y: 0, z: 0, w: 1 }
        }
      }
    },
    {
      factionName: els.enemyFaction.value,
      preventJoin: false,
      preventDonation: false,
      supplies: DEFAULT_FACTION_SUPPLIES,
      startingBalance: Number(els.startingCash.value || 250000),
      playerJoinAllowance: 0,
      playerTaxRate: 0,
      regularIncome: 5,
      excessFundsDistributePercent: 0.25,
      killReward: 1,
      startingWarheads: 0,
      reserveWarheads: 0,
      reserveAirframes: 24,
      extraReservesPerPlayer: 4,
      AIAircraftLimit: 6,
      reduceAIPerFriendlyPlayer: 1,
      addAIPerEnemyPlayer: 1,
      objectives: [],
      restrictions: {
        aircraft: [],
        weapons: []
      },
      cameraStartPosition: {
        IsOverride: false,
        Value: {
          Position: { x: 0, y: 0, z: 0 },
          Rotation: { x: 0, y: 0, z: 0, w: 1 }
        }
      }
    }
  ];

  return {
    paths: state.catalog.paths,
    campaignName: els.campaignName.value,
    parameters: {
      description: els.description.value,
      mapKey: map.key,
      mapLabel: map.label,
      startingAirbase: startingAirbase.name,
      objectiveLocation: objectiveLocation.name,
      objectiveUnitProfile: els.objectiveUnitProfile.value,
      objectiveIntensity: OBJECTIVE_INTENSITY_LABELS[Number(els.objectiveIntensity.value || 1)] || "Medium",
      startingRank: Number(els.startingRank.value || 5),
      startingCash: Number(els.startingCash.value || 250000),
      allowRespawn: els.allowRespawn.checked,
      timeOfDay: Number(els.timeOfDay.value || 10),
      weatherIntensity: Number(els.weatherIntensity.value || 0.2),
      threatProfile: {
        samSites: els.enableSam.checked,
        artillery: els.enableArtillery.checked,
        factories: els.enableFactories.checked,
        groundUnits: els.enableGround.checked,
        ships: els.enableShips.checked
      }
    },
    initialState: {
      mapKey: map.key,
      mapLabel: map.label,
      startingAirbase,
      objectiveLocation: {
        name: objectiveLocation.name,
        owner: objectiveLocation.initialOwner,
        gameWorldX: objectiveLocation.gameWorldX,
        gameWorldZ: objectiveLocation.gameWorldZ,
        profile: els.objectiveUnitProfile.value,
        intensity: OBJECTIVE_INTENSITY_LABELS[Number(els.objectiveIntensity.value || 1)] || "Medium"
      },
      factions,
      locations,
      airbases: buildExportAirbases(map, locations),
      ownershipVehicles: [
        ...buildBaselineDefenseVehicles(locations),
        ...buildObjectiveDefenseVehicles(objectiveLocation)
      ]
    }
  };
}

async function exportCampaign() {
  try {
    const result = await window.nuclearOptionApi.exportCampaign(getCampaignPayload());
    if (!result?.ok) {
      els.output.textContent = "Export failed.";
      return;
    }

    const installLine = result.installed
      ? `<div>Installed to game missions: ${result.installedMissionFolder}</div>`
      : `<div>Install to game missions failed: ${result.installError || "unknown error"}</div>`;

    els.output.innerHTML = `
      <div>Campaign exported.</div>
      <div>${result.campaignPath}</div>
      <div>${result.missionFolder}</div>
      ${installLine}
    `;
  } catch (error) {
    els.output.innerHTML = `<div>${error.message}</div>`;
  }
}

async function saveConfiguredLocation() {
  const payload = {
    mapKey: state.selectedMapKey,
    name: els.configLocationName.value.trim(),
    pixelX: Number(els.configPixelX.value),
    pixelY: Number(els.configPixelY.value),
    gameWorldX: els.configWorldX.value,
    gameWorldZ: els.configWorldZ.value,
    notes: els.configNotes.value
  };

  const result = await window.nuclearOptionApi.saveLocation(payload);
  if (!result?.ok) {
    return;
  }

  els.output.innerHTML = `
    <div>Location saved.</div>
    <div>${result.row.name} -> pixel ${result.row.pixelX}, ${result.row.pixelY}</div>
    <div>${result.filePath}</div>
  `;

  upsertConfiguredLocationInState(result.row);
  state.configPoint = {
    pixelX: result.row.pixelX,
    pixelY: result.row.pixelY
  };
  renderLocationOptions();
  renderObjectiveOptions();
  renderOwnershipList();
  renderConfigLocationOptions();
  updateWorkspaceSummary();
  renderCampaignMarkers();
  els.configExistingLocation.value = result.row.name;
  loadConfigFormFromLocation(result.row.name);
  renderConfigMarkers();
  scrollConfigToPixel(result.row.pixelX, result.row.pixelY);
}

async function saveOwnershipChange(name, initialOwner) {
  const result = await window.nuclearOptionApi.saveLocationOwnership({
    mapKey: state.selectedMapKey,
    name,
    initialOwner
  });

  if (!result?.ok) {
    els.output.innerHTML = `<div>Failed to save ownership for ${name}.</div>`;
    return;
  }

  updateLocationOwnerInState(result.row.mapKey, result.row.name, result.row.initialOwner);
  renderLocationOptions();
  renderObjectiveOptions();
  renderOwnershipList();
  updateWorkspaceSummary();
  renderCampaignMarkers();
  els.output.innerHTML = `
    <div>Ownership updated.</div>
    <div>${result.row.name} -> ${result.row.initialOwner}</div>
    <div>${result.filePath}</div>
  `;
}

function onConfigMapClick(event) {
  if (!state.configImageReady) {
    return;
  }

  const map = mapByKey(state.selectedMapKey);
  const rect = els.configCanvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const width = rect.width || 1;
  const height = rect.height || 1;

  if (localX < 0 || localX > width || localY < 0 || localY > height) {
    return;
  }

  setConfigPoint((localX / width) * map.pixelSize.width, (localY / height) * map.pixelSize.height);
}

function onConfigMarkerClick(event) {
  const marker = event.target.closest(".config-marker");
  if (!marker) {
    return;
  }

  event.stopPropagation();
  const name = marker.dataset.locationName;
  els.configExistingLocation.value = name;
  loadConfigFormFromLocation(name);
}

function bindEvents() {
  els.mapSelect.addEventListener("change", () => {
    if (!state.catalog) {
      return;
    }

    state.selectedMapKey = els.mapSelect.value;
    state.configPoint = null;
    renderLocationOptions();
    renderObjectiveOptions();
    renderOwnershipList();
    renderConfigLocationOptions();
    updateWorkspaceSummary();
    if (state.activeView === "config") {
      renderConfigView();
      return;
    }

    renderCampaignView();
  });

  els.airfieldSelect.addEventListener("change", () => {
    updateWorkspaceSummary();
    renderCampaignMarkers();
  });
  els.objectiveTarget.addEventListener("change", () => {
    updateWorkspaceSummary();
    renderCampaignMarkers();
  });
  els.objectiveUnitProfile.addEventListener("change", updateWorkspaceSummary);
  els.objectiveIntensity.addEventListener("input", () => {
    renderObjectiveIntensityValue();
    updateWorkspaceSummary();
  });
  els.friendlyFaction.addEventListener("change", () => {
    renderLocationOptions();
    renderObjectiveOptions();
    renderOwnershipList();
    updateWorkspaceSummary();
    renderCampaignMarkers();
  });
  els.enemyFaction.addEventListener("change", () => {
    renderObjectiveOptions();
    renderOwnershipList();
    updateWorkspaceSummary();
    renderCampaignMarkers();
  });

  els.ownershipList.addEventListener("change", (event) => {
    const select = event.target.closest("[data-owner-select]");
    if (!select) {
      return;
    }

    saveOwnershipChange(select.dataset.ownerSelect, select.value);
  });

  els.showCampaignView.addEventListener("click", () => showView("campaign"));
  els.showConfigView.addEventListener("click", () => showView("config"));
  els.campaignMapImage.addEventListener("load", () => {
    state.campaignImageReady = true;
    els.campaignEmpty.classList.add("hidden");
    renderCampaignMarkers();
  });
  els.campaignMapImage.addEventListener("error", () => {
    state.campaignImageReady = false;
    els.campaignEmpty.textContent = "Campaign map failed to load.";
    els.campaignEmpty.classList.remove("hidden");
  });
  els.configMapImage.addEventListener("load", () => {
    state.configImageReady = true;
    els.configEmpty.classList.add("hidden");
    renderConfigMarkers();
  });
  els.configMapImage.addEventListener("error", () => {
    state.configImageReady = false;
    els.configEmpty.textContent = "Map image failed to load.";
    els.configEmpty.classList.remove("hidden");
  });
  els.configZoom.addEventListener("input", () => {
    state.configZoom = Number(els.configZoom.value || 1);
    if (state.activeView === "config" && state.configImageReady) {
      renderConfigMarkers();
      return;
    }

    if (state.activeView === "campaign" && state.campaignImageReady) {
      renderCampaignMarkers();
    }
  });
  els.configStage.addEventListener("click", onConfigMapClick);
  els.configMarkerLayer.addEventListener("click", onConfigMarkerClick);
  els.configExistingLocation.addEventListener("change", () => {
    if (!els.configExistingLocation.value) {
      els.configLocationName.value = "";
      els.configPixelX.value = "";
      els.configPixelY.value = "";
      els.configWorldX.value = "";
      els.configWorldZ.value = "";
      els.configNotes.value = "";
      state.configPoint = null;
      renderConfigMarkers();
      return;
    }

    loadConfigFormFromLocation(els.configExistingLocation.value);
  });
  els.saveConfigLocation.addEventListener("click", saveConfiguredLocation);
  window.addEventListener("resize", () => {
    if (state.activeView === "config") {
      renderConfigMarkers();
      return;
    }

    renderCampaignMarkers();
  });

  document.getElementById("generate-campaign").addEventListener("click", exportCampaign);
  document.getElementById("reload-catalog").addEventListener("click", loadCatalog);
}

async function loadCatalog() {
  setText(els.scanMeta, "Scanning local install and mission folders...");
  state.catalog = await window.nuclearOptionApi.loadCatalog();
  state.selectedMapKey =
    state.catalog.maps.find((entry) => entry.key === "Terrain1")?.key ||
    state.catalog.maps[0]?.key ||
    "Terrain1";
  renderStats();
  renderMapOptions();
  renderFactionOptions();
  renderLocationOptions();
  renderObjectiveOptions();
  renderObjectiveIntensityValue();
  renderOwnershipList();
  renderConfigLocationOptions();
  updateWorkspaceSummary();
  updateScanMeta();
  renderCampaignView();
}

bindEvents();
state.configZoom = Number(els.configZoom?.value || 1);
renderObjectiveIntensityValue();
showView("campaign");
updateWorkspaceSummary();
renderCampaignView();
renderConfigView();
setText(els.scanMeta, "Loading saved campaign state...");
window.setTimeout(() => {
  loadCatalog().catch((error) => {
    setText(els.scanMeta, `Auto-load failed: ${error.message}`);
  });
}, AUTOLOAD_DELAY_MS);

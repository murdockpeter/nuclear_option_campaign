const state = {
  catalog: null,
  selectedMapKey: "Terrain1",
  activeView: "campaign",
  configPoint: null,
  configImageReady: false,
  configZoom: 1
};

const els = {
  scanMeta: document.getElementById("scan-meta"),
  catalogStats: document.getElementById("catalog-stats"),
  missionList: document.getElementById("mission-list"),
  mapSelect: document.getElementById("map-select"),
  airfieldSelect: document.getElementById("airfield-select"),
  targetLocation: document.getElementById("target-location"),
  friendlyFaction: document.getElementById("friendly-faction"),
  enemyFaction: document.getElementById("enemy-faction"),
  seedMission: document.getElementById("seed-mission"),
  mapTitle: document.getElementById("map-title"),
  mapSubtitle: document.getElementById("map-subtitle"),
  workspaceMap: document.getElementById("workspace-map"),
  workspaceStart: document.getElementById("workspace-start"),
  workspaceTarget: document.getElementById("workspace-target"),
  workspaceScenarios: document.getElementById("workspace-scenarios"),
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
  scenarioCount: document.getElementById("scenario-count"),
  showCampaignView: document.getElementById("show-campaign-view"),
  showConfigView: document.getElementById("show-config-view"),
  campaignView: document.getElementById("campaign-view"),
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

function configuredLocationsForMap(mapKey) {
  return state.catalog?.configuredLocationsByMap?.[mapKey] || [];
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
    notes: row.notes || ""
  };

  if (existingIndex >= 0) {
    list[existingIndex] = next;
  } else {
    list.push(next);
  }
}

function renderStats() {
  const userCount = state.catalog.userMissions.filter((item) => item.status === "ok").length;
  const tempCount = state.catalog.tempMissions.filter((item) => item.status === "ok").length;
  const mapCount = state.catalog.maps.length;

  els.catalogStats.innerHTML = `
    <div class="stat-card"><strong>${userCount}</strong><span>User Missions</span></div>
    <div class="stat-card"><strong>${tempCount}</strong><span>Temp Missions</span></div>
    <div class="stat-card"><strong>${mapCount}</strong><span>Known Maps</span></div>
  `;
}

function renderMissionList() {
  const items = [...state.catalog.userMissions, ...state.catalog.tempMissions]
    .filter((entry) => entry.status === "ok")
    .sort((a, b) => a.missionName.localeCompare(b.missionName));

  if (items.length === 0) {
    els.missionList.innerHTML =
      `<div class="mission-card">No readable mission folders were found in the configured AppData paths.</div>`;
    return;
  }

  els.missionList.innerHTML = items
    .map(
      (entry) => `
        <article class="mission-card">
          <div class="mission-card__title">${entry.missionName}</div>
          <div class="mission-card__meta">${entry.summary.mapLabel} • ${entry.summary.counts.objectives} objectives</div>
          <div class="mission-card__meta">${entry.summary.factions.map((name) => `<span class="pill">${name}</span>`).join("")}</div>
        </article>
      `
    )
    .join("");
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

function renderSeedMissions() {
  const items = [...state.catalog.userMissions, ...state.catalog.tempMissions]
    .filter((entry) => entry.status === "ok")
    .sort((a, b) => a.missionName.localeCompare(b.missionName));

  els.seedMission.innerHTML = "";
  for (const item of items) {
    els.seedMission.appendChild(createOption(item.folderName, item.missionName));
  }
}

function renderLocationOptions() {
  if (!state.catalog) {
    els.airfieldSelect.innerHTML = "";
    els.targetLocation.innerHTML = "";
    return;
  }

  const map = mapByKey(state.selectedMapKey);
  const namedLocations = configuredLocationsForMap(map.key);
  const fallbackLocations = [...map.airfields].map((airfield) => ({
    id: airfield.id,
    name: airfield.name
  }));
  const source = (namedLocations.length ? namedLocations.map((entry) => ({
    id: entry.name,
    name: entry.name
  })) : fallbackLocations).sort((a, b) => a.name.localeCompare(b.name));

  els.airfieldSelect.innerHTML = "";
  els.targetLocation.innerHTML = "";

  for (const location of source) {
    els.airfieldSelect.appendChild(createOption(location.id, location.name));
    els.targetLocation.appendChild(createOption(location.id, location.name));
  }

  if (source.length) {
    els.airfieldSelect.value = source[0].id;
    els.targetLocation.value = source[Math.min(1, source.length - 1)].id;
  }
}

function resolveGameLocation(map, selectedValue) {
  const configured = configuredLocationsForMap(map.key).find((entry) => entry.name === selectedValue);
  if (configured) {
    return {
      id: configured.name,
      name: configured.name,
      x: configured.gameWorldX,
      z: configured.gameWorldZ
    };
  }

  const airfield = map.airfields.find((entry) => entry.id === selectedValue || entry.name === selectedValue);
  if (airfield) {
    return {
      id: airfield.id,
      name: airfield.name,
      x: airfield.x,
      z: airfield.z
    };
  }

  return null;
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
    setText(els.workspaceTarget, "-");
    setText(els.workspaceScenarios, String(Number(els.scenarioCount.value || 3)));
    return;
  }

  const startingAirbase = resolveGameLocation(map, els.airfieldSelect.value);
  const target = resolveGameLocation(map, els.targetLocation.value);

  setText(els.mapTitle, state.activeView === "campaign" ? map.label : `${map.label} Location Config`);
  setText(
    els.mapSubtitle,
    state.activeView === "campaign"
      ? "Map-free workflow using named location selectors and CSV-backed coordinates."
      : "Click a map point, name the location, then enter the in-game X/Z coordinates."
  );
  setText(els.workspaceMap, map.label);
  setText(els.workspaceStart, startingAirbase?.name || "-");
  setText(els.workspaceTarget, target?.name || "-");
  setText(els.workspaceScenarios, String(Number(els.scenarioCount.value || 3)));
}

function updateScanMeta() {
  const pathInfo = state.catalog.paths;
  const installExists = state.catalog.install.exists ? "install found" : "install missing";
  setText(
    els.scanMeta,
    `${installExists} • missions: ${pathInfo.missionsPath} • scanned ${new Date(state.catalog.scannedAt).toLocaleString()}`
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

function scrollConfigToPixel(pixelX, pixelY) {
  const map = mapByKey(state.selectedMapKey);
  if (!map || !state.configImageReady) {
    return;
  }

  const viewport = getConfigViewport();
  const targetLeft = (pixelX / map.pixelSize.width) * viewport.width;
  const targetTop = (pixelY / map.pixelSize.height) * viewport.height;
  const nextLeft = Math.max(0, targetLeft - els.configScroll.clientWidth / 2);
  const nextTop = Math.max(0, targetTop - els.configScroll.clientHeight / 2);
  els.configScroll.scrollLeft = nextLeft;
  els.configScroll.scrollTop = nextTop;
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
  }
}

function getCampaignPayload() {
  const map = mapByKey(state.selectedMapKey);
  const startingAirbase = resolveGameLocation(map, els.airfieldSelect.value) || resolveGameLocation(map, els.targetLocation.value);
  const targetLocation = resolveGameLocation(map, els.targetLocation.value) || startingAirbase;
  const scenarioCount = Number(els.scenarioCount.value || 3);

  const factions = [
    {
      factionName: els.friendlyFaction.value,
      startingBalance: Number(els.startingCash.value || 250000),
      playerJoinAllowance: 20,
      playerTaxRate: 0.2,
      regularIncome: 5,
      killReward: 1,
      restrictions: {}
    },
    {
      factionName: els.enemyFaction.value,
      startingBalance: Number(els.startingCash.value || 250000),
      playerJoinAllowance: 0,
      playerTaxRate: 0,
      regularIncome: 5,
      killReward: 1,
      restrictions: {}
    }
  ];

  const airbases = configuredLocationsForMap(map.key)
    .filter((entry) => entry.gameWorldX != null && entry.gameWorldZ != null)
    .map((entry) => ({
      UniqueName: entry.name,
      DisplayName: entry.name,
      faction: els.enemyFaction.value,
      Disabled: false,
      Capturable: true,
      CaptureDefense: 10,
      CaptureRange: 1000,
      Center: { x: entry.gameWorldX, y: 0, z: entry.gameWorldZ },
      SelectionPosition: { x: entry.gameWorldX, y: 0, z: entry.gameWorldZ },
      VerticalLandingPoints: [],
      ServicePoints: [],
      roads: { roads: [] },
      runways: []
    }));

  const generatedScenarios = Array.from({ length: scenarioCount }, (_, index) => ({
    id: `scenario-${index + 1}`,
    name: `${els.campaignName.value} - Scenario ${index + 1}`,
    mapKey: map.key,
    mapLabel: map.label,
    startingAirbase: startingAirbase?.name || "",
    targetLocation,
    threatProfile: {
      samSites: els.enableSam.checked,
      artillery: els.enableArtillery.checked,
      factories: els.enableFactories.checked,
      groundUnits: els.enableGround.checked,
      ships: els.enableShips.checked
    },
    factions,
    airbases
  }));

  return {
    paths: state.catalog.paths,
    campaignName: els.campaignName.value,
    parameters: {
      description: els.description.value,
      mapKey: map.key,
      mapLabel: map.label,
      startingAirbase: startingAirbase?.name || "",
      targetLocation,
      startingRank: Number(els.startingRank.value || 5),
      startingCash: Number(els.startingCash.value || 250000),
      allowRespawn: els.allowRespawn.checked,
      timeOfDay: Number(els.timeOfDay.value || 10),
      weatherIntensity: Number(els.weatherIntensity.value || 0.2),
      seedMission: els.seedMission.value
    },
    generatedScenarios
  };
}

async function exportCampaign() {
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
    <div>${result.row.name} → pixel ${result.row.pixelX}, ${result.row.pixelY}</div>
    <div>${result.filePath}</div>
  `;

  upsertConfiguredLocationInState(result.row);
  state.configPoint = {
    pixelX: result.row.pixelX,
    pixelY: result.row.pixelY
  };
  renderLocationOptions();
  renderConfigLocationOptions();
  els.configExistingLocation.value = result.row.name;
  loadConfigFormFromLocation(result.row.name);
  renderConfigMarkers();
  scrollConfigToPixel(result.row.pixelX, result.row.pixelY);
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

  const pixelX = (localX / width) * map.pixelSize.width;
  const pixelY = (localY / height) * map.pixelSize.height;
  setConfigPoint(pixelX, pixelY);
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
    renderConfigLocationOptions();
    updateWorkspaceSummary();
    if (state.activeView === "config") {
      renderConfigView();
    }
  });

  els.airfieldSelect.addEventListener("change", updateWorkspaceSummary);
  els.targetLocation.addEventListener("change", updateWorkspaceSummary);
  els.scenarioCount.addEventListener("input", updateWorkspaceSummary);
  els.showCampaignView.addEventListener("click", () => showView("campaign"));
  els.showConfigView.addEventListener("click", () => showView("config"));
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
    }
  });

  document.getElementById("generate-campaign").addEventListener("click", exportCampaign);
  document.getElementById("reload-catalog").addEventListener("click", loadCatalog);
}

async function loadCatalog() {
  setText(els.scanMeta, "Scanning local install and mission folders...");
  state.catalog = await window.nuclearOptionApi.loadCatalog();
  state.selectedMapKey = state.catalog.maps.find((entry) => entry.key === "Terrain1")?.key || state.catalog.maps[0]?.key || "Terrain1";
  renderStats();
  renderMissionList();
  renderMapOptions();
  renderFactionOptions();
  renderSeedMissions();
  renderLocationOptions();
  renderConfigLocationOptions();
  updateWorkspaceSummary();
  updateScanMeta();
}

bindEvents();
state.configZoom = Number(els.configZoom?.value || 1);
showView("campaign");
updateWorkspaceSummary();
renderConfigView();
setText(els.scanMeta, "Click Reload Catalog to initialize the app.");

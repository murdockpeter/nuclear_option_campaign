const state = {
  catalog: null,
  campaignState: null,
  appSettings: null,
  selectedMapKey: "Terrain1",
  activeView: "campaign",
  campaignImageReady: false,
  advancedImageReady: false,
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
const TURN_FUNDS_PER_OWNED_LOCATION = 25000;
const TURN_SUPPLY_REPLENISH_PER_TYPE = 2;
const TURN_SUPPLY_CAP_PER_TYPE = 24;
const TURN_RESERVE_AIRFRAME_REPLENISH = 6;
const DEFAULT_FACTION_SUPPLIES = [
  { unitType: "COIN", count: 12 },
  { unitType: "trainer", count: 12 },
  { unitType: "AttackHelo1", count: 12 },
  { unitType: "UtilityHelo1", count: 12 },
  { unitType: "CAS1", count: 12 },
  { unitType: "Multirole1", count: 12 },
  { unitType: "SmallFighter1", count: 12 },
  { unitType: "QuadVTOL1", count: 12 },
  { unitType: "FastBomber1", count: 12 },
  { unitType: "EW1", count: 12 }
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
const FACTORY_BUILDING_TYPES = ["factory_large", "factory_tall"];
const FACTORY_PRODUCTION_TYPES = ["COIN", "AttackHelo1", "CAS1", "Multirole1"];
const AIR_PATROL_TYPES = {
  helicopters: ["AttackHelo1", "UtilityHelo1"],
  fixedWing: ["SmallFighter1", "Multirole1", "CAS1"]
};
const AIRCRAFT_TEMPLATE_BY_TYPE = {
  AttackHelo1: {
    loadout: { weaponSelections: [1, 1, 3, 2] },
    savedLoadout: {
      Selected: [
        { Key: "turret_30mmHE_750" },
        { Key: "AGM1_quad_internal" },
        { Key: "AGM_heavyx2" },
        { Key: "AAM1_single" }
      ]
    },
    livery: 3,
    liveryType: 0,
    liveryName: "",
    fuel: 1,
    skill: 1,
    bravery: 0.5,
    startingSpeed: 0
  },
  SmallFighter1: {
    loadout: { weaponSelections: [1, 2, 1, 14, 2] },
    savedLoadout: {
      Selected: [
        { Key: "gun_20mm_internal_500" },
        { Key: "AAM2_single_internal" },
        { Key: "AAM2_single_internal" },
        { Key: "AShM2_double" },
        { Key: "AAM1_single" }
      ]
    },
    livery: 0,
    liveryType: 0,
    liveryName: "",
    fuel: 1,
    skill: 1,
    bravery: 0.5,
    startingSpeed: 0
  },
  Multirole1: {
    loadout: { weaponSelections: [1, 1, 1, 12, 10, 1] },
    savedLoadout: {
      Selected: [
        { Key: "autocannon_27mm_internal" },
        { Key: "AAM2_triple_internal" },
        { Key: "AAM2_triple_internal" },
        { Key: "AShM1_single" },
        { Key: "AShM1_single" },
        { Key: "TailHook_Multirole1" }
      ]
    },
    livery: 3,
    liveryType: 0,
    liveryName: "",
    fuel: 0.4,
    skill: 1,
    bravery: 0.5,
    startingSpeed: 0
  }
};

const els = {
  scanMeta: document.getElementById("scan-meta"),
  installPathReadout: document.getElementById("install-path-readout"),
  catalogStats: document.getElementById("catalog-stats"),
  campaignStateSummary: document.getElementById("campaign-state-summary"),
  campaignLogistics: document.getElementById("campaign-logistics"),
  applyCampaignResolution: document.getElementById("apply-campaign-resolution"),
  ownershipList: document.getElementById("ownership-list"),
  mapSelect: document.getElementById("map-select"),
  airfieldSelect: document.getElementById("airfield-select"),
  friendlyFaction: document.getElementById("friendly-faction"),
  enemyFaction: document.getElementById("enemy-faction"),
  objectiveTarget: document.getElementById("objective-target"),
  objectiveUnitProfile: document.getElementById("objective-unit-profile"),
  objectiveIntensity: document.getElementById("objective-intensity"),
  objectiveIntensityValue: document.getElementById("objective-intensity-value"),
  openAdvancedTargets: document.getElementById("open-advanced-targets"),
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
  showAdvancedView: document.getElementById("show-advanced-view"),
  campaignView: document.getElementById("campaign-view"),
  campaignStage: document.getElementById("campaign-stage"),
  campaignTopScroll: document.getElementById("campaign-top-scroll"),
  campaignTopScrollTrack: document.getElementById("campaign-top-scroll-track"),
  campaignScroll: document.getElementById("campaign-scroll"),
  campaignCanvas: document.getElementById("campaign-canvas"),
  campaignEmpty: document.getElementById("campaign-empty"),
  campaignMapImage: document.getElementById("campaign-map-image"),
  campaignMarkerLayer: document.getElementById("campaign-marker-layer"),
  advancedView: document.getElementById("advanced-view"),
  advancedStage: document.getElementById("advanced-stage"),
  advancedScroll: document.getElementById("advanced-scroll"),
  advancedCanvas: document.getElementById("advanced-canvas"),
  advancedEmpty: document.getElementById("advanced-empty"),
  advancedMapImage: document.getElementById("advanced-map-image"),
  advancedMarkerLayer: document.getElementById("advanced-marker-layer"),
  advancedSummaryObjective: document.getElementById("advanced-summary-objective"),
  advancedSummaryPackage: document.getElementById("advanced-summary-package"),
  advancedSummaryThreats: document.getElementById("advanced-summary-threats"),
  advancedObjectiveSamSites: document.getElementById("advanced-objective-sam-sites"),
  advancedObjectiveArtillerySites: document.getElementById("advanced-objective-artillery-sites"),
  advancedObjectiveFactoryBuildings: document.getElementById("advanced-objective-factory-buildings"),
  advancedObjectiveTankUnits: document.getElementById("advanced-objective-tank-units"),
  advancedObjectiveIfvUnits: document.getElementById("advanced-objective-ifv-units"),
  advancedResistanceScatteredGround: document.getElementById("advanced-resistance-scattered-ground"),
  advancedResistanceAaa: document.getElementById("advanced-resistance-aaa"),
  advancedResistanceShortSam: document.getElementById("advanced-resistance-short-sam"),
  advancedResistanceMediumSam: document.getElementById("advanced-resistance-medium-sam"),
  advancedResistanceHelicopters: document.getElementById("advanced-resistance-helicopters"),
  advancedResistanceFixedWing: document.getElementById("advanced-resistance-fixed-wing"),
  advancedFrontlinePairs: document.getElementById("advanced-frontline-pairs"),
  advancedFrontlinePatrolGroups: document.getElementById("advanced-frontline-patrol-groups"),
  advancedFrontlineConvoyGroups: document.getElementById("advanced-frontline-convoy-groups"),
  advancedLocalePatrolGroups: document.getElementById("advanced-locale-patrol-groups"),
  advancedObjectivePatrolGroups: document.getElementById("advanced-objective-patrol-groups"),
  advancedHelicopterPatrolCount: document.getElementById("advanced-helicopter-patrol-count"),
  advancedHelicopterPatrolRadius: document.getElementById("advanced-helicopter-patrol-radius"),
  advancedFixedWingPatrolCount: document.getElementById("advanced-fixed-wing-patrol-count"),
  advancedFixedWingPatrolRadius: document.getElementById("advanced-fixed-wing-patrol-radius"),
  advancedRandomness: document.getElementById("advanced-randomness"),
  advancedRandomnessValue: document.getElementById("advanced-randomness-value"),
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
  ,
  setInstallPath: document.getElementById("set-install-path"),
  clearInstallPath: document.getElementById("clear-install-path")
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

function loadImageAsset(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image asset: ${src}`));
    image.src = src;
  });
}

function normalizeName(value) {
  return (value || "").trim().toLowerCase();
}

function cloneSupplies(supplies = DEFAULT_FACTION_SUPPLIES) {
  return supplies
    .filter((entry) => entry?.unitType && entry.unitType !== "Revoker")
    .map((entry) => ({ unitType: entry.unitType, count: Number(entry.count || 0) }));
}

function cloneWaypoints(waypoints = []) {
  return waypoints.map((waypoint) => ({
    position: {
      x: Number(waypoint.position?.x ?? 0),
      y: Number(waypoint.position?.y ?? 0),
      z: Number(waypoint.position?.z ?? 0)
    },
    objective: waypoint.objective || "Unit Spawn"
  }));
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numeric));
}

function getAdvancedThreatSettings() {
  return {
    objectivePackage: {
      samSites: clampNumber(els.advancedObjectiveSamSites?.value, 0, 12, 2),
      artillerySites: clampNumber(els.advancedObjectiveArtillerySites?.value, 0, 12, 2),
      factoryBuildings: clampNumber(els.advancedObjectiveFactoryBuildings?.value, 0, 12, 2),
      tankUnits: clampNumber(els.advancedObjectiveTankUnits?.value, 0, 24, 4),
      ifvUnits: clampNumber(els.advancedObjectiveIfvUnits?.value, 0, 24, 4)
    },
    operationalResistance: {
      scatteredGroundVehicles: Boolean(els.advancedResistanceScatteredGround?.checked),
      antiAirArtillery: Boolean(els.advancedResistanceAaa?.checked),
      shortRangeSam: Boolean(els.advancedResistanceShortSam?.checked),
      mediumRangeSam: Boolean(els.advancedResistanceMediumSam?.checked),
      helicopters: Boolean(els.advancedResistanceHelicopters?.checked),
      fixedWingPatrols: Boolean(els.advancedResistanceFixedWing?.checked)
    },
    patrolPlan: {
      frontlinePairs: clampNumber(els.advancedFrontlinePairs?.value, 0, 8, 4),
      frontlinePatrolGroups: clampNumber(els.advancedFrontlinePatrolGroups?.value, 0, 8, 4),
      convoyGroups: clampNumber(els.advancedFrontlineConvoyGroups?.value, 0, 8, 4),
      localePatrolGroups: clampNumber(els.advancedLocalePatrolGroups?.value, 0, 12, 4),
      objectivePatrolGroups: clampNumber(els.advancedObjectivePatrolGroups?.value, 0, 8, 3),
      helicopterPatrols: clampNumber(els.advancedHelicopterPatrolCount?.value, 0, 8, 2),
      helicopterPatrolRadius: clampNumber(els.advancedHelicopterPatrolRadius?.value, 250, 6000, 900),
      fixedWingPatrols: clampNumber(els.advancedFixedWingPatrolCount?.value, 0, 8, 2),
      fixedWingPatrolRadius: clampNumber(els.advancedFixedWingPatrolRadius?.value, 500, 12000, 2600),
      randomnessPercent: clampNumber(els.advancedRandomness?.value, 0, 100, 35)
    }
  };
}

function applyAdvancedThreatSettings(settings = {}) {
  const objectivePackage = settings.objectivePackage || {};
  const operationalResistance = settings.operationalResistance || {};
  const patrolPlan = settings.patrolPlan || {};

  if (els.advancedObjectiveSamSites) {
    els.advancedObjectiveSamSites.value = clampNumber(objectivePackage.samSites, 0, 12, 2);
    els.advancedObjectiveArtillerySites.value = clampNumber(objectivePackage.artillerySites, 0, 12, 2);
    els.advancedObjectiveFactoryBuildings.value = clampNumber(objectivePackage.factoryBuildings, 0, 12, 2);
    els.advancedObjectiveTankUnits.value = clampNumber(objectivePackage.tankUnits, 0, 24, 4);
    els.advancedObjectiveIfvUnits.value = clampNumber(objectivePackage.ifvUnits, 0, 24, 4);
    els.advancedResistanceScatteredGround.checked = operationalResistance.scatteredGroundVehicles ?? true;
    els.advancedResistanceAaa.checked = operationalResistance.antiAirArtillery ?? true;
    els.advancedResistanceShortSam.checked = operationalResistance.shortRangeSam ?? true;
    els.advancedResistanceMediumSam.checked = operationalResistance.mediumRangeSam ?? true;
    els.advancedResistanceHelicopters.checked = operationalResistance.helicopters ?? true;
    els.advancedResistanceFixedWing.checked = operationalResistance.fixedWingPatrols ?? true;
    els.advancedFrontlinePairs.value = clampNumber(patrolPlan.frontlinePairs, 0, 8, 4);
    els.advancedFrontlinePatrolGroups.value = clampNumber(patrolPlan.frontlinePatrolGroups, 0, 8, 4);
    els.advancedFrontlineConvoyGroups.value = clampNumber(patrolPlan.convoyGroups, 0, 8, 4);
    els.advancedLocalePatrolGroups.value = clampNumber(patrolPlan.localePatrolGroups, 0, 12, 4);
    els.advancedObjectivePatrolGroups.value = clampNumber(patrolPlan.objectivePatrolGroups, 0, 8, 3);
    els.advancedHelicopterPatrolCount.value = clampNumber(patrolPlan.helicopterPatrols, 0, 8, 2);
    els.advancedHelicopterPatrolRadius.value = clampNumber(patrolPlan.helicopterPatrolRadius, 250, 6000, 900);
    els.advancedFixedWingPatrolCount.value = clampNumber(patrolPlan.fixedWingPatrols, 0, 8, 2);
    els.advancedFixedWingPatrolRadius.value = clampNumber(patrolPlan.fixedWingPatrolRadius, 500, 12000, 2600);
    els.advancedRandomness.value = clampNumber(patrolPlan.randomnessPercent, 0, 100, 35);
  }

  renderAdvancedRandomnessValue();
}

function renderAdvancedRandomnessValue() {
  if (!els.advancedRandomnessValue) {
    return;
  }
  const value = clampNumber(els.advancedRandomness?.value, 0, 100, 35);
  setText(els.advancedRandomnessValue, `${value}%`);
}

function getPersistedLocationState(locationName) {
  return state.campaignState?.locations?.find((entry) => normalizeName(entry.name) === normalizeName(locationName)) || null;
}

function getPersistedFactionState(factionName) {
  const existing = state.campaignState?.factions?.find((entry) => entry.factionName === factionName);
  if (existing) {
    return {
      factionName,
      startingBalance: Number(existing.startingBalance ?? 250000),
      reserveAirframes: Number(existing.reserveAirframes ?? 72),
      extraReservesPerPlayer: Number(existing.extraReservesPerPlayer ?? 12),
      supplies: cloneSupplies(existing.supplies?.length ? existing.supplies : DEFAULT_FACTION_SUPPLIES)
    };
  }

  return {
    factionName,
    startingBalance: Number(els.startingCash?.value || 250000),
    reserveAirframes: 72,
    extraReservesPerPlayer: 12,
    supplies: cloneSupplies(DEFAULT_FACTION_SUPPLIES)
  };
}

function configuredLocationsForMap(mapKey) {
  return (state.catalog?.configuredLocationsByMap?.[mapKey] || []).filter((entry) => {
    return !HIDDEN_LOCATION_NAMES.has(entry.name);
  });
}

function inferDefaultOwner(map, locationName) {
  const persisted = getPersistedLocationState(locationName);
  if (persisted?.owner) {
    return persisted.owner;
  }

  const known = map?.airfields?.find((entry) => {
    return normalizeName(entry.name) === normalizeName(locationName) || normalizeName(entry.id) === normalizeName(locationName);
  });

  return known?.faction || "Neutral";
}

function inferDefaultAltitude(map, locationName) {
  const known = map?.airfields?.find((entry) => {
    return normalizeName(entry.name) === normalizeName(locationName) || normalizeName(entry.id) === normalizeName(locationName);
  });

  return known?.y ?? 0;
}

function getOperationalLocations(map = mapByKey(state.selectedMapKey)) {
  if (!map) {
    return [];
  }

  const configured = configuredLocationsForMap(map.key);
  if (configured.length > 0) {
    return configured
      .map((entry) => {
        const persisted = getPersistedLocationState(entry.name);
        return {
          id: entry.name,
          name: entry.name,
          pixelX: entry.pixelX,
          pixelY: entry.pixelY,
          gameWorldX: entry.gameWorldX,
          gameWorldY: inferDefaultAltitude(map, entry.name),
          gameWorldZ: entry.gameWorldZ,
          notes: entry.notes || "",
          initialOwner: persisted?.owner || entry.initialOwner || inferDefaultOwner(map, entry.name)
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...map.airfields]
    .map((entry) => {
      const persisted = getPersistedLocationState(entry.name);
      return {
        id: entry.id,
        name: entry.name,
        pixelX: null,
        pixelY: null,
        gameWorldX: entry.x,
        gameWorldY: entry.y ?? 0,
        gameWorldZ: entry.z,
        notes: "",
        initialOwner: persisted?.owner || entry.faction || "Neutral"
      };
    })
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
    pixelX: location.pixelX,
    pixelY: location.pixelY,
    x: location.gameWorldX,
    y: location.gameWorldY ?? 0,
    z: location.gameWorldZ,
    owner: location.initialOwner
  };
}

function estimateMetersPerPixel(map) {
  const calibratedLocations = getOperationalLocations(map).filter((location) => {
    return (
      Number.isFinite(Number(location.pixelX)) &&
      Number.isFinite(Number(location.pixelY)) &&
      Number.isFinite(Number(location.gameWorldX)) &&
      Number.isFinite(Number(location.gameWorldZ))
    );
  });

  if (calibratedLocations.length < 2) {
    return null;
  }

  const samples = [];
  for (let leftIndex = 0; leftIndex < calibratedLocations.length - 1; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < calibratedLocations.length; rightIndex += 1) {
      const left = calibratedLocations[leftIndex];
      const right = calibratedLocations[rightIndex];
      const dxPixels = Number(left.pixelX) - Number(right.pixelX);
      const dyPixels = Number(left.pixelY) - Number(right.pixelY);
      const pixelDistance = Math.sqrt(dxPixels * dxPixels + dyPixels * dyPixels);
      const dxWorld = Number(left.gameWorldX) - Number(right.gameWorldX);
      const dzWorld = Number(left.gameWorldZ) - Number(right.gameWorldZ);
      const worldDistance = Math.sqrt(dxWorld * dxWorld + dzWorld * dzWorld);

      if (pixelDistance < 25 || worldDistance <= 0) {
        continue;
      }

      samples.push(worldDistance / pixelDistance);
    }
  }

  if (samples.length === 0) {
    return null;
  }

  const sorted = samples.sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function appendPatrolRadiusOverlays(layer, map, objectiveLocation, settings) {
  if (!layer || !map || !objectiveLocation) {
    return;
  }

  if (!Number.isFinite(Number(objectiveLocation.pixelX)) || !Number.isFinite(Number(objectiveLocation.pixelY))) {
    return;
  }

  const metersPerPixel = estimateMetersPerPixel(map);
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
    return;
  }

  const overlays = [
    {
      enabled: Boolean(settings?.operationalResistance?.helicopters) && Number(settings?.patrolPlan?.helicopterPatrols || 0) > 0,
      radiusMeters: Number(settings?.patrolPlan?.helicopterPatrolRadius || 0),
      className: "campaign-radius-overlay campaign-radius-overlay--helo",
      label: `Helo ${Math.round(Number(settings?.patrolPlan?.helicopterPatrolRadius || 0))}m`
    },
    {
      enabled: Boolean(settings?.operationalResistance?.fixedWingPatrols) && Number(settings?.patrolPlan?.fixedWingPatrols || 0) > 0,
      radiusMeters: Number(settings?.patrolPlan?.fixedWingPatrolRadius || 0),
      className: "campaign-radius-overlay campaign-radius-overlay--fixed",
      label: `Fixed ${Math.round(Number(settings?.patrolPlan?.fixedWingPatrolRadius || 0))}m`
    }
  ];

  overlays.forEach((overlay) => {
    if (!overlay.enabled || !Number.isFinite(overlay.radiusMeters) || overlay.radiusMeters <= 0) {
      return;
    }

    const radiusPixels = overlay.radiusMeters / metersPerPixel;
    const diameterPixels = radiusPixels * 2;
    const widthPercent = (diameterPixels / map.pixelSize.width) * 100;
    const heightPercent = (diameterPixels / map.pixelSize.height) * 100;
    const leftPercent = ((Number(objectiveLocation.pixelX) - radiusPixels) / map.pixelSize.width) * 100;
    const topPercent = ((Number(objectiveLocation.pixelY) - radiusPixels) / map.pixelSize.height) * 100;

    const ring = document.createElement("div");
    ring.className = overlay.className;
    ring.style.left = `${leftPercent}%`;
    ring.style.top = `${topPercent}%`;
    ring.style.width = `${widthPercent}%`;
    ring.style.height = `${heightPercent}%`;
    ring.innerHTML = `<span class="campaign-radius-overlay__label">${overlay.label}</span>`;
    layer.appendChild(ring);
  });
}

function getPatrolRadiusOverlayDescriptors(settings = {}) {
  return [
    {
      enabled: Boolean(settings?.operationalResistance?.helicopters) && Number(settings?.patrolPlan?.helicopterPatrols || 0) > 0,
      radiusMeters: Number(settings?.patrolPlan?.helicopterPatrolRadius || 0),
      color: "rgba(102, 208, 203, 0.88)",
      fill: "rgba(102, 208, 203, 0.08)",
      label: `HELO PATROL ${Math.round(Number(settings?.patrolPlan?.helicopterPatrolRadius || 0))}M`
    },
    {
      enabled: Boolean(settings?.operationalResistance?.fixedWingPatrols) && Number(settings?.patrolPlan?.fixedWingPatrols || 0) > 0,
      radiusMeters: Number(settings?.patrolPlan?.fixedWingPatrolRadius || 0),
      color: "rgba(242, 166, 64, 0.88)",
      fill: "rgba(242, 166, 64, 0.06)",
      label: `FIXED-WING CAP ${Math.round(Number(settings?.patrolPlan?.fixedWingPatrolRadius || 0))}M`
    }
  ].filter((overlay) => overlay.enabled && Number.isFinite(overlay.radiusMeters) && overlay.radiusMeters > 0);
}

function drawCanvasMarker(context, x, y, options = {}) {
  const owner = options.owner || "Neutral";
  const isStart = Boolean(options.isStart);
  const isObjective = Boolean(options.isObjective);
  const friendlyColor = "#66d0cb";
  const enemyColor = "#f26363";
  const neutralColor = "#d7e4ec";
  const dotColor =
    owner === els.friendlyFaction.value ? friendlyColor :
    owner === els.enemyFaction.value ? enemyColor :
    neutralColor;

  context.save();
  context.translate(x, y);

  context.beginPath();
  context.fillStyle = dotColor;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 4;
  context.arc(0, 0, 11, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  if (isStart) {
    context.beginPath();
    context.strokeStyle = "rgba(102, 208, 203, 0.92)";
    context.lineWidth = 3;
    context.arc(0, 0, 26, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.strokeStyle = "rgba(102, 208, 203, 0.45)";
    context.lineWidth = 2;
    context.arc(0, 0, 40, 0, Math.PI * 2);
    context.stroke();
  }

  if (isObjective) {
    context.strokeStyle = "rgba(242, 166, 64, 0.95)";
    context.lineWidth = 3;
    context.setLineDash([8, 6]);
    context.beginPath();
    context.arc(0, 0, 38, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);

    context.beginPath();
    context.moveTo(-54, 0);
    context.lineTo(54, 0);
    context.moveTo(0, -54);
    context.lineTo(0, 54);
    context.stroke();
  }

  context.restore();

  context.save();
  context.font = "700 38px Segoe UI";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.lineWidth = 8;
  context.strokeStyle = "rgba(0,0,0,0.72)";
  context.strokeText(options.label || "", x, y + 20);
  context.fillStyle = "#edf4f8";
  context.fillText(options.label || "", x, y + 20);
  context.restore();
}

function drawCanvasRadiusOverlays(context, map, objectiveLocation, settings, frame) {
  if (!objectiveLocation || !Number.isFinite(Number(objectiveLocation.pixelX)) || !Number.isFinite(Number(objectiveLocation.pixelY))) {
    return;
  }

  const metersPerPixel = estimateMetersPerPixel(map);
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
    return;
  }

  const centerX = frame.x + Number(objectiveLocation.pixelX) * frame.scale;
  const centerY = frame.y + Number(objectiveLocation.pixelY) * frame.scale;

  getPatrolRadiusOverlayDescriptors(settings).forEach((overlay) => {
    const radiusPixels = (overlay.radiusMeters / metersPerPixel) * frame.scale;
    context.save();
    context.setLineDash([18, 14]);
    context.strokeStyle = overlay.color;
    context.fillStyle = overlay.fill;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(centerX, centerY, radiusPixels, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "rgba(7, 19, 29, 0.9)";
    context.strokeStyle = "rgba(255,255,255,0.16)";
    context.lineWidth = 2;
    context.font = "700 22px Segoe UI";
    const labelWidth = Math.max(290, context.measureText(overlay.label).width + 40);
    const labelX = centerX - labelWidth / 2;
    const labelY = centerY - radiusPixels - 54;
    const labelHeight = 38;
    context.beginPath();
    context.roundRect(labelX, labelY, labelWidth, labelHeight, 14);
    context.fill();
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#edf4f8";
    context.fillText(overlay.label, centerX, labelY + labelHeight / 2);
    context.restore();
  });
}

async function buildBriefingGraphic() {
  const map = mapByKey(state.selectedMapKey);
  if (!map) {
    return null;
  }

  const mapImage = await loadImageAsset(resolveRendererAsset(map.imagePath));
  const locations = getOperationalLocations(map).filter((entry) => entry.pixelX != null && entry.pixelY != null);
  const startingAirfield = resolveGameLocation(map, els.airfieldSelect.value);
  const objectiveLocation = resolveGameLocation(map, els.objectiveTarget.value);
  const advancedThreats = getAdvancedThreatSettings();
  const canvas = document.createElement("canvas");
  const padding = 88;
  const headerHeight = 320;
  const footerHeight = 220;
  const drawWidth = Number(map.pixelSize.width || mapImage.naturalWidth || 3000);
  const drawHeight = Number(map.pixelSize.height || mapImage.naturalHeight || 3000);
  const scale = drawWidth / Number(map.pixelSize.width || drawWidth);
  const width = drawWidth + padding * 2;
  const height = headerHeight + drawHeight + footerHeight + padding;
  const mapX = padding;
  const mapY = headerHeight;
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  context.fillStyle = "#09131a";
  context.fillRect(0, 0, width, height);

  const headerGradient = context.createLinearGradient(0, 0, width, 0);
  headerGradient.addColorStop(0, "#133340");
  headerGradient.addColorStop(0.5, "#10232d");
  headerGradient.addColorStop(1, "#0a141b");
  context.fillStyle = headerGradient;
  context.fillRect(0, 0, width, headerHeight);

  context.fillStyle = "#66d0cb";
  context.font = "700 30px Segoe UI";
  context.fillText("MISSION BRIEFING", padding, 58);

  context.fillStyle = "#f3f7fa";
  context.font = "800 92px Segoe UI";
  context.fillText(els.campaignName.value.trim() || "Untitled Campaign", padding, 142);

  context.font = "600 42px Segoe UI";
  context.fillStyle = "#c8d6df";
  context.fillText(`${map.label} | Start: ${startingAirfield?.name || "-"} | Objective: ${objectiveLocation?.name || "-"}`, padding, 210);

  context.font = "500 32px Segoe UI";
  context.fillStyle = "#9eb2bf";
  context.fillText(`Threat posture: ${els.objectiveUnitProfile.value} | Intensity: ${OBJECTIVE_INTENSITY_LABELS[Number(els.objectiveIntensity.value || 1)] || "Medium"} | Weather ${Math.round(Number(els.weatherIntensity.value || 0) * 100)}% | Time ${Number(els.timeOfDay.value || 10)}:00`, padding, 266);

  context.drawImage(mapImage, mapX, mapY, drawWidth, drawHeight);

  context.strokeStyle = "rgba(171, 201, 212, 0.12)";
  context.lineWidth = 1;
  const gridSize = 72 * scale;
  for (let x = mapX; x <= mapX + drawWidth; x += gridSize) {
    context.beginPath();
    context.moveTo(x, mapY);
    context.lineTo(x, mapY + drawHeight);
    context.stroke();
  }
  for (let y = mapY; y <= mapY + drawHeight; y += gridSize) {
    context.beginPath();
    context.moveTo(mapX, y);
    context.lineTo(mapX + drawWidth, y);
    context.stroke();
  }

  drawCanvasRadiusOverlays(context, map, objectiveLocation, advancedThreats, {
    x: mapX,
    y: mapY,
    scale
  });

  locations.forEach((location) => {
    drawCanvasMarker(
      context,
      mapX + Number(location.pixelX) * scale,
      mapY + Number(location.pixelY) * scale,
      {
        owner: location.initialOwner,
        label: location.name,
        isStart: startingAirfield?.name === location.name,
        isObjective: objectiveLocation?.name === location.name
      }
    );
  });

  context.fillStyle = "#0b151c";
  context.fillRect(0, height - footerHeight, width, footerHeight);
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.beginPath();
  context.moveTo(0, height - footerHeight);
  context.lineTo(width, height - footerHeight);
  context.stroke();

  const summaryLines = [
    `Friendly: ${els.friendlyFaction.value} | Enemy: ${els.enemyFaction.value}`,
    `Objective package: SAM ${els.advancedObjectiveSamSites.value}, Artillery ${els.advancedObjectiveArtillerySites.value}, Factories ${els.advancedObjectiveFactoryBuildings.value}, Tanks ${els.advancedObjectiveTankUnits.value}, IFVs ${els.advancedObjectiveIfvUnits.value}`,
    `Patrols: Helos ${els.advancedHelicopterPatrolCount.value} @ ${els.advancedHelicopterPatrolRadius.value}m | Fixed-wing ${els.advancedFixedWingPatrolCount.value} @ ${els.advancedFixedWingPatrolRadius.value}m | Objective patrol groups ${els.advancedObjectivePatrolGroups.value}`,
    `Pressure: Front-line axes ${els.advancedFrontlinePairs.value}, patrol groups ${els.advancedFrontlinePatrolGroups.value}, convoys ${els.advancedFrontlineConvoyGroups.value}, locale patrols ${els.advancedLocalePatrolGroups.value}, randomness ${els.advancedRandomness.value}%`
  ];

  context.font = "600 28px Segoe UI";
  context.fillStyle = "#edf4f8";
  summaryLines.forEach((line, index) => {
    context.fillText(line, padding, height - footerHeight + 52 + index * 38);
  });

  return {
    fileName: `${els.campaignName.value.trim() || "campaign"}_briefing.png`,
    dataUrl: canvas.toDataURL("image/png")
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

function buildCampaignStatePayload() {
  const map = mapByKey(state.selectedMapKey);
  const locations = getOperationalLocations(map);
  const missionCount = Number(state.campaignState?.missionCount || 0);
  const selectedObjective = locations.find((entry) => entry.id === els.objectiveTarget.value || entry.name === els.objectiveTarget.value);
  const logisticsState = collectCampaignLogisticsState();
  const advancedThreats = getAdvancedThreatSettings();

  return {
    version: 1,
    campaignName: els.campaignName.value.trim() || "Untitled Campaign",
    mapKey: map?.key || state.selectedMapKey,
    mapLabel: map?.label || "",
    missionCount,
    lastExportAt: state.campaignState?.lastExportAt || null,
    parameters: {
      description: els.description.value,
      mapKey: map?.key || state.selectedMapKey,
      mapLabel: map?.label || "",
      startingAirbase: els.airfieldSelect.value,
      objectiveLocation: els.objectiveTarget.value,
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
      },
      advancedThreats
    },
    factions: logisticsState,
    locations: locations.map((location) => ({
      id: location.id,
      name: location.name,
      gameWorldX: location.gameWorldX ?? null,
      gameWorldY: location.gameWorldY ?? 0,
      gameWorldZ: location.gameWorldZ ?? null,
      owner: location.initialOwner || "Neutral",
      notes: location.notes || ""
    })),
    objective: selectedObjective
      ? {
          name: selectedObjective.name,
          owner: selectedObjective.initialOwner || "Neutral"
        }
      : null,
    orderOfBattle: state.campaignState?.orderOfBattle || { units: [] }
  };
}

function classifyVehicleRole(vehicle) {
  const name = vehicle.UniqueName || "";
  if (name.startsWith("objective_")) {
    return "objective-defense";
  }
  if (name.startsWith("baseline_")) {
    return "static-defense";
  }
  if (name.startsWith("frontline_action_")) {
    return "frontline-action";
  }
  if (name.startsWith("frontline_patrol_")) {
    return "frontline-patrol";
  }
  if (name.startsWith("frontline_convoy_")) {
    return "frontline-convoy";
  }
  return "general";
}

function buildPersistentUnitRecords(vehicles) {
  return (vehicles || []).map((vehicle) => ({
    unitId: vehicle.UniqueName,
    type: vehicle.type,
    faction: vehicle.faction,
    role: classifyVehicleRole(vehicle),
    status: "active",
    holdPosition: vehicle.holdPosition !== false,
    skill: Number(vehicle.skill ?? 0.7),
    position: {
      x: Number(vehicle.globalPosition?.x ?? 0),
      y: Number(vehicle.globalPosition?.y ?? 0),
      z: Number(vehicle.globalPosition?.z ?? 0)
    },
    rotation: {
      x: Number(vehicle.rotation?.x ?? 0),
      y: Number(vehicle.rotation?.y ?? 0),
      z: Number(vehicle.rotation?.z ?? 0),
      w: Number(vehicle.rotation?.w ?? 1)
    },
    waypoints: cloneWaypoints(vehicle.waypoints || [])
  }));
}

function buildVehiclesFromPersistentUnits() {
  const units = state.campaignState?.orderOfBattle?.units || [];
  return units
    .filter((unit) => unit.status !== "destroyed")
    .map((unit) => ({
      type: unit.type,
      faction: unit.faction,
      UniqueName: unit.unitId,
      globalPosition: {
        x: Number(unit.position?.x ?? 0),
        y: Number(unit.position?.y ?? 0),
        z: Number(unit.position?.z ?? 0)
      },
      rotation: {
        x: Number(unit.rotation?.x ?? 0),
        y: Number(unit.rotation?.y ?? 0),
        z: Number(unit.rotation?.z ?? 0),
        w: Number(unit.rotation?.w ?? 1)
      },
      CaptureStrength: { IsOverride: false, Value: 0 },
      CaptureDefense: { IsOverride: false, Value: 0 },
      unitCustomID: "",
      spawnTiming: "",
      holdPosition: unit.holdPosition !== false,
      skill: Number(unit.skill ?? 0.7),
      waypoints: cloneWaypoints(unit.waypoints || [])
    }));
}

function renderCampaignLogistics() {
  if (!els.campaignLogistics) {
    return;
  }

  const factionIds = [els.friendlyFaction.value || "Boscali", els.enemyFaction.value || "Primeva"];
  els.campaignLogistics.innerHTML = "";

  for (const factionName of factionIds) {
    const faction = getPersistedFactionState(factionName);
    const card = document.createElement("div");
    card.className = "logistics-card";
    card.innerHTML = `
      <div class="logistics-card__title">${factionName}</div>
      <div class="logistics-grid">
        <label class="field">
          <span>Funds</span>
          <input type="number" step="1000" data-faction-funds="${factionName}" value="${faction.startingBalance}" />
        </label>
        <label class="field">
          <span>Reserve Airframes</span>
          <input type="number" step="1" min="0" data-faction-reserve-airframes="${factionName}" value="${faction.reserveAirframes}" />
        </label>
      </div>
      <div class="logistics-grid">
        <label class="field">
          <span>Extra Reserves / Player</span>
          <input type="number" step="1" min="0" data-faction-extra-reserves="${factionName}" value="${faction.extraReservesPerPlayer}" />
        </label>
      </div>
      <div class="logistics-supplies">
        ${faction.supplies
          .map((supply) => `
            <label class="logistics-supply">
              <span>${supply.unitType}</span>
              <input type="number" step="1" min="0" data-faction-supply="${factionName}" data-unit-type="${supply.unitType}" value="${Number(supply.count || 0)}" />
            </label>
          `)
          .join("")}
      </div>
    `;
    els.campaignLogistics.appendChild(card);
  }
}

function collectCampaignLogisticsState() {
  const factionIds = [els.friendlyFaction.value || "Boscali", els.enemyFaction.value || "Primeva"];
  return factionIds.map((factionName) => {
    const fallback = getPersistedFactionState(factionName);
    const funds = els.campaignLogistics?.querySelector(`[data-faction-funds="${factionName}"]`);
    const reserveAirframes = els.campaignLogistics?.querySelector(`[data-faction-reserve-airframes="${factionName}"]`);
    const extraReserves = els.campaignLogistics?.querySelector(`[data-faction-extra-reserves="${factionName}"]`);
    const supplyInputs = Array.from(els.campaignLogistics?.querySelectorAll(`[data-faction-supply="${factionName}"]`) || []);
    return {
      factionName,
      startingBalance: Number(funds?.value ?? fallback.startingBalance ?? 250000),
      reserveAirframes: Number(reserveAirframes?.value ?? fallback.reserveAirframes ?? 72),
      extraReservesPerPlayer: Number(extraReserves?.value ?? fallback.extraReservesPerPlayer ?? 12),
      supplies: (supplyInputs.length ? supplyInputs : fallback.supplies.map((supply) => ({
        dataset: { unitType: supply.unitType },
        value: supply.count
      }))).map((input) => ({
        unitType: input.dataset.unitType,
        count: Number(input.value ?? 0)
      }))
    };
  });
}

async function applyCampaignResolution() {
  const locations = getOperationalLocations(mapByKey(state.selectedMapKey));
  const ownedCounts = new Map();
  for (const location of locations) {
    const owner = location.initialOwner || "Neutral";
    ownedCounts.set(owner, (ownedCounts.get(owner) || 0) + 1);
  }

  const resolvedFactions = collectCampaignLogisticsState().map((faction) => ({
    ...faction,
    startingBalance: Number(faction.startingBalance || 0) + (ownedCounts.get(faction.factionName) || 0) * TURN_FUNDS_PER_OWNED_LOCATION,
    reserveAirframes: Number(faction.reserveAirframes || 0) + TURN_RESERVE_AIRFRAME_REPLENISH,
    supplies: cloneSupplies(faction.supplies).map((supply) => ({
      unitType: supply.unitType,
      count: Math.min(TURN_SUPPLY_CAP_PER_TYPE, Number(supply.count || 0) + TURN_SUPPLY_REPLENISH_PER_TYPE)
    }))
  }));

  const result = await persistCampaignState({
    resolutionCount: Number(state.campaignState?.resolutionCount || 0) + 1,
    lastResolvedAt: new Date().toISOString(),
    factions: resolvedFactions
  });

  if (!result?.ok) {
    els.output.innerHTML = "<div>Failed to apply campaign resolution.</div>";
    return;
  }

  renderCampaignLogistics();
  renderCampaignStateSummary();
  updateWorkspaceSummary();
  renderCampaignMarkers();
  els.output.innerHTML = `
    <div>Campaign resolution applied.</div>
    <div>${result.filePath}</div>
    <div>Resolutions saved: ${Number(result.state?.resolutionCount || 0)}</div>
    <div>Automatic income and replenishment applied for one turn.</div>
  `;
}

async function persistCampaignState(overrides = {}) {
  if (!state.catalog) {
    return null;
  }

  const payload = {
    ...buildCampaignStatePayload(),
    ...overrides
  };

  if (overrides.parameters) {
    payload.parameters = {
      ...buildCampaignStatePayload().parameters,
      ...overrides.parameters
    };
  }

  const result = await window.nuclearOptionApi.saveCampaignState(payload);
  if (result?.ok) {
    state.campaignState = result.state;
  }
  return result;
}

function renderCampaignStateSummary() {
  if (!els.campaignStateSummary) {
    return;
  }

  const label = els.campaignStateSummary.querySelector(".workspace-card__label");
  const text = els.campaignStateSummary.querySelector(".workspace-card__text");
  if (!state.campaignState) {
    label.textContent = "Persistent Campaign State";
    text.textContent = "No campaign state saved yet.";
    return;
  }

  label.textContent = "Persistent Campaign State";
  text.textContent = `${state.campaignState.campaignName || "Campaign"} | ${state.campaignState.mapLabel || state.campaignState.mapKey || "-"} | missions: ${Number(state.campaignState.missionCount || 0)} | resolutions: ${Number(state.campaignState.resolutionCount || 0)}`;
}

function applyCampaignState() {
  const saved = state.campaignState;
  if (!saved || !state.catalog) {
    renderCampaignStateSummary();
    return;
  }

  if (saved.mapKey && state.catalog.maps.some((entry) => entry.key === saved.mapKey)) {
    state.selectedMapKey = saved.mapKey;
  }

  if (saved.campaignName) {
    els.campaignName.value = saved.campaignName;
  }

  if (saved.parameters?.description) {
    els.description.value = saved.parameters.description;
  }

  renderMapOptions();
  renderFactionOptions();
  renderLocationOptions();
  renderObjectiveOptions();

  if (saved.factions?.[0]?.factionName) {
    els.friendlyFaction.value = saved.factions[0].factionName;
  }
  if (saved.factions?.[1]?.factionName) {
    els.enemyFaction.value = saved.factions[1].factionName;
  }

  if (saved.parameters?.startingRank != null) {
    els.startingRank.value = saved.parameters.startingRank;
  }
  if (saved.factions?.[0]?.startingBalance != null) {
    els.startingCash.value = saved.factions[0].startingBalance;
  } else if (saved.parameters?.startingCash != null) {
    els.startingCash.value = saved.parameters.startingCash;
  }
  if (saved.parameters?.timeOfDay != null) {
    els.timeOfDay.value = saved.parameters.timeOfDay;
  }
  if (saved.parameters?.weatherIntensity != null) {
    els.weatherIntensity.value = saved.parameters.weatherIntensity;
  }
  if (saved.parameters?.allowRespawn != null) {
    els.allowRespawn.checked = Boolean(saved.parameters.allowRespawn);
  }

  if (saved.parameters?.threatProfile) {
    els.enableSam.checked = Boolean(saved.parameters.threatProfile.samSites);
    els.enableArtillery.checked = Boolean(saved.parameters.threatProfile.artillery);
    els.enableFactories.checked = Boolean(saved.parameters.threatProfile.factories);
    els.enableGround.checked = Boolean(saved.parameters.threatProfile.groundUnits);
    els.enableShips.checked = Boolean(saved.parameters.threatProfile.ships);
  }

  applyAdvancedThreatSettings(saved.parameters?.advancedThreats || {});

  renderLocationOptions();
  renderObjectiveOptions();

  if (saved.parameters?.startingAirbase) {
    els.airfieldSelect.value = saved.parameters.startingAirbase;
  }
  if (saved.parameters?.objectiveLocation) {
    els.objectiveTarget.value = saved.parameters.objectiveLocation;
  }
  if (saved.parameters?.objectiveUnitProfile) {
    els.objectiveUnitProfile.value = saved.parameters.objectiveUnitProfile;
  }
  if (saved.parameters?.objectiveIntensity) {
    const intensityIndex = OBJECTIVE_INTENSITY_LABELS.indexOf(saved.parameters.objectiveIntensity);
    if (intensityIndex >= 0) {
      els.objectiveIntensity.value = String(intensityIndex);
    }
  }

  renderOwnershipList();
  renderCampaignLogistics();
  renderConfigLocationOptions();
  renderObjectiveIntensityValue();
  updateWorkspaceSummary();
  renderCampaignStateSummary();
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
    const emptyTitle =
      state.activeView === "config"
        ? "Location Config"
        : state.activeView === "advanced"
          ? "Advanced Targets"
          : "Campaign Workspace";
    setText(els.mapTitle, emptyTitle);
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

  const title =
    state.activeView === "config"
      ? `${map.label} Location Config`
      : state.activeView === "advanced"
        ? `${map.label} Advanced Targeting`
        : map.label;
  setText(els.mapTitle, title);
  setText(
    els.mapSubtitle,
    state.activeView === "campaign"
      ? "Manual ownership setup for a fresh multiplayer campaign start."
      : state.activeView === "config"
        ? "Click a map point, name the location, then enter the in-game X/Z coordinates."
        : "Dial in the target package, resistance toggles, patrol density, and randomness for this operational area."
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
  const source = pathInfo.installPathSource || "default";
  setText(
    els.scanMeta,
    `${installExists} (${source}) - missions: ${pathInfo.missionsPath} - scanned ${new Date(state.catalog.scannedAt).toLocaleString()}`
  );

  if (els.installPathReadout) {
    const override = state.appSettings?.installPathOverride;
    const detected = pathInfo.detectedInstallPath || pathInfo.installPath;
    setText(
      els.installPathReadout,
      override
        ? `Manual override: ${override}`
        : `Auto-detected: ${detected}`
    );
  }
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

function getAdvancedViewport() {
  const naturalWidth = els.advancedMapImage.naturalWidth || 1;
  const naturalHeight = els.advancedMapImage.naturalHeight || 1;
  const baseWidth = els.advancedScroll.clientWidth || els.advancedStage.clientWidth || naturalWidth;
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
  els.campaignStage.style.height = `${viewport.height + 18}px`;
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
  if (els.campaignTopScrollTrack) {
    els.campaignTopScrollTrack.style.width = `${viewport.width}px`;
  }
}

function applyAdvancedFrame() {
  const viewport = getAdvancedViewport();
  els.advancedCanvas.style.width = `${viewport.width}px`;
  els.advancedCanvas.style.height = `${viewport.height}px`;
  els.advancedMapImage.style.left = `${viewport.left}px`;
  els.advancedMapImage.style.top = `${viewport.top}px`;
  els.advancedMapImage.style.width = `${viewport.width}px`;
  els.advancedMapImage.style.height = `${viewport.height}px`;
  els.advancedMarkerLayer.style.left = `${viewport.left}px`;
  els.advancedMarkerLayer.style.top = `${viewport.top}px`;
  els.advancedMarkerLayer.style.width = `${viewport.width}px`;
  els.advancedMarkerLayer.style.height = `${viewport.height}px`;
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
  const settings = getAdvancedThreatSettings();
  els.campaignMarkerLayer.innerHTML = "";

  appendPatrolRadiusOverlays(els.campaignMarkerLayer, map, objectiveLocation, settings);

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

function renderAdvancedSummary() {
  if (!els.advancedSummaryObjective) {
    return;
  }

  const objectiveLocation = resolveGameLocation(mapByKey(state.selectedMapKey), els.objectiveTarget.value);
  const settings = getAdvancedThreatSettings();
  const packageTotal =
    settings.objectivePackage.samSites +
    settings.objectivePackage.artillerySites +
    settings.objectivePackage.factoryBuildings +
    settings.objectivePackage.tankUnits +
    settings.objectivePackage.ifvUnits;
  const enabledThreats = [
    settings.operationalResistance.scatteredGroundVehicles ? "ground" : null,
    settings.operationalResistance.antiAirArtillery ? "AAA" : null,
    settings.operationalResistance.shortRangeSam ? "SR SAM" : null,
    settings.operationalResistance.mediumRangeSam ? "MR SAM" : null,
    settings.operationalResistance.helicopters ? "helo patrols" : null,
    settings.operationalResistance.fixedWingPatrols ? "fixed-wing patrols" : null
  ].filter(Boolean);

  setText(els.advancedSummaryObjective, objectiveLocation?.name || "-");
  setText(els.advancedSummaryPackage, String(packageTotal));
  setText(
    els.advancedSummaryThreats,
    `${enabledThreats.join(", ") || "none"} | axes ${settings.patrolPlan.frontlinePairs} | patrols ${settings.patrolPlan.frontlinePatrolGroups} | convoys ${settings.patrolPlan.convoyGroups} | helo radius ${settings.patrolPlan.helicopterPatrolRadius}m | fixed radius ${settings.patrolPlan.fixedWingPatrolRadius}m | randomness ${settings.patrolPlan.randomnessPercent}%`
  );
}

function renderAdvancedMarkers() {
  const map = mapByKey(state.selectedMapKey);
  if (!map || !state.advancedImageReady) {
    els.advancedMarkerLayer.innerHTML = "";
    return;
  }

  applyAdvancedFrame();
  const startingAirfield = resolveGameLocation(map, els.airfieldSelect.value);
  const objectiveLocation = resolveGameLocation(map, els.objectiveTarget.value);
  const settings = getAdvancedThreatSettings();
  els.advancedMarkerLayer.innerHTML = "";

  appendPatrolRadiusOverlays(els.advancedMarkerLayer, map, objectiveLocation, settings);

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

    els.advancedMarkerLayer.appendChild(marker);
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

function renderAdvancedView() {
  const map = mapByKey(state.selectedMapKey);
  renderAdvancedSummary();
  if (!map) {
    state.advancedImageReady = false;
    els.advancedEmpty.textContent = "Click Reload Catalog to load the selected map.";
    els.advancedEmpty.classList.remove("hidden");
    els.advancedMapImage.removeAttribute("src");
    els.advancedMarkerLayer.innerHTML = "";
    return;
  }

  const resolvedSrc = resolveRendererAsset(map.imagePath);
  const sameImage = els.advancedMapImage.src === resolvedSrc;

  if (!sameImage) {
    state.advancedImageReady = false;
    els.advancedEmpty.textContent = `Loading ${map.label} map...`;
    els.advancedEmpty.classList.remove("hidden");
    els.advancedMapImage.src = resolvedSrc;
  } else if (els.advancedMapImage.complete && els.advancedMapImage.naturalWidth > 0) {
    state.advancedImageReady = true;
    els.advancedEmpty.classList.add("hidden");
  }

  renderAdvancedMarkers();
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
  document.body.classList.toggle("config-mode", view === "config" || view === "advanced");
  els.campaignView.classList.toggle("hidden", view !== "campaign");
  els.configView.classList.toggle("hidden", view !== "config");
  els.advancedView.classList.toggle("hidden", view !== "advanced");
  els.showCampaignView.className = view === "campaign" ? "secondary" : "ghost";
  els.showConfigView.className = view === "config" ? "secondary" : "ghost";
  els.showAdvancedView.className = view === "advanced" ? "secondary" : "ghost";
  updateWorkspaceSummary();
  if (view === "config") {
    renderConfigView();
    return;
  }

  if (view === "advanced") {
    renderAdvancedView();
    return;
  }

  renderCampaignView();
}

function syncCampaignTopScrollFromMain() {
  if (!els.campaignTopScroll || !els.campaignScroll) {
    return;
  }
  if (els.campaignTopScroll.scrollLeft !== els.campaignScroll.scrollLeft) {
    els.campaignTopScroll.scrollLeft = els.campaignScroll.scrollLeft;
  }
}

function syncCampaignMainScrollFromTop() {
  if (!els.campaignTopScroll || !els.campaignScroll) {
    return;
  }
  if (els.campaignScroll.scrollLeft !== els.campaignTopScroll.scrollLeft) {
    els.campaignScroll.scrollLeft = els.campaignTopScroll.scrollLeft;
  }
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

function derivePlayerJoinAllowance(startingBalance) {
  const numericBalance = Number(startingBalance || 0);
  if (!Number.isFinite(numericBalance) || numericBalance <= 0) {
    return 250;
  }

  if (numericBalance >= 1000000) {
    return Math.max(250, Math.round(numericBalance / 1000000));
  }

  if (numericBalance >= 1000) {
    return Math.max(250, Math.round(numericBalance / 1000));
  }

  return Math.max(250, Math.round(numericBalance));
}

function createDefenderVehicle(type, faction, name, x, y, z, angleDegrees, options = {}) {
  const radians = (angleDegrees * Math.PI) / 180;
  const half = radians / 2;
  return {
    type,
    faction,
    UniqueName: name,
    globalPosition: { x, y, z },
    rotation: { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) },
    CaptureStrength: { IsOverride: false, Value: 0 },
    CaptureDefense: { IsOverride: false, Value: 0 },
    unitCustomID: "",
    spawnTiming: "",
    holdPosition: options.holdPosition ?? true,
    skill: 0.7,
    waypoints: options.waypoints || []
  };
}

function createWaypoint(x, y, z, objective = "Unit Spawn") {
  return {
    position: { x, y, z },
    objective
  };
}

function distanceBetweenLocations(a, b) {
  const dx = Number(a.gameWorldX) - Number(b.gameWorldX);
  const dz = Number(a.gameWorldZ) - Number(b.gameWorldZ);
  return Math.sqrt(dx * dx + dz * dz);
}

function randomJitter(scale) {
  return (Math.random() * 2 - 1) * scale;
}

function applyRandomness(x, z, settings, baseScale = 100) {
  const intensity = Number(settings?.patrolPlan?.randomnessPercent || 0) / 100;
  const spread = baseScale * intensity;
  return {
    x: x + randomJitter(spread),
    z: z + randomJitter(spread)
  };
}

function createFactoryBuilding(type, faction, name, x, y, z, angleDegrees, productionType) {
  const radians = (angleDegrees * Math.PI) / 180;
  const half = radians / 2;
  return {
    type,
    faction,
    UniqueName: name,
    globalPosition: { x, y, z },
    rotation: { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) },
    CaptureStrength: { IsOverride: false, Value: 0 },
    CaptureDefense: { IsOverride: false, Value: 50 },
    unitCustomID: "",
    spawnTiming: "",
    capturable: false,
    Airbase: "",
    factoryOptions: {
      productionType,
      productionTime: 675
    },
    placementOffset: 0
  };
}

function buildResistanceGroundTypes(settings, options = {}) {
  const includeArtillery = options.includeArtillery ?? true;
  const types = [];

  if (els.enableGround.checked && settings.operationalResistance.scatteredGroundVehicles) {
    types.push("AFV8_IFV", "AFV8_APC");
  }
  if (settings.operationalResistance.antiAirArtillery) {
    types.push("SPAAG1");
  }
  if (els.enableSam.checked && settings.operationalResistance.shortRangeSam) {
    types.push("SAMTrailer1");
  }
  if (els.enableSam.checked && settings.operationalResistance.mediumRangeSam) {
    types.push("RadarSAM1");
  }
  if (els.enableArtillery.checked && includeArtillery) {
    types.push("Truck2-FT");
  }

  return types.length ? types : ["AFV8_APC"];
}

function buildFrontlinePairs(locations, maxPairs = 4) {
  const friendlyOwned = locations.filter((location) => location.initialOwner === els.friendlyFaction.value);
  const enemyOwned = locations.filter((location) => location.initialOwner === els.enemyFaction.value);
  const pairMap = new Map();

  function registerNearestPairs(source, targets) {
    for (const location of source) {
      let nearest = null;
      for (const target of targets) {
        const distance = distanceBetweenLocations(location, target);
        if (!nearest || distance < nearest.distance) {
          nearest = { target, distance };
        }
      }

      if (!nearest) {
        continue;
      }

      const key = [location.name, nearest.target.name].sort().join("::");
      const current = pairMap.get(key);
      if (!current || nearest.distance < current.distance) {
        pairMap.set(key, {
          a: location,
          b: nearest.target,
          distance: nearest.distance
        });
      }
    }
  }

  registerNearestPairs(friendlyOwned, enemyOwned);
  registerNearestPairs(enemyOwned, friendlyOwned);

  return Array.from(pairMap.values())
    .sort((left, right) => left.distance - right.distance)
    .slice(0, Math.max(0, maxPairs));
}

function buildFrontlineMobileVehicles(locations, settings) {
  if (!els.enableGround.checked) {
    return [];
  }

  const pairs = buildFrontlinePairs(locations, settings.patrolPlan.frontlinePairs);
  let index = 0;
  const vehicles = [];
  const patrolTypes = buildResistanceGroundTypes(settings, { includeArtillery: false });
  const convoyTypes = [...buildResistanceGroundTypes(settings, { includeArtillery: true }), "LightTruck1_AT"];

  function addGroup(origin, opposing, pairIndex, prefix, types, laneOffset) {
    const dx = Number(opposing.gameWorldX) - Number(origin.gameWorldX);
    const dz = Number(opposing.gameWorldZ) - Number(origin.gameWorldZ);
    const length = Math.max(Math.sqrt(dx * dx + dz * dz), 1);
    const nx = dx / length;
    const nz = dz / length;
    const px = -nz;
    const pz = nx;
    const startPoint = applyRandomness(Number(origin.gameWorldX) + nx * 220 + px * laneOffset, Number(origin.gameWorldZ) + nz * 220 + pz * laneOffset, settings, 140);
    const startX = startPoint.x;
    const startY = Number(origin.gameWorldY ?? 0);
    const startZ = startPoint.z;
    const forwardPoint = applyRandomness(Number(origin.gameWorldX) + dx * 0.38 + px * laneOffset, Number(origin.gameWorldZ) + dz * 0.38 + pz * laneOffset, settings, 180);
    const forwardX = forwardPoint.x;
    const forwardY = startY * 0.62 + Number(opposing.gameWorldY ?? 0) * 0.38;
    const forwardZ = forwardPoint.z;
    const flankPoint = applyRandomness(Number(origin.gameWorldX) + dx * 0.32 + px * (laneOffset + 220), Number(origin.gameWorldZ) + dz * 0.32 + pz * (laneOffset + 220), settings, 200);
    const flankX = flankPoint.x;
    const flankY = startY * 0.68 + Number(opposing.gameWorldY ?? 0) * 0.32;
    const flankZ = flankPoint.z;
    const heading = (Math.atan2(dz, dx) * 180) / Math.PI;

    for (let vehicleIndex = 0; vehicleIndex < types.length; vehicleIndex += 1) {
      index += 1;
      const spacing = vehicleIndex * 28;
      const spawnX = startX - nx * spacing;
      const spawnZ = startZ - nz * spacing;
      vehicles.push(
        createDefenderVehicle(
          types[vehicleIndex],
          origin.initialOwner,
          `${prefix}_${sanitizeIdFragment(origin.name)}_${pairIndex + 1}_${index}`,
          spawnX,
          startY,
          spawnZ,
          heading,
          {
            holdPosition: true,
            waypoints: [
              createWaypoint(startX, startY, startZ, "Unit Spawn"),
              createWaypoint(forwardX, forwardY, forwardZ, `${origin.name} Frontline`),
              createWaypoint(flankX, flankY, flankZ, `${origin.name} Patrol`),
              createWaypoint(startX, startY, startZ, origin.name)
            ]
          }
        )
      );
    }
  }

  pairs.forEach((pair, pairIndex) => {
    if (pairIndex < settings.patrolPlan.frontlinePatrolGroups) {
      addGroup(pair.a, pair.b, pairIndex, "frontline_patrol", patrolTypes, 120);
      addGroup(pair.b, pair.a, pairIndex, "frontline_patrol", patrolTypes, -120);
    }
    if (pairIndex < settings.patrolPlan.convoyGroups) {
      addGroup(pair.a, pair.b, pairIndex, "frontline_convoy", convoyTypes, 200);
      addGroup(pair.b, pair.a, pairIndex, "frontline_convoy", convoyTypes, -200);
    }
  });

  return vehicles;
}

function buildFrontlineActionVehicles(locations, settings) {
  if (!els.enableGround.checked) {
    return [];
  }

  const pairs = buildFrontlinePairs(locations, settings.patrolPlan.frontlinePairs);
  let index = 0;
  const vehicles = [];
  const friendlyTypes = buildResistanceGroundTypes(settings, { includeArtillery: true }).concat("MBT1");
  const enemyTypes = buildResistanceGroundTypes(settings, { includeArtillery: true }).concat("MBT1");

  pairs.forEach((pair, pairIndex) => {
    const dx = Number(pair.b.gameWorldX) - Number(pair.a.gameWorldX);
    const dz = Number(pair.b.gameWorldZ) - Number(pair.a.gameWorldZ);
    const length = Math.max(Math.sqrt(dx * dx + dz * dz), 1);
    const nx = dx / length;
    const nz = dz / length;
    const px = -nz;
    const pz = nx;
    const midpointX = Number(pair.a.gameWorldX) + dx * 0.5;
    const midpointY = Number(pair.a.gameWorldY ?? 0) * 0.5 + Number(pair.b.gameWorldY ?? 0) * 0.5;
    const midpointZ = Number(pair.a.gameWorldZ) + dz * 0.5;
    const friendlyAnchor = applyRandomness(midpointX - nx * 360 + px * 150, midpointZ - nz * 360 + pz * 150, settings, 180);
    const enemyAnchor = applyRandomness(midpointX + nx * 360 - px * 150, midpointZ + nz * 360 - pz * 150, settings, 180);
    const contact = applyRandomness(midpointX + px * ((pairIndex % 2 === 0 ? 1 : -1) * 90), midpointZ + pz * ((pairIndex % 2 === 0 ? 1 : -1) * 90), settings, 120);
    const friendlyAnchorX = friendlyAnchor.x;
    const friendlyAnchorZ = friendlyAnchor.z;
    const enemyAnchorX = enemyAnchor.x;
    const enemyAnchorZ = enemyAnchor.z;
    const contactX = contact.x;
    const contactZ = contact.z;
    const friendlyHeading = (Math.atan2(dz, dx) * 180) / Math.PI;
    const enemyHeading = friendlyHeading + 180;

    function addSkirmishElement(faction, types, anchorX, anchorZ, heading, offsetSign) {
      types.forEach((type, localIndex) => {
        index += 1;
        const lateral = (localIndex - 1) * 45 * offsetSign;
        const depth = localIndex * 35;
        const spawnX = anchorX + px * lateral - nx * depth * offsetSign;
        const spawnZ = anchorZ + pz * lateral - nz * depth * offsetSign;
        vehicles.push(
          createDefenderVehicle(
            type,
            faction,
            `frontline_action_${sanitizeIdFragment(faction)}_${pairIndex + 1}_${index}`,
            spawnX,
            midpointY,
            spawnZ,
            heading,
            {
              holdPosition: true,
              waypoints: [
                createWaypoint(anchorX, midpointY, anchorZ, "Unit Spawn"),
                createWaypoint(contactX, midpointY, contactZ, "Frontline Contact"),
                createWaypoint(anchorX, midpointY, anchorZ, "Frontline Rally")
              ]
            }
          )
        );
      });
    }

    addSkirmishElement(pair.a.initialOwner, friendlyTypes.slice(0, 4), friendlyAnchorX, friendlyAnchorZ, friendlyHeading, 1);
    addSkirmishElement(pair.b.initialOwner, enemyTypes.slice(0, 4), enemyAnchorX, enemyAnchorZ, enemyHeading, -1);
  });

  return vehicles;
}

function buildBaselineDefenseVehicles(locations, settings) {
  let index = 0;
  const baselineTypes = buildResistanceGroundTypes(settings, { includeArtillery: true });
  const unitCount = Math.max(2, Math.min(6, baselineTypes.length));

  return locations
    .filter((location) => location.initialOwner && location.initialOwner !== "Neutral")
    .flatMap((location) => {
      return Array.from({ length: unitCount }, (_, vehicleIndex) => {
        index += 1;
        const angle = vehicleIndex * (360 / unitCount);
        const radius = 140 + vehicleIndex * 35;
        const radians = (angle * Math.PI) / 180;
        const randomized = applyRandomness(Number(location.gameWorldX) + Math.cos(radians) * radius, Number(location.gameWorldZ) + Math.sin(radians) * radius, settings, 90);
        const x = randomized.x;
        const y = Number(location.gameWorldY ?? 0);
        const z = randomized.z;
        const type = baselineTypes[vehicleIndex % baselineTypes.length];
        return createDefenderVehicle(
          type,
          location.initialOwner,
          `baseline_${sanitizeIdFragment(location.name)}_${index}`,
          x,
          y,
          z,
          angle + 90
        );
      });
    });
}

function buildObjectiveDefenseVehicles(objectiveLocation, settings) {
  if (!objectiveLocation || objectiveLocation.initialOwner === "Neutral") {
    return [];
  }

  const objectiveTypes = [];
  if (els.enableSam.checked) {
    for (let index = 0; index < settings.objectivePackage.samSites; index += 1) {
      objectiveTypes.push(index % 2 === 0 ? "RadarSAM1" : "SAMTrailer1");
    }
  }
  if (els.enableArtillery.checked) {
    for (let index = 0; index < settings.objectivePackage.artillerySites; index += 1) {
      objectiveTypes.push("Truck2-FT");
    }
  }
  if (els.enableGround.checked) {
    for (let index = 0; index < settings.objectivePackage.tankUnits; index += 1) {
      objectiveTypes.push("MBT1");
    }
    for (let index = 0; index < settings.objectivePackage.ifvUnits; index += 1) {
      objectiveTypes.push("AFV8_IFV");
    }
  }

  if (!objectiveTypes.length) {
    const profileKey = els.objectiveUnitProfile.value || "mixed";
    const profileTypes = OBJECTIVE_PROFILE_TYPES[profileKey] || OBJECTIVE_PROFILE_TYPES.mixed;
    const intensityLevel = Number(els.objectiveIntensity.value || 1);
    const unitCount = OBJECTIVE_FORCE_COUNTS[intensityLevel] || OBJECTIVE_FORCE_COUNTS[1];
    for (let index = 0; index < unitCount; index += 1) {
      objectiveTypes.push(profileTypes[index % profileTypes.length]);
    }
  }

  return objectiveTypes.map((type, index) => {
    const ringIndex = Math.floor(index / 6);
    const angle = (index % 6) * 60 + ringIndex * 15;
    const radius = 220 + ringIndex * 90;
    const radians = (angle * Math.PI) / 180;
    const randomized = applyRandomness(Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius, Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius, settings, 140);
    const x = randomized.x;
    const y = Number(objectiveLocation.gameWorldY ?? 0);
    const z = randomized.z;
    return createDefenderVehicle(
      type,
      objectiveLocation.initialOwner,
      `objective_${sanitizeIdFragment(objectiveLocation.name)}_${index + 1}`,
      x,
      y,
      z,
      angle + 180
    );
  });
}

function buildObjectiveFactoryBuildings(objectiveLocation, settings) {
  if (!objectiveLocation || objectiveLocation.initialOwner === "Neutral" || !els.enableFactories.checked) {
    return [];
  }

  return Array.from({ length: settings.objectivePackage.factoryBuildings }, (_, index) => {
    const angle = index * (360 / Math.max(settings.objectivePackage.factoryBuildings, 1));
    const radius = 340 + (index % 2) * 90;
    const radians = (angle * Math.PI) / 180;
    const randomized = applyRandomness(Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius, Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius, settings, 120);
    const type = FACTORY_BUILDING_TYPES[index % FACTORY_BUILDING_TYPES.length];
    const productionType = FACTORY_PRODUCTION_TYPES[index % FACTORY_PRODUCTION_TYPES.length];
    return createFactoryBuilding(
      type,
      objectiveLocation.initialOwner,
      `objective_factory_${sanitizeIdFragment(objectiveLocation.name)}_${index + 1}`,
      randomized.x,
      Number(objectiveLocation.gameWorldY ?? 0),
      randomized.z,
      angle + 90,
      productionType
    );
  });
}

function buildLocalPatrolVehicles(locations, settings) {
  if (!els.enableGround.checked || settings.patrolPlan.localePatrolGroups <= 0) {
    return [];
  }

  const ownedLocations = locations.filter((location) => location.initialOwner && location.initialOwner !== "Neutral");
  const patrolTypes = buildResistanceGroundTypes(settings, { includeArtillery: false });
  const vehicles = [];

  for (let groupIndex = 0; groupIndex < settings.patrolPlan.localePatrolGroups && ownedLocations.length > 0; groupIndex += 1) {
    const location = ownedLocations[groupIndex % ownedLocations.length];
    for (let unitIndex = 0; unitIndex < Math.min(2, patrolTypes.length); unitIndex += 1) {
      const angle = 90 * unitIndex + groupIndex * 37;
      const radius = 180 + unitIndex * 55;
      const radians = (angle * Math.PI) / 180;
      const spawn = applyRandomness(Number(location.gameWorldX) + Math.cos(radians) * radius, Number(location.gameWorldZ) + Math.sin(radians) * radius, settings, 90);
      const waypointA = applyRandomness(Number(location.gameWorldX) + Math.cos(radians + 0.8) * (radius + 110), Number(location.gameWorldZ) + Math.sin(radians + 0.8) * (radius + 110), settings, 90);
      const waypointB = applyRandomness(Number(location.gameWorldX) + Math.cos(radians + 1.7) * (radius + 70), Number(location.gameWorldZ) + Math.sin(radians + 1.7) * (radius + 70), settings, 90);
      vehicles.push(
        createDefenderVehicle(
          patrolTypes[(groupIndex + unitIndex) % patrolTypes.length],
          location.initialOwner,
          `locale_patrol_${sanitizeIdFragment(location.name)}_${groupIndex + 1}_${unitIndex + 1}`,
          spawn.x,
          Number(location.gameWorldY ?? 0),
          spawn.z,
          angle + 90,
          {
            holdPosition: true,
            waypoints: [
              createWaypoint(spawn.x, Number(location.gameWorldY ?? 0), spawn.z, "Unit Spawn"),
              createWaypoint(waypointA.x, Number(location.gameWorldY ?? 0), waypointA.z, `${location.name} Patrol A`),
              createWaypoint(waypointB.x, Number(location.gameWorldY ?? 0), waypointB.z, `${location.name} Patrol B`),
              createWaypoint(spawn.x, Number(location.gameWorldY ?? 0), spawn.z, location.name)
            ]
          }
        )
      );
    }
  }

  return vehicles;
}

function buildObjectivePatrolVehicles(objectiveLocation, settings) {
  if (!objectiveLocation || objectiveLocation.initialOwner === "Neutral" || !els.enableGround.checked || settings.patrolPlan.objectivePatrolGroups <= 0) {
    return [];
  }

  const patrolTypes = buildResistanceGroundTypes(settings, { includeArtillery: false });
  const vehicles = [];

  for (let groupIndex = 0; groupIndex < settings.patrolPlan.objectivePatrolGroups; groupIndex += 1) {
    const angle = groupIndex * 68;
    const radius = 420 + (groupIndex % 3) * 120;
    const radians = (angle * Math.PI) / 180;
    const spawn = applyRandomness(Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius, Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius, settings, 120);
    const attack = applyRandomness(Number(objectiveLocation.gameWorldX) + Math.cos(radians + 0.6) * (radius - 90), Number(objectiveLocation.gameWorldZ) + Math.sin(radians + 0.6) * (radius - 90), settings, 120);
    vehicles.push(
      createDefenderVehicle(
        patrolTypes[groupIndex % patrolTypes.length],
        objectiveLocation.initialOwner,
        `objective_patrol_${sanitizeIdFragment(objectiveLocation.name)}_${groupIndex + 1}`,
        spawn.x,
        Number(objectiveLocation.gameWorldY ?? 0),
        spawn.z,
        angle + 135,
        {
          holdPosition: true,
          waypoints: [
            createWaypoint(spawn.x, Number(objectiveLocation.gameWorldY ?? 0), spawn.z, "Unit Spawn"),
            createWaypoint(attack.x, Number(objectiveLocation.gameWorldY ?? 0), attack.z, `${objectiveLocation.name} Outer Patrol`),
            createWaypoint(Number(objectiveLocation.gameWorldX), Number(objectiveLocation.gameWorldY ?? 0), Number(objectiveLocation.gameWorldZ), `${objectiveLocation.name} Defend`),
            createWaypoint(spawn.x, Number(objectiveLocation.gameWorldY ?? 0), spawn.z, objectiveLocation.name)
          ]
        }
      )
    );
  }

  return vehicles;
}

function buildObjectiveAirPatrolVehicles(objectiveLocation, settings) {
  if (!objectiveLocation || objectiveLocation.initialOwner === "Neutral") {
    return [];
  }

  const vehicles = [];
  const altitudeBase = Number(objectiveLocation.gameWorldY ?? 0) + 350;

  if (settings.operationalResistance.helicopters) {
    for (let index = 0; index < settings.patrolPlan.helicopterPatrols; index += 1) {
      const angle = index * 120;
      const radius = 700 + index * 120;
      const radians = (angle * Math.PI) / 180;
      const spawn = applyRandomness(Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius, Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius, settings, 120);
      vehicles.push(
        createDefenderVehicle(
          AIR_PATROL_TYPES.helicopters[index % AIR_PATROL_TYPES.helicopters.length],
          objectiveLocation.initialOwner,
          `objective_helo_patrol_${sanitizeIdFragment(objectiveLocation.name)}_${index + 1}`,
          spawn.x,
          altitudeBase + 120 + index * 20,
          spawn.z,
          angle + 45,
          {
            holdPosition: false,
            waypoints: [
              createWaypoint(spawn.x, altitudeBase + 120 + index * 20, spawn.z, "Unit Spawn"),
              createWaypoint(Number(objectiveLocation.gameWorldX) + 450, altitudeBase + 160, Number(objectiveLocation.gameWorldZ) + 450, `${objectiveLocation.name} Helo Patrol`),
              createWaypoint(Number(objectiveLocation.gameWorldX) - 450, altitudeBase + 160, Number(objectiveLocation.gameWorldZ) - 350, `${objectiveLocation.name} Helo Patrol`),
              createWaypoint(spawn.x, altitudeBase + 120 + index * 20, spawn.z, objectiveLocation.name)
            ]
          }
        )
      );
    }
  }

  if (settings.operationalResistance.fixedWingPatrols) {
    for (let index = 0; index < settings.patrolPlan.fixedWingPatrols; index += 1) {
      const angle = index * 60;
      const radius = 1800 + index * 240;
      const radians = (angle * Math.PI) / 180;
      const spawn = applyRandomness(Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius, Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius, settings, 180);
      vehicles.push(
        createDefenderVehicle(
          AIR_PATROL_TYPES.fixedWing[index % AIR_PATROL_TYPES.fixedWing.length],
          objectiveLocation.initialOwner,
          `objective_fixed_patrol_${sanitizeIdFragment(objectiveLocation.name)}_${index + 1}`,
          spawn.x,
          altitudeBase + 850 + index * 120,
          spawn.z,
          angle + 20,
          {
            holdPosition: false,
            waypoints: [
              createWaypoint(spawn.x, altitudeBase + 850 + index * 120, spawn.z, "Unit Spawn"),
              createWaypoint(Number(objectiveLocation.gameWorldX) + 1200, altitudeBase + 900, Number(objectiveLocation.gameWorldZ) + 800, `${objectiveLocation.name} CAP`),
              createWaypoint(Number(objectiveLocation.gameWorldX) - 1400, altitudeBase + 950, Number(objectiveLocation.gameWorldZ) + 200, `${objectiveLocation.name} CAP`),
              createWaypoint(Number(objectiveLocation.gameWorldX) + 300, altitudeBase + 900, Number(objectiveLocation.gameWorldZ) - 1500, `${objectiveLocation.name} CAP`)
            ]
          }
        )
      );
    }
  }

  return vehicles;
}

function createAircraftUnit(type, faction, uniqueName, x, y, z, headingDegrees, options = {}) {
  const template =
    AIRCRAFT_TEMPLATE_BY_TYPE[type] ||
    AIRCRAFT_TEMPLATE_BY_TYPE.SmallFighter1;
  const radians = (headingDegrees * Math.PI) / 180;
  const altitude = Number(options.altitude ?? y);
  const startingSpeed =
    Number.isFinite(Number(options.startingSpeed))
      ? Number(options.startingSpeed)
      : template.startingSpeed;

  return {
    type,
    faction,
    UniqueName: uniqueName,
    globalPosition: {
      x: Number(x),
      y: altitude,
      z: Number(z)
    },
    rotation: {
      x: 0,
      y: Math.sin(radians / 2),
      z: 0,
      w: Math.cos(radians / 2)
    },
    CaptureStrength: { IsOverride: false, Value: 0 },
    CaptureDefense: { IsOverride: false, Value: 0 },
    unitCustomID: "",
    spawnTiming: "",
    playerControlled: false,
    playerControlledPriority: 0,
    loadout: JSON.parse(JSON.stringify(template.loadout)),
    savedLoadout: JSON.parse(JSON.stringify(template.savedLoadout)),
    livery: template.livery,
    liveryType: template.liveryType,
    liveryName: template.liveryName,
    fuel: template.fuel,
    skill: template.skill,
    bravery: template.bravery,
    startingSpeed
  };
}

function buildObjectiveAirPatrolAircraft(objectiveLocation, settings) {
  if (!objectiveLocation || objectiveLocation.initialOwner === "Neutral") {
    return [];
  }

  const aircraft = [];
  const helosEnabled = Boolean(settings.operationalResistance.helicopters);
  const fixedWingEnabled = Boolean(settings.operationalResistance.fixedWingPatrols);

  if (helosEnabled) {
    const helicopterRadiusBase = Number(settings.patrolPlan.helicopterPatrolRadius || 900);
    for (let index = 0; index < settings.patrolPlan.helicopterPatrols; index += 1) {
      const angle = index * 120 + 35;
      const radius = helicopterRadiusBase + (index % 2) * 140;
      const radians = (angle * Math.PI) / 180;
      const spawn = applyRandomness(
        Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius,
        Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius,
        settings,
        80
      );
      aircraft.push(
        createAircraftUnit(
          "AttackHelo1",
          objectiveLocation.initialOwner,
          `objective_air_helo_${sanitizeIdFragment(objectiveLocation.name)}_${index + 1}`,
          spawn.x,
          Number(objectiveLocation.gameWorldY ?? 0),
          spawn.z,
          angle + 180,
          {
            altitude: Number(objectiveLocation.gameWorldY ?? 0) + 450 + index * 40,
            startingSpeed: 55
          }
        )
      );
    }
  }

  if (fixedWingEnabled) {
    const fixedWingRadiusBase = Number(settings.patrolPlan.fixedWingPatrolRadius || 2600);
    const fixedWingTypes = ["SmallFighter1", "Multirole1"];
    for (let index = 0; index < settings.patrolPlan.fixedWingPatrols; index += 1) {
      const angle = index * 95 + 20;
      const radius = fixedWingRadiusBase + (index % 3) * 320;
      const radians = (angle * Math.PI) / 180;
      const spawn = applyRandomness(
        Number(objectiveLocation.gameWorldX) + Math.cos(radians) * radius,
        Number(objectiveLocation.gameWorldZ) + Math.sin(radians) * radius,
        settings,
        160
      );
      aircraft.push(
        createAircraftUnit(
          fixedWingTypes[index % fixedWingTypes.length],
          objectiveLocation.initialOwner,
          `objective_air_fixed_${sanitizeIdFragment(objectiveLocation.name)}_${index + 1}`,
          spawn.x,
          Number(objectiveLocation.gameWorldY ?? 0),
          spawn.z,
          angle + 180,
          {
            altitude: Number(objectiveLocation.gameWorldY ?? 0) + 1600 + index * 120,
            startingSpeed: 180
          }
        )
      );
    }
  }

  return aircraft;
}

function buildCampaignVehicles(locations, objectiveLocation, settings) {
  const persistedVehicles = buildVehiclesFromPersistentUnits();
  if (persistedVehicles.length > 0) {
    return persistedVehicles;
  }

  return [
    ...buildBaselineDefenseVehicles(locations, settings),
    ...buildObjectiveDefenseVehicles(objectiveLocation, settings),
    ...buildLocalPatrolVehicles(locations, settings),
    ...buildObjectivePatrolVehicles(objectiveLocation, settings),
    ...buildFrontlineActionVehicles(locations, settings),
    ...buildFrontlineMobileVehicles(locations, settings)
  ];
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
      Center: { x: location.gameWorldX, y: location.gameWorldY ?? 0, z: location.gameWorldZ },
      SelectionPosition: { x: location.gameWorldX, y: location.gameWorldY ?? 0, z: location.gameWorldZ },
      VerticalLandingPoints: [],
      ServicePoints: [],
      roads: { roads: [] },
      runways: []
    };
    });
}

async function getCampaignPayload() {
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

  const advancedThreats = getAdvancedThreatSettings();
  const factionResources = collectCampaignLogisticsState();
  const ownershipVehicles = buildCampaignVehicles(locations, objectiveLocation, advancedThreats);
  const objectiveAircraft = buildObjectiveAirPatrolAircraft(objectiveLocation, advancedThreats);
  const targetBuildings = buildObjectiveFactoryBuildings(objectiveLocation, advancedThreats);
  const friendlyResources = factionResources.find((entry) => entry.factionName === els.friendlyFaction.value) || getPersistedFactionState(els.friendlyFaction.value);
  const enemyResources = factionResources.find((entry) => entry.factionName === els.enemyFaction.value) || getPersistedFactionState(els.enemyFaction.value);
  const friendlyStartingBalance = Number(friendlyResources.startingBalance ?? els.startingCash.value ?? 250000);
  const enemyStartingBalance = Number(enemyResources.startingBalance ?? els.startingCash.value ?? 250000);
  const playerJoinAllowance = derivePlayerJoinAllowance(friendlyStartingBalance);

  const factions = [
    {
      factionName: els.friendlyFaction.value,
      preventJoin: false,
      preventDonation: false,
      supplies: cloneSupplies(friendlyResources.supplies),
      startingBalance: friendlyStartingBalance,
      playerJoinAllowance,
      playerTaxRate: 0.2,
      regularIncome: 5,
      excessFundsDistributePercent: 0.25,
      killReward: 1,
      startingWarheads: 0,
      reserveWarheads: 0,
      reserveAirframes: Number(friendlyResources.reserveAirframes ?? 72),
      extraReservesPerPlayer: Number(friendlyResources.extraReservesPerPlayer ?? 12),
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
      preventJoin: true,
      preventDonation: false,
      supplies: cloneSupplies(enemyResources.supplies),
      startingBalance: enemyStartingBalance,
      playerJoinAllowance,
      playerTaxRate: 0,
      regularIncome: 5,
      excessFundsDistributePercent: 0.25,
      killReward: 1,
      startingWarheads: 0,
      reserveWarheads: 0,
      reserveAirframes: Number(enemyResources.reserveAirframes ?? 72),
      extraReservesPerPlayer: Number(enemyResources.extraReservesPerPlayer ?? 12),
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
    briefingGraphic: await buildBriefingGraphic(),
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
      },
      advancedThreats
    },
    initialState: {
      mapKey: map.key,
      mapLabel: map.label,
      startingAirbase,
      objectiveLocation: {
        name: objectiveLocation.name,
        owner: objectiveLocation.initialOwner,
        gameWorldX: objectiveLocation.gameWorldX,
        gameWorldY: objectiveLocation.gameWorldY ?? 0,
        gameWorldZ: objectiveLocation.gameWorldZ,
        profile: els.objectiveUnitProfile.value,
        intensity: OBJECTIVE_INTENSITY_LABELS[Number(els.objectiveIntensity.value || 1)] || "Medium"
      },
      factions,
      locations,
      airbases: buildExportAirbases(map, locations),
      aircraft: objectiveAircraft,
      targetBuildings,
      ownershipVehicles,
      orderOfBattle: {
        units: buildPersistentUnitRecords(ownershipVehicles),
        buildings: targetBuildings
      }
    }
  };
}

async function exportCampaign() {
  try {
    const result = await window.nuclearOptionApi.exportCampaign(await getCampaignPayload());
    if (!result?.ok) {
      els.output.textContent = "Export failed.";
      return;
    }

    const savedState = await window.nuclearOptionApi.loadCampaignState();
    if (savedState?.ok && savedState.exists) {
      state.campaignState = savedState.state;
    } else {
      await persistCampaignState({
        missionCount: Number(state.campaignState?.missionCount || 0) + 1,
        lastExportAt: new Date().toISOString()
      });
    }
    renderCampaignStateSummary();

    const installLine = result.installed
      ? `<div>Installed to game missions: ${result.installedMissionFolder}</div>`
      : `<div>Install to game missions failed: ${result.installError || "unknown error"}</div>`;

    els.output.innerHTML = `
      <div>Campaign exported.</div>
      <div>${result.campaignPath}</div>
      <div>${result.missionFolder}</div>
      <div>Briefing image: ${result.briefingGraphicPath || "not generated"}</div>
      <div>Campaign state: ${result.campaignStatePath || "not saved"}</div>
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
  renderAdvancedSummary();
  renderAdvancedMarkers();
  els.configExistingLocation.value = result.row.name;
  loadConfigFormFromLocation(result.row.name);
  renderConfigMarkers();
  scrollConfigToPixel(result.row.pixelX, result.row.pixelY);
  await persistCampaignState();
  renderCampaignStateSummary();
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
  renderAdvancedSummary();
  renderAdvancedMarkers();
  els.output.innerHTML = `
    <div>Ownership updated.</div>
    <div>${result.row.name} -> ${result.row.initialOwner}</div>
    <div>${result.filePath}</div>
  `;
  await persistCampaignState();
  renderCampaignStateSummary();
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
    renderCampaignLogistics();
    renderConfigLocationOptions();
    updateWorkspaceSummary();
    renderAdvancedSummary();
    if (state.activeView === "config") {
      renderConfigView();
      return;
    }

    if (state.activeView === "advanced") {
      renderAdvancedView();
      return;
    }

    renderCampaignView();
  });

  els.airfieldSelect.addEventListener("change", () => {
    updateWorkspaceSummary();
    renderCampaignMarkers();
    renderAdvancedMarkers();
  });
  els.objectiveTarget.addEventListener("change", () => {
    updateWorkspaceSummary();
    renderCampaignMarkers();
    renderAdvancedSummary();
    renderAdvancedMarkers();
  });
  els.objectiveUnitProfile.addEventListener("change", () => {
    updateWorkspaceSummary();
    renderAdvancedSummary();
  });
  els.objectiveIntensity.addEventListener("input", () => {
    renderObjectiveIntensityValue();
    updateWorkspaceSummary();
    renderAdvancedSummary();
  });
  els.friendlyFaction.addEventListener("change", () => {
    renderLocationOptions();
    renderObjectiveOptions();
    renderOwnershipList();
    renderCampaignLogistics();
    updateWorkspaceSummary();
    renderCampaignMarkers();
    renderAdvancedSummary();
    renderAdvancedMarkers();
    persistCampaignState().then(renderCampaignStateSummary);
  });
  els.enemyFaction.addEventListener("change", () => {
    renderObjectiveOptions();
    renderOwnershipList();
    renderCampaignLogistics();
    updateWorkspaceSummary();
    renderCampaignMarkers();
    renderAdvancedSummary();
    renderAdvancedMarkers();
    persistCampaignState().then(renderCampaignStateSummary);
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
  els.showAdvancedView.addEventListener("click", () => showView("advanced"));
  els.openAdvancedTargets.addEventListener("click", () => showView("advanced"));
  els.campaignScroll.addEventListener("scroll", syncCampaignTopScrollFromMain);
  els.campaignTopScroll.addEventListener("scroll", syncCampaignMainScrollFromTop);
  els.campaignMapImage.addEventListener("load", () => {
    state.campaignImageReady = true;
    els.campaignEmpty.classList.add("hidden");
    renderCampaignMarkers();
    syncCampaignTopScrollFromMain();
  });
  els.campaignMapImage.addEventListener("error", () => {
    state.campaignImageReady = false;
    els.campaignEmpty.textContent = "Campaign map failed to load.";
    els.campaignEmpty.classList.remove("hidden");
  });
  els.advancedMapImage.addEventListener("load", () => {
    state.advancedImageReady = true;
    els.advancedEmpty.classList.add("hidden");
    renderAdvancedMarkers();
  });
  els.advancedMapImage.addEventListener("error", () => {
    state.advancedImageReady = false;
    els.advancedEmpty.textContent = "Advanced map failed to load.";
    els.advancedEmpty.classList.remove("hidden");
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

    if (state.activeView === "advanced" && state.advancedImageReady) {
      renderAdvancedMarkers();
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
  els.applyCampaignResolution.addEventListener("click", applyCampaignResolution);
  [
    els.campaignName,
    els.description,
    els.mapSelect,
    els.airfieldSelect,
    els.objectiveTarget,
    els.objectiveUnitProfile,
    els.objectiveIntensity,
    els.startingRank,
    els.startingCash,
    els.timeOfDay,
    els.weatherIntensity,
    els.allowRespawn,
    els.enableSam,
    els.enableArtillery,
    els.enableFactories,
    els.enableGround,
    els.enableShips,
    els.advancedObjectiveSamSites,
    els.advancedObjectiveArtillerySites,
    els.advancedObjectiveFactoryBuildings,
    els.advancedObjectiveTankUnits,
    els.advancedObjectiveIfvUnits,
    els.advancedResistanceScatteredGround,
    els.advancedResistanceAaa,
    els.advancedResistanceShortSam,
    els.advancedResistanceMediumSam,
    els.advancedResistanceHelicopters,
    els.advancedResistanceFixedWing,
    els.advancedFrontlinePairs,
    els.advancedFrontlinePatrolGroups,
    els.advancedFrontlineConvoyGroups,
    els.advancedLocalePatrolGroups,
    els.advancedObjectivePatrolGroups,
    els.advancedHelicopterPatrolCount,
    els.advancedHelicopterPatrolRadius,
    els.advancedFixedWingPatrolCount,
    els.advancedFixedWingPatrolRadius,
    els.advancedRandomness
  ].forEach((element) => {
    const eventName = element.type === "range" ? "input" : "change";
    element.addEventListener(eventName, () => {
      renderAdvancedRandomnessValue();
      renderAdvancedSummary();
      renderCampaignMarkers();
      renderAdvancedMarkers();
      persistCampaignState().then(renderCampaignStateSummary);
    });
  });
  window.addEventListener("resize", () => {
    if (state.activeView === "config") {
      renderConfigMarkers();
      return;
    }

    if (state.activeView === "advanced") {
      renderAdvancedMarkers();
      return;
    }

    renderCampaignMarkers();
    syncCampaignTopScrollFromMain();
  });

  document.getElementById("generate-campaign").addEventListener("click", exportCampaign);
  document.getElementById("reload-catalog").addEventListener("click", loadCatalog);
  els.setInstallPath.addEventListener("click", chooseInstallPathOverride);
  els.clearInstallPath.addEventListener("click", clearInstallPathOverride);
}

async function loadCatalog() {
  setText(els.scanMeta, "Scanning local install and mission folders...");
  state.catalog = await window.nuclearOptionApi.loadCatalog({
    installPath: state.appSettings?.installPathOverride || undefined,
    missionsPath: state.appSettings?.missionsPathOverride || undefined,
    tempMissionsPath: state.appSettings?.tempMissionsPathOverride || undefined
  });
  const appSettingsResult = await window.nuclearOptionApi.loadAppSettings();
  state.appSettings = appSettingsResult?.ok ? appSettingsResult.settings : null;
  const savedState = await window.nuclearOptionApi.loadCampaignState();
  state.campaignState = savedState?.ok && savedState.exists ? savedState.state : null;
  state.selectedMapKey =
    state.campaignState?.mapKey ||
    state.catalog.maps.find((entry) => entry.key === "Terrain1")?.key ||
    state.catalog.maps[0]?.key ||
    "Terrain1";
  renderStats();
  renderMapOptions();
  renderFactionOptions();
  renderLocationOptions();
  renderObjectiveOptions();
  renderCampaignLogistics();
  applyAdvancedThreatSettings(state.campaignState?.parameters?.advancedThreats || {});
  applyCampaignState();
  renderObjectiveIntensityValue();
  renderAdvancedRandomnessValue();
  renderOwnershipList();
  renderCampaignLogistics();
  renderConfigLocationOptions();
  updateWorkspaceSummary();
  renderCampaignStateSummary();
  updateScanMeta();
  renderCampaignView();
  renderAdvancedView();
}

async function chooseInstallPathOverride() {
  const selectedPath = await window.nuclearOptionApi.chooseDirectory();
  if (!selectedPath) {
    return;
  }

  const result = await window.nuclearOptionApi.saveAppSettings({
    ...(state.appSettings || {}),
    installPathOverride: selectedPath
  });
  if (result?.ok) {
    state.appSettings = result.settings;
    await loadCatalog();
  }
}

async function clearInstallPathOverride() {
  const result = await window.nuclearOptionApi.saveAppSettings({
    ...(state.appSettings || {}),
    installPathOverride: ""
  });
  if (result?.ok) {
    state.appSettings = result.settings;
    await loadCatalog();
  }
}

bindEvents();
state.configZoom = Number(els.configZoom?.value || 1);
renderObjectiveIntensityValue();
renderAdvancedRandomnessValue();
showView("campaign");
updateWorkspaceSummary();
renderCampaignView();
renderAdvancedView();
renderConfigView();
setText(els.scanMeta, "Loading saved campaign state...");
window.setTimeout(() => {
  loadCatalog().catch((error) => {
    setText(els.scanMeta, `Auto-load failed: ${error.message}`);
  });
}, AUTOLOAD_DELAY_MS);

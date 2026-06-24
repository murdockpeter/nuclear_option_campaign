# Nuclear Option Campaign Generator

Electron desktop app for building a persistent multiplayer campaign layer around a local `Nuclear Option` install.

## Overview

This repository now supports three main authoring flows:

1. `Campaign Setup`
   Choose the operational map, starting airfield, factions, initial ownership, logistics, and the immediate objective.

2. `Configure Locations`
   Click directly on the map image, save named locations, and associate each one with exact in-game `X/Z` coordinates.

3. `Advanced Targets`
   Control the objective package, enemy resistance mix, patrol pressure, convoy/front-line activity, and randomness with more precision than the main setup page.

The current focus is still `Heartland`, but the generator is now beyond simple seeding. It builds a reusable campaign start-state, persists it between exports, and uses that saved state to drive follow-on generation.

## Current Capabilities

- Scans the local `Nuclear Option` install and mission folders.
- Auto-loads the current catalog and saved campaign state on startup.
- Persists campaign state to `data/campaign_state.json`.
- Stores named map locations in `data/heartland_pixel_locations.csv`.
- Lets you manually assign initial ownership for each configured location.
- Generates exportable starting missions for multiplayer campaign play.
- Installs generated missions into the live game missions folder when export succeeds.
- Shows operational locations as ownership nodes on the campaign map.
- Marks the starting airfield and current target/objective visually on the map.
- Supports a dedicated advanced-targeting workspace for finer threat control.

## Advanced Targeting

The `Advanced Targets` workspace adds more explicit control over what gets generated around the objective area and across the wider operational theater.

### Objective Package Controls

- `SAM Sites`
- `Artillery Sites`
- `Factory Buildings`
- `Tank Units`
- `IFV Units`

These values drive the immediate target area package more directly than the older objective profile slider alone.

### Enemy Resistance Toggles

- `Scattered Ground Vehicles`
- `Anti-Aircraft Artillery`
- `Short-Range SAM`
- `Medium-Range SAM`
- `Helicopter Patrols`
- `Fixed-Wing Patrols`

These control which types of resistance are eligible to appear in the generated mission.

### Patrol and Pressure Controls

- `Front-Line Axes`
- `Front-Line Patrol Groups`
- `Front-Line Convoy Groups`
- `Locale Patrol Groups`
- `Objective Patrol Groups`
- `Helicopter Patrol Count`
- `Fixed-Wing Patrol Count`
- `Randomization`

These settings shape how active the overall theater feels, including the front line, local area defense, and pressure around the selected objective.

## Campaign State and Persistence

The generator now maintains a persistent campaign-state file:

- `data/campaign_state.json`

This state currently tracks:

- campaign name
- selected map
- saved parameters
- current faction logistics
- location ownership
- current objective metadata
- saved order of battle records for generated units
- exported mission count and timestamps

Campaign resolution updates are also written back into this file so later exports can continue from the saved state instead of always starting from scratch.

## What Gets Generated

The current exporter can generate:

- owned-location baseline defenders
- objective-area defense packages
- front-line skirmish/action groups
- front-line patrol groups
- front-line convoy groups
- local patrol groups near owned locations
- objective-area patrol groups
- helicopter patrol threats
- fixed-wing patrol threats
- objective factory-building targets
- legacy objective markers / position-trigger style briefing support

Ownership is still represented in-game primarily through placed units and capturable airbase state, which fits the current Nuclear Option mission model well.

## UI Notes

- The main campaign map supports both bottom and top horizontal scrolling.
- The header now includes `src/images/nuclear_option.jpg` as a visual hero panel.
- The app auto-loads the catalog shortly after startup, but `Reload Catalog` remains available if you want to force a fresh scan.

## Main Workflow

### Campaign Setup

Use the main view to set:

- map
- starting airfield
- friendly and enemy faction
- starting rank
- starting cash
- target / objective
- ownership for each configured location
- faction logistics and reserves

From there, export a campaign package or jump to `Advanced Targets` for more detailed setup.

### Configure Locations

Use `Configure Locations` to build or refine the location catalog:

1. Click the exact point on the map image.
2. Enter the location name.
3. Enter the in-game `X` coordinate.
4. Enter the in-game `Z` coordinate.
5. Add notes if useful.
6. Save the location to CSV.

Saved locations are rendered back onto the config map so placement can be visually verified.

### Advanced Targets

Use `Advanced Targets` when you want to tune:

- the exact composition of the target package
- which enemy threat types are active
- how dense patrols and convoys should be
- how much randomness should be injected into generated placement

These settings persist into campaign state and are used on the next export.

## Export Output

Exports currently write:

- `exports/<Campaign Name>/campaign.json`
- `exports/<Campaign Name>/<Campaign Name>/meta.json`
- `exports/<Campaign Name>/<Campaign Name>/<Campaign Name>.json`

The exporter also attempts to copy the generated mission folder into:

- `%USERPROFILE%\\AppData\\LocalLow\\Shockfront\\NuclearOption\\Missions`

when that live missions path is available.

## Important Files

- [package.json](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/package.json)
  Electron app entry and scripts.

- [src/main.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/main.js)
  Electron main process and IPC handlers.

- [src/preload.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/preload.js)
  Renderer bridge for catalog loading, export, and persistence calls.

- [src/lib/catalog.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/lib/catalog.js)
  Catalog building, CSV persistence, campaign-state persistence, and mission export logic.

- [src/renderer/index.html](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/index.html)
  Main renderer layout for campaign setup, location config, and advanced targeting.

- [src/renderer/app.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/app.js)
  Renderer logic, map rendering, persistence, and generation setup.

- [src/renderer/styles.css](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/styles.css)
  Desktop UI styling.

- [src/images/nuclear_option.jpg](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/images/nuclear_option.jpg)
  Header hero artwork used in the UI.

- [data/heartland_pixel_locations.csv](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/data/heartland_pixel_locations.csv)
  Current source of truth for configured Heartland map locations.

- [data/campaign_state.json](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/data/campaign_state.json)
  Persistent campaign-state save used between exports.

## CSV Format

`data/heartland_pixel_locations.csv` currently uses:

- `map_key`
- `name`
- `pixel_x`
- `pixel_y`
- `ui_left_percent`
- `ui_top_percent`
- `game_world_x`
- `game_world_z`
- `initial_owner`
- `notes`

`pixel_x` and `pixel_y` come from clicked image positions.

`game_world_x` and `game_world_z` come from the in-game mission editor.

## Run

```powershell
npm install
npm start
```

The app will attempt to auto-load the catalog and saved campaign state after startup.

If needed, use `Reload Catalog` to force a refresh.

## Default Paths

- Install path:
  `C:\Program Files (x86)\Steam\steamapps\common\Nuclear Option`

- Missions path:
  `%USERPROFILE%\AppData\LocalLow\Shockfront\NuclearOption\Missions`

- Temp missions path:
  `%USERPROFILE%\AppData\LocalLow\Shockfront\NuclearOption\TempMissions`

## Current Limitations

- `Heartland` is still the main fully-authored click-to-configure map workflow.
- Persistent state exists, but post-mission damage, attrition, repair, and replenishment logic are still early-stage.
- Air patrol generation is newer and needs more mission-side testing than the ground package does.
- Factory-building generation currently focuses on target-site creation rather than a full economy model.
- The app is building a campaign start-state and continuity layer, not yet a complete strategic campaign engine.

## Next Logical Steps

- Continue validating advanced patrol and air-threat generation in live missions.
- Expand per-location threat overrides beyond the theater-wide advanced settings.
- Grow persistent ORBAT handling into damaged / destroyed / repaired unit state.
- Improve turn-resolution logic around repairs, replenishment, and ownership changes.
- Extend the same authoring workflow to additional supported maps.

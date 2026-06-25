# Nuclear Option Campaign Generator

Electron desktop app for authoring persistent multiplayer campaign start states for `Nuclear Option`.

## What It Does

This project scans a local `Nuclear Option` install, lets you define named operational locations, and exports playable mission files that act as the opening state for a larger campaign.

The current workflow is centered on `Heartland`, with manually curated map anchors, in-game coordinates, persistent ownership, advanced target configuration, and mission export directly into the live game missions folder.

## Core Workflow

The app is organized around three main workspaces:

1. `Campaign Setup`
   Pick the map, starting airfield, factions, starting rank/cash, target objective, logistics, and initial ownership.

2. `Configure Locations`
   Click directly on the map image, name the location, capture exact map pixels, and associate them with in-game `X/Z` coordinates.

3. `Advanced Targets`
   Tune the objective package, enemy resistance types, patrol density, convoy pressure, front-line activity, and enemy air patrol radius.

## Current Feature Set

- Scans the local `Nuclear Option` install and mission folders.
- Auto-detects the local `Nuclear Option` install from Steam library manifests.
- Supports a manual install-path override when the game is not in the detected Steam library.
- Loads and saves persistent campaign state in `data/campaign_state.json`.
- Stores named Heartland map locations in `data/heartland_pixel_locations.csv`.
- Supports manual ownership assignment per named location.
- Exports a fresh mission start-state instead of seeding from an existing scenario.
- Installs exported missions into the live `Nuclear Option` missions folder.
- Exports a mission briefing PNG alongside each generated mission package.
- Persists faction logistics, ownership, objective metadata, and generated order-of-battle records.
- Displays configured locations as ownership nodes on the UI map.
- Highlights the selected starting airfield and objective on the campaign map.
- Supports advanced target generation for ground, factories, patrols, convoys, and air threats.
- Generates airborne enemy helicopter and fixed-wing patrols as real `aircraft` entries.
- Draws configurable helo and fixed-wing patrol radius overlays on the map.
- Produces a mission briefing graphic using the authored map, ownership nodes, objective marker, and patrol overlays.
- Includes mission briefing text showing the intended starting airfield and primary objective.

## Campaign Setup

The main setup page currently supports:

- map selection
- starting airfield selection
- friendly faction selection
- enemy faction selection
- starting rank
- starting cash
- target / objective selection
- objective enemy profile
- objective force concentration
- time of day
- weather intensity
- respawn toggle
- broad threat toggles
- manual initial ownership per named location
- faction reserve airframes and funds via persistent campaign state

The right-side map reflects the current selected map, ownership, objective, and patrol-radius overlays.

## Configure Locations

The location configuration page is the source of truth for the authored operational map layer.

For each location you can:

1. Click the exact location on the map image.
2. Enter or load a location name.
3. Capture and save `pixel_x` and `pixel_y`.
4. Enter the in-game `X` and `Z` coordinates.
5. Save notes for later reference.

Saved points are rendered back onto the map immediately so the UI position can be visually verified.

## Advanced Targets

The `Advanced Targets` page controls both the immediate objective package and the larger operational pressure around the map.

### Objective Package

- `SAM Sites`
- `Artillery Sites`
- `Factory Buildings`
- `Tank Units`
- `IFV Units`

These drive the explicit enemy package placed around the selected target.

### Enemy Resistance Toggles

- `Scattered Ground Vehicles`
- `Anti-Aircraft Artillery`
- `Short-Range SAM`
- `Medium-Range SAM`
- `Helicopter Patrols`
- `Fixed-Wing Patrols`

These determine which categories of resistance are eligible to appear.

### Patrol and Pressure Controls

- `Front-Line Axes`
- `Front-Line Patrol Groups`
- `Front-Line Convoy Groups`
- `Locale Patrol Groups`
- `Objective Patrol Groups`
- `Helicopter Patrol Count`
- `Helicopter Patrol Radius`
- `Fixed-Wing Patrol Count`
- `Fixed-Wing Patrol Radius`
- `Randomization`

These settings shape how active the theater feels and how far enemy air patrols operate from the target area.

## Mission Generation Model

The exporter currently builds a mission out of:

- baseline defenders at owned locations
- explicit objective defense units
- local patrol vehicles
- objective-area patrol vehicles
- front-line skirmish groups
- front-line convoy groups
- airborne enemy helicopter patrols
- airborne enemy fixed-wing patrols
- objective factory targets
- mission briefing and primary objective records

Ownership is represented in-game through faction-controlled capturable airbases and placed ground units near those locations.

## Air Patrol Behavior

Enemy air patrols now export as actual `aircraft` entries rather than vehicle stand-ins.

Current behavior:

- helicopters spawn airborne around the objective at a configurable helo patrol radius
- fixed-wing aircraft spawn airborne farther out at a configurable fixed-wing patrol radius
- both patrol radii are drawn as overlays on the map

This is intended to make the target area feel like it is being actively screened instead of having aircraft spawn directly on top of the objective.

## Persistence

Persistent campaign data is stored in:

- `data/campaign_state.json`

It currently tracks:

- campaign name
- selected map
- saved parameters
- faction logistics and supplies
- location ownership
- current objective metadata
- generated order of battle
- mission export count
- timestamps for export and resolution state

Location authoring data is stored in:

- `data/heartland_pixel_locations.csv`

## Export Output

Exports currently write:

- `exports/<Campaign Name>/campaign.json`
- `exports/<Campaign Name>/<Campaign Name>/meta.json`
- `exports/<Campaign Name>/<Campaign Name>/<Campaign Name>.json`
- `exports/<Campaign Name>/<Campaign Name>/<Campaign Name>_briefing.png`

The exporter also attempts to install the generated mission into:

- `%USERPROFILE%\\AppData\\LocalLow\\Shockfront\\NuclearOption\\Missions`

## Important Files

- [package.json](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/package.json)
  Project scripts and Electron dependency setup.

- [src/main.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/main.js)
  Electron main process and IPC wiring.

- [src/preload.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/preload.js)
  Renderer bridge for catalog, persistence, and export operations.

- [src/lib/catalog.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/lib/catalog.js)
  Catalog scanning, CSV persistence, campaign-state persistence, and mission export logic.

- [src/renderer/index.html](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/index.html)
  Main UI layout.

- [src/renderer/app.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/app.js)
  Renderer-side state, map rendering, location config, advanced targeting, and export payload setup.

- [src/renderer/styles.css](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/styles.css)
  Desktop UI styling.

- [src/images/nuclear_option.jpg](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/images/nuclear_option.jpg)
  Hero artwork used in the header.

- [data/heartland_pixel_locations.csv](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/data/heartland_pixel_locations.csv)
  Authored map anchor and in-game coordinate source of truth for Heartland.

- [data/campaign_state.json](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/data/campaign_state.json)
  Persistent campaign save data.

## CSV Fields

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

`pixel_x` and `pixel_y` come from clicks on the UI map image.

`game_world_x` and `game_world_z` come from the in-game mission editor.

## Run

```powershell
npm install
npm start
```

## Default Paths

The app now tries to auto-detect `Nuclear Option` from Steam app manifests across known Steam library folders before falling back to the traditional default install path.

- Install path:
  `C:\Program Files (x86)\Steam\steamapps\common\Nuclear Option`

- Live missions path:
  `%USERPROFILE%\AppData\LocalLow\Shockfront\NuclearOption\Missions`

- Temp missions path:
  `%USERPROFILE%\AppData\LocalLow\Shockfront\NuclearOption\TempMissions`

## Current Scope and Limitations

- `Heartland` is the main fully-authored map workflow today.
- This project currently builds the campaign opening state and continuity data, not a full strategic campaign engine.
- Persistent resolution logic exists, but attrition, repairs, replenishment, and ORBAT evolution are still early-stage.
- Air patrol generation is working, but continued live-mission tuning is still useful.
- Airbase export is functional for current campaign generation, but not all deeper mission-editor authoring data is yet modeled.

## Near-Term Direction

- continue improving persistent ORBAT and post-mission resolution
- increase per-location control over threat composition
- refine objective completion logic to include more target classes
- improve front-line behavior and convoy/patrol movement over time
- extend the authored workflow to additional supported maps

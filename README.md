# Nuclear Option Campaign Generator

Electron prototype for building a dynamic-campaign layer around a local `Nuclear Option` install.

## Status

This repository is currently focused on two working paths:

1. `Campaign Setup`
   Used to choose a map, set the starting airfield, assign initial ownership for each named location, and export a starting campaign mission.

2. `Configure Locations`
   Used to click exact points on the Heartland map image, name those locations, enter in-game `X/Z` coordinates, and save them into a CSV that becomes the source of truth for later scenario generation.

The Heartland location-config workflow is the main active authoring flow at the moment.

## What It Does

- Scans the current local `Nuclear Option` mission folders.
- Builds a catalog of readable missions, maps, factions, and configured locations.
- Opens an Electron desktop UI for campaign setup and location configuration.
- Lets you save named Heartland locations directly from the map image into a CSV.
- Lets you persist initial ownership for each configured location.
- Places faction ground marker units near owned locations during export so the generated mission starts with visible territorial control.
- Exports campaign packages to:
  - `exports/<Campaign Name>/campaign.json`
  - `exports/<Campaign Name>/<Campaign Name>/meta.json`
  - `exports/<Campaign Name>/<Campaign Name>/<Campaign Name>.json`
- Attempts to install generated missions into the live game missions folder as part of export.

## Current Workflow

### Campaign Setup

Use the main setup view to select:

- map
- starting airfield
- factions
- starting rank
- starting cash
- initial ownership for each named location

Then export a campaign package.

### Configure Locations

Use `Configure Locations` to build the location catalog one point at a time:

1. Click a precise point on the Heartland map.
2. Enter the location name.
3. Enter the in-game `X` and `Z` coordinates.
4. Add optional notes.
5. Save the row to CSV.

Saved locations are shown back on the config map as nodes so placement can be visually checked.

## Important Files

- [package.json](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/package.json)
  Electron app entry and scripts.

- [src/main.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/main.js)
  Electron main process and IPC handlers.

- [src/lib/catalog.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/lib/catalog.js)
  Catalog building, mission export, and CSV/location persistence logic.

- [src/renderer/index.html](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/index.html)
  Main renderer layout.

- [src/renderer/app.js](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/app.js)
  Renderer logic for campaign setup and location configuration.

- [src/renderer/styles.css](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/src/renderer/styles.css)
  Desktop UI styling.

- [data/heartland_pixel_locations.csv](C:/Users/Peter%20G.%20Robbins/Documents/claudeprojects/nuclear_option_campaign/data/heartland_pixel_locations.csv)
  Current source of truth for configured Heartland map locations.

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

`pixel_x` and `pixel_y` come from the clicked map image.

`game_world_x` and `game_world_z` come from in-game mission editor coordinates.

## Run

```powershell
npm install
npm start
```

After launch, use `Reload Catalog` to initialize scanning and load the current mission catalog.

## Assumptions

- Default install path:
  `C:\Program Files (x86)\Steam\steamapps\common\Nuclear Option`

- Default missions path:
  `%USERPROFILE%\AppData\LocalLow\Shockfront\NuclearOption\Missions`

- Default temp missions path:
  `%USERPROFILE%\AppData\LocalLow\Shockfront\NuclearOption\TempMissions`

## Current Limitations

- Heartland is the main map currently configured for exact click-to-CSV authoring.
- The app currently generates a starting campaign state rather than a full branching dynamic campaign.
- Exported ownership is represented by placed ground units near configured locations; broader order-of-battle persistence is still to come.
- Some older data files remain in `data/` from earlier calibration attempts and may not all be active sources.

## Next Likely Steps

- Finish entering a clean Heartland location set with exact in-game coordinates.
- Use configured CSV locations as the only source of truth for ownership, targeting, and placement.
- Expand the same workflow to additional maps.
- Persist post-mission results into a fuller order of battle.

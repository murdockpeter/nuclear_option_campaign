# Pre-refresh rollback resources

`pre-game-assets-refresh-2026-07-27.zip` is an exact snapshot taken before the
installed-game asset refresh. It contains the four pre-existing `data` files
plus the two source files that held hard-coded generator rosters:

- `campaign_state.json`
- `heartland_editor_targets.csv`
- `heartland_locations.csv`
- `heartland_pixel_locations.csv`
- `app.js`
- `catalog.js`

Snapshot SHA-256:
`69384A00DF90DAA869156B7EC40D4AA330CE9501ADFE1598F19EB2B982777484`

The source worktree was clean at commit `bc1b089` before the refresh. Either
the archive or that commit can be used to compare/restore the former behavior.

`pre-game-assets-refresh-2026-07-27.json` records the former hard-coded asset
rosters in a directly readable form for troubleshooting.

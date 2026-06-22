const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { buildCatalog, exportCampaign, saveMapAnchor, upsertConfiguredLocation, DEFAULT_PATHS } = require("./lib/catalog");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1200,
    minHeight: 820,
    backgroundColor: "#10181e",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("catalog:load", async (_event, requestedPaths = {}) => {
    return buildCatalog({ ...DEFAULT_PATHS, ...requestedPaths });
  });

  ipcMain.handle("campaign:export", async (_event, payload) => {
    return exportCampaign(payload);
  });

  ipcMain.handle("anchors:save", async (_event, payload) => {
    return saveMapAnchor(payload);
  });

  ipcMain.handle("locations:save", async (_event, payload) => {
    return upsertConfiguredLocation(payload);
  });

  ipcMain.handle("dialog:chooseDirectory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

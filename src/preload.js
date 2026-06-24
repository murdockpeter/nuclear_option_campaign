const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nuclearOptionApi", {
  loadCatalog: (paths) => ipcRenderer.invoke("catalog:load", paths),
  exportCampaign: (payload) => ipcRenderer.invoke("campaign:export", payload),
  loadCampaignState: () => ipcRenderer.invoke("campaignState:load"),
  saveCampaignState: (payload) => ipcRenderer.invoke("campaignState:save", payload),
  saveAnchor: (payload) => ipcRenderer.invoke("anchors:save", payload),
  saveLocation: (payload) => ipcRenderer.invoke("locations:save", payload),
  saveLocationOwnership: (payload) => ipcRenderer.invoke("locations:saveOwnership", payload),
  chooseDirectory: () => ipcRenderer.invoke("dialog:chooseDirectory")
});

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts')
});

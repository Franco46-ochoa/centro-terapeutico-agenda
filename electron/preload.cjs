const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktopEnv', {
  isDesktopApp: true,
  platform: process.platform,
});

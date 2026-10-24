// =============================================================================
// ELECTRON MAIN PROCESS ENDURECIDO (Windows Desktop)
// - contextIsolation: true, nodeIntegration: false, sandbox: true
// - Desactiva spellcheck externo para no filtrar términos clínicos
// - Bloquea permisos de hardware innecesarios y navegación externa
// =============================================================================

const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  process.env.APP_PRODUCTION_URL || 'https://centro-terapeutico.vercel.app',
]);

function createSecureWindow() {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    }
  );

  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Centro Terapéutico - Gestión Clínica',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      if (!ALLOWED_ORIGINS.has(parsedUrl.origin)) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createSecureWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Azima — Electron main process (Windows desktop)
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

app.setAppUserModelId('com.azima.app');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win = null;
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');
const readState = () => { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return {}; } };

function createWindow() {
  const st = readState();
  win = new BrowserWindow({
    width: st.width || 900,
    height: st.height || 820,
    x: st.x,
    y: st.y,
    minWidth: 400,
    minHeight: 560,
    show: false,
    backgroundColor: '#0a1020',
    title: 'عزيمة',
    icon: path.join(__dirname, 'resources', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  Menu.setApplicationMenu(null);
  if (st.maximized) win.maximize();
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.once('ready-to-show', () => win.show());

  // WhatsApp / external links open in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  const save = () => {
    if (!win || win.isMinimized()) return;
    const maximized = win.isMaximized();
    const b = maximized ? readState() : win.getBounds();
    try { fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized })); } catch { /* ignore */ }
  };
  win.on('resize', save);
  win.on('move', save);
}

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

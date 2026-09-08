import { app, BrowserWindow, Menu, shell, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../build/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'iM뱅크 JSON 에디터',
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  createMenu();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: 'iM뱅크 JSON 에디터',
      submenu: [
        { role: 'about', label: 'iM뱅크 JSON 에디터 정보' },
        { type: 'separator' },
        { role: 'hide', label: '숨기기' },
        { role: 'hideOthers', label: '다른 항목 숨기기' },
        { role: 'unhide', label: '모두 표시' },
        { type: 'separator' },
        { role: 'quit', label: '종료' }
      ]
    }] : []),
    {
      label: '파일(F)',
      submenu: [
        isMac ? { role: 'close', label: '창 닫기' } : { role: 'quit', label: '종료' }
      ]
    },
    {
      label: '편집(E)',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '모두 선택' }
      ]
    },
    {
      label: '보기(V)',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강제 새로고침' },
        { role: 'toggleDevTools', label: '개발자 도구 토글' },
        { type: 'separator' },
        { role: 'resetZoom', label: '실제 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체 화면' }
      ]
    },
    {
      label: '도움말(H)',
      submenu: [
        {
          label: 'iM뱅크 JSON 에디터 정보',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'iM뱅크 JSON 에디터',
              message: 'iM뱅크 JSON 에디터 v1.0.0',
              detail: '사내 완전 오프라인 데스크톱 애플리케이션 (Electron)\niM-Bank Offline JSON Editor'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  ipcMain.handle('get-system-fonts', async () => {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        const cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command "[System.Drawing.FontFamily]::Families | Select-Object -ExpandProperty Name"';
        exec(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
          if (err || !stdout) {
            resolve([]);
            return;
          }
          const fonts = stdout
            .split(/\r?\n/)
            .map((f) => f.trim())
            .filter((f) => f.length > 0);
          const uniqueFonts = Array.from(new Set(fonts)).sort((a, b) => a.localeCompare(b));
          resolve(uniqueFonts);
        });
      } else if (process.platform === 'darwin') {
        exec('fc-list : family | sort -u', { encoding: 'utf8' }, (err, stdout) => {
          if (err || !stdout) {
            resolve([]);
            return;
          }
          const fonts = stdout
            .split(/\r?\n/)
            .map((f) => f.trim())
            .filter((f) => f.length > 0);
          const uniqueFonts = Array.from(new Set(fonts)).sort((a, b) => a.localeCompare(b));
          resolve(uniqueFonts);
        });
      } else {
        resolve([]);
      }
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

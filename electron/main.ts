import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import * as http from 'http';
import * as https from 'https';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  if (isDev) {
    // Wait for Vite dev server to be ready
    const checkServer = (port: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}`, (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          req.destroy();
          resolve(false);
        });
      });
    };

    const loadDevServer = async () => {
      const ports = [5173, 5174]; // Try both ports
      const maxAttempts = 60; // Increased attempts
      
      console.log('Waiting for Vite dev server...');
      
      // Initial delay to let Vite fully start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      for (let i = 0; i < maxAttempts; i++) {
        for (const port of ports) {
          const isReady = await checkServer(port);
          if (isReady) {
            console.log(`✓ Vite server ready on port ${port}`);
            // Extra delay to ensure Vite is fully ready
            await new Promise(resolve => setTimeout(resolve, 500));
            mainWindow?.loadURL(`http://127.0.0.1:${port}`);
            mainWindow?.webContents.openDevTools();
            return;
          }
        }
        if (i % 5 === 0 && i > 0) {
          console.log(`Still waiting... (attempt ${i}/${maxAttempts})`);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.error('✗ Vite dev server did not start in time');
      console.error('Please make sure Vite is running on port 5173 or 5174');
    };
    
    loadDevServer();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  registerIPCHandlers();

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

function registerIPCHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  // File system operations
  ipcMain.handle('fs:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  });

  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      const fileNodes = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          const node: any = {
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? 'directory' : 'file'
          };

          if (entry.isDirectory()) {
            try {
              const children = await fs.readdir(fullPath, { withFileTypes: true });
              node.children = children.map(child => ({
                name: child.name,
                path: path.join(fullPath, child.name),
                type: child.isDirectory() ? 'directory' : 'file'
              }));
            } catch {
              node.children = [];
            }
          }

          return node;
        })
      );

      return fileNodes;
    } catch (error: any) {
      throw new Error(`Failed to read directory: ${error.message}`);
    }
  });

  ipcMain.handle('fs:createFile', async (_event, filePath: string) => {
    try {
      await fs.writeFile(filePath, '', 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to create file: ${error.message}`);
    }
  });

  ipcMain.handle('fs:createDir', async (_event, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  });

  ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
    } catch (error: any) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  });

  ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
    } catch (error: any) {
      throw new Error(`Failed to rename: ${error.message}`);
    }
  });

  ipcMain.handle('fs:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py'] }
      ]
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  ipcMain.handle('fs:revealInExplorer', async (_event, filePath: string) => {
    const { shell } = await import('electron');
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle('fs:getHomeDir', async () => {
    return app.getPath('home');
  });

  // Real terminal with node-pty
  const terminals = new Map<number, any>();
  let terminalIdCounter = 0;

  ipcMain.handle('terminal:create', async (_event, cwd: string) => {
    try {
      // Use dynamic import for node-pty since we're in ES module mode
      const pty = await import('node-pty');
      
      // Better shell detection for Windows
      let shell: string;
      let shellArgs: string[] = [];
      
      if (process.platform === 'win32') {
        // Try PowerShell 7 first, then PowerShell 5, then cmd
        const pwsh = 'pwsh.exe';
        const powershell = 'powershell.exe';
        const cmd = 'cmd.exe';
        
        try {
          // Check if pwsh exists
          await fs.access('C:\\Program Files\\PowerShell\\7\\pwsh.exe');
          shell = pwsh;
          shellArgs = ['-NoLogo'];
        } catch {
          shell = powershell;
          shellArgs = ['-NoLogo'];
        }
      } else {
        shell = process.env.SHELL || 'bash';
      }
      
      const ptyProcess = pty.spawn(shell, shellArgs, {
        name: 'xterm-256color',
        cols: 80,
        rows: 30,
        cwd: cwd || process.cwd(),
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        } as any
      });

      const id = ++terminalIdCounter;
      terminals.set(id, ptyProcess);

      // Send data to renderer
      ptyProcess.onData((data: string) => {
        mainWindow?.webContents.send('terminal:data', id, data);
      });

      ptyProcess.onExit(() => {
        terminals.delete(id);
        mainWindow?.webContents.send('terminal:exit', id);
      });

      return { id, cwd: cwd || process.cwd() };
    } catch (error) {
      console.error('Failed to create terminal:', error);
      throw error;
    }
  });

  ipcMain.handle('terminal:write', async (_event, id: number, data: string) => {
    const terminal = terminals.get(id);
    if (terminal) {
      terminal.write(data);
    }
  });

  ipcMain.handle('terminal:resize', async (_event, id: number, cols: number, rows: number) => {
    const terminal = terminals.get(id);
    if (terminal) {
      terminal.resize(cols, rows);
    }
  });

  ipcMain.handle('terminal:kill', async (_event, id: number) => {
    const terminal = terminals.get(id);
    if (terminal) {
      terminal.kill();
      terminals.delete(id);
    }
  });

  // AI API handler - Timeweb Cloud AI (DeepSeek V3.2) only
  ipcMain.handle('ai:chat', async (event, params) => {
    return new Promise((resolve, reject) => {
      const agentAccessId = params.agentAccessId || '17860839-deaa-48e6-a827-741ad4ce7e6e';
      
      const data = JSON.stringify({
        model: params.model || 'deepseek-v3.2',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 8000,
        top_p: params.top_p || 1.0,
        presence_penalty: params.presence_penalty || 0,
        frequency_penalty: params.frequency_penalty || 0,
        stream: false
      });

      const hostname = 'agent.timeweb.cloud';
      const path = `/api/v1/cloud-ai/agents/${agentAccessId}/v1/chat/completions`;
      
      // Authorization token
      const authToken = params.authToken || process.env.TIMEWEB_AUTH_TOKEN || '';
      
      console.log(`[Timeweb DeepSeek] Auth Token Available:`, authToken ? `Yes (${authToken.substring(0, 20)}...)` : 'No');
      console.log(`[Timeweb DeepSeek] Agent Access ID:`, agentAccessId);
      
      const headers = {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${authToken}`,
        'Content-Length': Buffer.byteLength(data)
      };

      const options = {
        hostname,
        port: 443,
        path,
        method: 'POST',
        headers
      };

      console.log(`[Timeweb DeepSeek] API Request:`, { 
        model: params.model,
        maxTokens: params.max_tokens,
        temperature: params.temperature,
        endpoint: `https://${hostname}${path}`,
        messagesCount: params.messages?.length || 0
      });

      const req = https.request(options, (res) => {
        let responseData = '';

        console.log(`[Timeweb DeepSeek] Response Status:`, res.statusCode);

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          console.log(`[Timeweb DeepSeek] Response Data:`, responseData.substring(0, 200));
          
          // Check HTTP status code before parsing
          if (res.statusCode && res.statusCode >= 400) {
            console.error(`[Timeweb DeepSeek] HTTP Error ${res.statusCode}:`, responseData);
            
            // User-friendly error messages
            if (res.statusCode === 502) {
              reject(new Error(`🔧 Сервер Timeweb временно недоступен (502). Попробуйте через минуту.`));
            } else if (res.statusCode === 503) {
              reject(new Error('⚠️ Сервис перегружен (503). Попробуйте позже.'));
            } else if (res.statusCode === 429) {
              reject(new Error('⚠️ Превышен лимит запросов (429). Проверьте баланс.'));
            } else if (res.statusCode === 401 || res.statusCode === 403) {
              reject(new Error('🔑 Ошибка авторизации. Проверьте Agent Access ID.'));
            } else if (res.statusCode === 404) {
              reject(new Error('❌ Агент не найден (404). Проверьте Agent Access ID: 17860839-deaa-48e6-a827-741ad4ce7e6e'));
            } else {
              reject(new Error(`❌ HTTP ошибка ${res.statusCode}: ${responseData}`));
            }
            return;
          }
          
          try {
            const parsed = JSON.parse(responseData);
            console.log(`[Timeweb DeepSeek] Parsed Response:`, parsed);
            resolve(parsed);
          } catch (error) {
            console.error('Failed to parse Timeweb API response:', error);
            reject(new Error(`Failed to parse response: ${error}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`API request failed: ${error.message}`));
      });

      req.write(data);
      req.end();
    });
  });
}

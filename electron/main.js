'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { waitForPort } = require('./src/ipc');

let mainWindow = null;
let javaProcess = null;

// Optional E2E support
const e2eMockArg = process.argv.find(arg => arg.startsWith('--e2e-mock='));
const e2eMockUrl = e2eMockArg
    ? e2eMockArg.substring('--e2e-mock='.length)
    : null;

/**
 * Start Spring Boot backend
 */
function spawnBackend() {

    if (!app.isPackaged) {

        console.log("========== STARTING BACKEND ==========");

        const jarPath = path.join(
            __dirname,
            '..',
            'backend',
            'target',
            'naukri-be.jar'
        );

        console.log("Backend JAR:", jarPath);

        const child = spawn(
            'java',
            [
                '-jar',
                jarPath,
                '--server.port=0'
            ],
            {
                shell: true,
                stdio: ['ignore', 'pipe', 'pipe']
            }
        );

        child.stdout.on('data', data => {
            process.stdout.write(data);
        });

        child.stderr.on('data', data => {
            process.stderr.write(data);
        });

        child.on('error', err => {
            console.error("Backend failed:", err);
        });

        return child;
    }

    // -------- Production --------

    const javaExe = path.join(
        process.resourcesPath,
        'jre',
        'bin',
        'javaw.exe'
    );

    const jar = path.join(
        process.resourcesPath,
        'backend',
        'naukri-be.jar'
    );

    const child = spawn(
        javaExe,
        [
            '-jar',
            jar,
            '--server.port=0'
        ],
        {
            stdio: ['ignore', 'pipe', 'pipe']
        }
    );

    child.stderr.on('data', d => process.stderr.write(d));

    child.on('error', err => {
        console.error(err);
    });

    return child;
}

/**
 * Create Electron window
 */
async function createWindow(port) {

    mainWindow = new BrowserWindow({

        width: 1280,
        height: 800,
        title: "NaukriAutomator",
        autoHideMenuBar: true,
        backgroundColor: "#050915",

        webPreferences: {

            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false

        }

    });

    if (!app.isPackaged) {

        let url = `http://localhost:5173/?port=${port}`;

        if (e2eMockUrl) {
            url += `&e2eMock=${encodeURIComponent(e2eMockUrl)}`;
        }

        console.log("Loading:", url);

        await mainWindow.loadURL(url);

        mainWindow.webContents.openDevTools();

    } else {

        const index = path.join(
            __dirname,
            'renderer',
            'index.html'
        );

        const query = {
            port: String(port)
        };

        if (e2eMockUrl) {
            query.e2eMock = e2eMockUrl;
        }

        await mainWindow.loadFile(index, { query });

    }

    mainWindow.on('closed', () => {

        mainWindow = null;

        if (javaProcess) {
            javaProcess.kill();
            javaProcess = null;
        }

    });

}

/**
 * Pick Folder
 */
ipcMain.handle('pickFolder', async (_event, defaultPath) => {

    const result = await dialog.showOpenDialog(mainWindow, {

        properties: ['openDirectory'],
        defaultPath

    });

    if (result.canceled)
        return null;

    return result.filePaths[0];

});

/**
 * Open Folder
 */
ipcMain.handle('openFolder', async (_event, folder) => {

    if (folder)
        shell.openPath(folder);

});

/**
 * Application Start
 */
app.whenReady().then(async () => {

    try {

        javaProcess = spawnBackend();

        const port = await waitForPort(
            javaProcess,
            60000
        );

        console.log("--------------------------------");
        console.log("Backend Port:", port);
        console.log("--------------------------------");

        await createWindow(port);

    }
    catch (err) {

        console.error(err);

        dialog.showErrorBox(
            "Backend Startup Failed",
            err.message
        );

        app.quit();

    }

});

app.on('window-all-closed', () => {

    if (process.platform !== 'darwin')
        app.quit();

});

app.on('will-quit', () => {

    if (javaProcess) {

        javaProcess.kill();

        javaProcess = null;

    }

});
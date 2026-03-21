const { app, BrowserWindow, ipcMain } = require('electron');
const { installExtension, REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
const path = require('path');
const { registerIpcHandlers } = require('./ipc');

registerIpcHandlers(ipcMain);

function createWindow(isPackaged) {
	// Create the browser window
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false, // set to true only if you need Node.js in your frontend
			contextIsolation: true, // recommended for security
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	// Load your web app URL or local build
	// For local React/Vue/Next.js app after `npm build`
	// win.loadFile(path.join(__dirname, 'dist/index.html'));

	// OR for live web app
	win.loadURL('http://localhost:5173/');
	// win.loadURL('https://demmi.moondreams.dev/');

	if (!isPackaged) {
		win.webContents.openDevTools();
	}
}

app.whenReady().then(() => {
	const isPackaged = app.isPackaged;
	console.log(`App is running in ${isPackaged ? 'production' : 'development'} mode.`);

	if (!isPackaged) {
		installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS], { loadExtensionOptions: { allowFileAccess: true } })
			.then(([redux, react]) => console.log(`Added Extensions:  ${redux.name}, ${react.name}`))
			.catch((err) => console.log('An error occurred: ', err));
	}

	createWindow(isPackaged);

	// For macOS, re-create a window when the dock icon is clicked and there are no other windows open
	// Placed within `whenReady` because windows cannot be created before the `ready` event
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow(isPackaged);
	});
});

// For Windows and Linux, quit the app when all windows are closed
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

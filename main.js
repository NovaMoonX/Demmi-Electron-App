const { app, BrowserWindow } = require('electron');
// const path = require('path');

function createWindow() {
	// Create the browser window
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false, // set to true only if you need Node.js in your frontend
			contextIsolation: true, // recommended for security
		},
	});

	// Load your web app URL or local build
	// For local React/Vue/Next.js app after `npm build`
	// win.loadFile(path.join(__dirname, 'dist/index.html'));

	// OR for live web app
	win.loadURL('https://demmi.moondreams.dev/');
}

app.whenReady().then(() => {
	createWindow();

  // For macOS, re-create a window when the dock icon is clicked and there are no other windows open
  // Placed within `whenReady` because windows cannot be created before the `ready` event
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// For Windows and Linux, quit the app when all windows are closed
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

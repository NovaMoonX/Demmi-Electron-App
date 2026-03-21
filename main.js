const { app, BrowserWindow, ipcMain } = require('electron');
const { installExtension, REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
const path = require('path');
const https = require('https');
const http = require('http');
const cheerio = require('cheerio');

/**
 * Fetch the raw HTML body of a URL, following redirects.
 * Only http and https protocols are supported; max 5 redirect hops.
 * @param {string} url
 * @param {number} [redirectDepth=0]
 * @returns {Promise<string>}
 */
function fetchHTML(url, redirectDepth = 0) {
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		return Promise.reject(new Error(`Unsupported protocol for URL: ${url}`));
	}
	if (redirectDepth > 5) {
		return Promise.reject(new Error('Too many redirects'));
	}
	return new Promise((resolve, reject) => {
		const client = url.startsWith('https') ? https : http;
		const options = {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (compatible; Demmi-Electron-App/1.0; +https://github.com/NovaMoonX/Demmi-Electron-App)',
			},
		};
		const request = client.get(url, options, (res) => {
			// Follow redirects, validating the redirect destination
			if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
				const redirectUrl = new URL(res.headers.location, url).href;
				if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
					reject(new Error(`Redirect to unsupported protocol: ${redirectUrl}`));
					res.resume();
					return;
				}
				fetchHTML(redirectUrl, redirectDepth + 1).then(resolve).catch(reject);
				res.resume();
				return;
			}
			if (res.statusCode < 200 || res.statusCode >= 300) {
				reject(new Error(`HTTP ${res.statusCode} for ${url}`));
				res.resume();
				return;
			}
			let data = '';
			res.setEncoding('utf8');
			res.on('data', (chunk) => (data += chunk));
			res.on('end', () => resolve(data));
			res.on('error', reject);
		});
		request.on('error', reject);
		request.setTimeout(10000, () => {
			request.destroy(new Error('Request timed out'));
		});
	});
}

/**
 * Extract Open Graph / standard metadata from an HTML string.
 * @param {string} html
 * @param {string} url  Original URL (used as fallback for the url field)
 * @returns {object}
 */
function extractMetadata(html, url) {
	const $ = cheerio.load(html);

	const og = (property) =>
		$(`meta[property="og:${property}"]`).attr('content') ||
		$(`meta[name="og:${property}"]`).attr('content') ||
		null;
	const meta = (name) =>
		$(`meta[name="${name}"]`).attr('content') ||
		$(`meta[property="${name}"]`).attr('content') ||
		null;

	const title =
		og('title') ||
		meta('twitter:title') ||
		$('title').first().text().trim() ||
		null;

	const description =
		og('description') ||
		meta('description') ||
		meta('twitter:description') ||
		null;

	const image =
		og('image') ||
		meta('twitter:image') ||
		meta('twitter:image:src') ||
		null;

	const siteName = og('site_name') || meta('application-name') || null;

	const author =
		meta('author') ||
		meta('article:author') ||
		$('[rel="author"]').first().text().trim() ||
		null;

	const date =
		meta('article:published_time') ||
		meta('article:modified_time') ||
		meta('date') ||
		meta('pubdate') ||
		$('time[datetime]').first().attr('datetime') ||
		null;

	const canonicalUrl =
		og('url') ||
		$('link[rel="canonical"]').attr('href') ||
		url;

	return {
		url: canonicalUrl,
		title: title || null,
		description: description || null,
		image: image || null,
		siteName: siteName || null,
		author: author || null,
		date: date || null,
	};
}

/**
 * Extract the main recipe text content from an HTML string.
 * Tries <article>, then <main>, then <body> as fallbacks.
 * Strips script/style/nav/footer elements and returns plain text.
 * @param {string} html
 * @returns {string}
 */
function extractRecipeContent(html) {
	const $ = cheerio.load(html);

	// Remove elements that don't contribute to readable content
	$('script, style, noscript, nav, header, footer, aside, form, iframe').remove();

	let contentEl = $('article').first();
	if (!contentEl.length) contentEl = $('[class*="recipe"]').first();
	if (!contentEl.length) contentEl = $('[id*="recipe"]').first();
	if (!contentEl.length) contentEl = $('main').first();
	if (!contentEl.length) contentEl = $('body');

	// Collapse whitespace and trim
	const text = contentEl
		.text()
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	return text;
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

/**
 * fetch-url-metadata
 * Returns metadata (title, description, image, url, siteName, author, date)
 * for the provided URL.
 */
ipcMain.handle('fetch-url-metadata', async (_event, url) => {
	if (!url || typeof url !== 'string') {
		throw new Error('A valid URL string is required.');
	}
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		throw new Error('Only http and https URLs are supported.');
	}
	const html = await fetchHTML(url);
	return extractMetadata(html, url);
});

/**
 * fetch-recipe-content
 * Fetches the page at the given URL and returns the plain-text content of
 * the main recipe/article element.
 */
ipcMain.handle('fetch-recipe-content', async (_event, url) => {
	if (!url || typeof url !== 'string') {
		throw new Error('A valid URL string is required.');
	}
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		throw new Error('Only http and https URLs are supported.');
	}
	const html = await fetchHTML(url);
	return extractRecipeContent(html);
});

// ─────────────────────────────────────────────────────────────────────────────

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

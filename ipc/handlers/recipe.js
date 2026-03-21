const cheerio = require('cheerio');
const { fetchHTML } = require('../utils/fetchHTML');

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
 * Tries <article>, then elements with "recipe" in class/id, then <main>, then <body>.
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

/**
 * Validate that a URL is a non-empty string using only http or https.
 * Throws if invalid.
 * @param {string} url
 */
function validateUrl(url) {
	if (!url || typeof url !== 'string') {
		throw new Error('A valid URL string is required.');
	}
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		throw new Error('Only http and https URLs are supported.');
	}
}

/**
 * Register recipe-related IPC handlers.
 * @param {Electron.IpcMain} ipcMain
 */
function register(ipcMain) {
	/**
	 * fetch-url-metadata
	 * Returns metadata (title, description, image, url, siteName, author, date)
	 * for the provided URL.
	 */
	ipcMain.handle('fetch-url-metadata', async (_event, url) => {
		validateUrl(url);
		const html = await fetchHTML(url);
		return extractMetadata(html, url);
	});

	/**
	 * fetch-recipe-content
	 * Fetches the page at the given URL and returns the plain-text content of
	 * the main recipe/article element.
	 */
	ipcMain.handle('fetch-recipe-content', async (_event, url) => {
		validateUrl(url);
		const html = await fetchHTML(url);
		return extractRecipeContent(html);
	});
}

module.exports = { register };

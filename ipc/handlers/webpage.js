const cheerio = require('cheerio');
const { fetchHTML } = require('../utils/fetchHTML');
const { validateUrl } = require('../utils/validateUrl');

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
 * Register generic web page IPC handlers.
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
}

module.exports = { register };

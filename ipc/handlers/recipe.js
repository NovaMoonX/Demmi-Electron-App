const cheerio = require('cheerio');
const { fetchHTML } = require('../utils/fetchHTML');
const { validateUrl } = require('../utils/validateUrl');

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
 * Register recipe-related IPC handlers.
 * @param {Electron.IpcMain} ipcMain
 */
function register(ipcMain) {
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

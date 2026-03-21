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

module.exports = { validateUrl };

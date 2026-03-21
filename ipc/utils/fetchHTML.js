const https = require('https');
const http = require('http');

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

module.exports = { fetchHTML };

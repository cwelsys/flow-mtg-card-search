import { existsSync, mkdirSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import fetch from 'node-fetch';
import open from '../node_modules/open/index.js';

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../');
const cachePath = path.resolve(__dirname, 'cache');
const { method, parameters, settings } = JSON.parse(process.argv[2]);

const searchDelay = settings.searchDelay ?? 69;
const maxResults = settings.maxResults ?? 10;
const cacheSize = settings.cacheSize ?? 100;

const preferredLanguage = 'en';

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleQuery() {
	const query = parameters[0];
	if (query.length < 2) {
		console.log(JSON.stringify({ result: [] }));
	} else if (query.startsWith(':cache')) {
		showDeleteCache();
	} else if (query.startsWith(':help') || query.startsWith(':?')) {
		showHelp();
	} else {
		await delay(searchDelay);
		await logCards(query);
	}
}

if (method === 'query') {
	handleQuery();
} else if (method === 'open') {
	open(parameters[0]);
} else if (method === 'deleteCache') {
	deleteCache();
}

async function getCards(query) {
	const apiUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(
		query
	)}&format=json&include_extras=false&include_multilingual=false&include_variations=false&order=name&dir=asc&page=1&lang=${preferredLanguage}`;

	try {
		const response = await fetch(apiUrl);
		const responseJson = await response.json();

		if (responseJson.object === 'error') {
			return [];
		}

		const cards = [];
		const cardData = responseJson.data.slice(0, maxResults);

		cardData.forEach(function (card) {
			const cardInfo = {
				name: card.name,
				mana_cost: card.mana_cost || '',
				type_line: card.type_line,
				oracle_text: card.oracle_text || '',
				power: card.power || '',
				toughness: card.toughness || '',
				cmc: card.cmc || 0,
				colors: card.colors || [],
				rarity: card.rarity,
				set_name: card.set_name,
				scryfall_uri: card.scryfall_uri,
				image_uri: card.image_uris
					? card.image_uris.normal
					: card.card_faces && card.card_faces[0].image_uris
					? card.card_faces[0].image_uris.normal
					: null,
				id: card.id,
				loyalty: card.loyalty || '',
				artist: card.artist || '',
			};
			cards.push(cardInfo);
		});

		return cards;
	} catch (error) {
		console.error('Error fetching cards:', error);
		return [];
	}
}

async function logCards(query) {
	const results = { result: [] };

	const cards = await getCards(query);

	for (const card of cards) {
		let imagePath = path.resolve(cachePath, `${card.id}.png`);
		if (!existsSync(imagePath) && card.image_uri) {
			imagePath = await cacheCardImg(card.image_uri, card.id);
		}
		results.result.push(getCardResult(card, imagePath));
	}

	console.log(JSON.stringify(results));
}

function getCardResult(card, imagePath) {
	const result = {
		Title: card.name,
		Subtitle: '',
		JsonRPCAction: {
			method: 'open',
			parameters: [card.scryfall_uri],
		},
		IcoPath: imagePath || path.resolve(__dirname, 'img', 'app.png'),
		score: 0,
	};

	let subtitle = '';

	if (card.mana_cost) {
		subtitle += `${card.mana_cost} `;
	}

	if (card.type_line) {
		subtitle += `${card.type_line}`;
	}

	if (card.power && card.toughness) {
		subtitle += ` | ${card.power}/${card.toughness}`;
	} else if (card.loyalty) {
		subtitle += ` | Loyalty: ${card.loyalty}`;
	}

	if (card.rarity) {
		subtitle += ` | ${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}`;
	}

	if (card.set_name) {
		subtitle += ` | ${card.set_name}`;
	}

	result.Subtitle = subtitle;

	// Add Preview property for QuickLook integration with positioning
	if (imagePath && existsSync(imagePath)) {
		result.Preview = {
			FilePath: imagePath,
			Description: `${card.name} - ${card.set_name}`,
			IsMedia: true,
		};
	}

	return result;
}

async function cacheCardImg(url, id) {
	try {
		if (!existsSync(cachePath)) {
			mkdirSync(cachePath, { recursive: true });
		}

		const cacheFiles = readdirSync(cachePath);
		if (cacheFiles.length >= cacheSize) {
			const files = cacheFiles
				.map((file) => ({
					name: file,
					path: path.resolve(cachePath, file),
					mtime: statSync(path.resolve(cachePath, file)).mtime,
				}))
				.sort((a, b) => a.mtime - b.mtime);

			const toRemove = files.slice(0, Math.max(0, files.length - cacheSize + 1));
			toRemove.forEach((file) => {
				try {
					unlinkSync(file.path);
				} catch (err) {
					console.error('Error removing cached file:', err);
				}
			});
		}

		const cardPath = path.resolve(cachePath, `${id}.png`);

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const buffer = await response.arrayBuffer();
		writeFileSync(cardPath, Buffer.from(buffer));

		return cardPath;
	} catch (err) {
		console.error('Error caching image:', err);
		return path.resolve(__dirname, 'img', 'app.png');
	}
}

function showDeleteCache() {
	if (!existsSync(cachePath)) {
		mkdirSync(cachePath, { recursive: true });
	}

	const cacheFiles = readdirSync(cachePath);

	console.log(
		JSON.stringify({
			result: [
				{
					Title: 'Delete Card Image Cache',
					Subtitle: `${cacheFiles.length} cached images at ${cachePath}`,
					JsonRPCAction: {
						method: 'deleteCache',
						parameters: [],
					},
					IcoPath: path.resolve(__dirname, 'img', 'trash.png'),
					score: 0,
				},
				{
					Title: 'Open Card Image Cache',
					Subtitle: cachePath,
					JsonRPCAction: {
						method: 'open',
						parameters: [cachePath],
					},
					IcoPath: path.resolve(__dirname, 'img', 'folder.png'),
					score: 10,
				},
			],
		})
	);
}

function deleteCache() {
	if (existsSync(cachePath)) {
		rmSync(cachePath, { force: true, recursive: true });
	}
}

function showHelp() {
	console.log(
		JSON.stringify({
			result: [
				{
					Title: 'Scryfall Search Documentation',
					Subtitle: "'Lightning Bolt', 'c:red cmc:1', 'type:creature power>=4'",
					JsonRPCAction: {
						method: 'open',
						parameters: ['https://scryfall.com/docs/syntax'],
					},
					IcoPath: path.resolve(__dirname, 'img', 'scryfall.png'),
					score: 1,
				},
				{
					Title: 'Manage Card Image Cache',
					Subtitle: "Try ':cache' to manage (delete) cached card images",
					JsonRPCAction: {
						method: 'query',
						parameters: [':cache'],
					},
					IcoPath: path.resolve(__dirname, 'img', 'trash.png'),
					score: 0,
				},
				{
					Title: 'QuickLook (requires QL FlowLauncher plugin)',
					Subtitle: 'F1 will preview card images in quicklook if it is installed',
					JsonRPCAction: {
						method: 'open',
						parameters: ['https://github.com/QL-Win/QuickLook'],
					},
					IcoPath: path.resolve(__dirname, 'img', 'ql.png'),
					score: 0,
				},
			],
		})
	);
}

const registry = new Map();

export function registerMode(name, config){
	registry.set(name, { name, ...config });
}

export function getModeByWord(word){
	for (const [, mode] of registry){
		if (mode.word && mode.word.toLowerCase() === String(word).toLowerCase()) return mode;
	}
	return null;
}

export function getMode(name){
	return registry.get(name) || null;
}



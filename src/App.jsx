import React from 'react';

const INITIAL_WORD = 'aside';
const MAX_LEN = 5;
const T9_MAP = {
	'1': [],
	'2': ['a','b','c'],
	'3': ['d','e','f'],
	'4': ['g','h','i'],
	'5': ['j','k','l'],
	'6': ['m','n','o'],
	'7': ['p','q','r','s'],
	'8': ['t','u','v'],
	'9': ['w','x','y','z'],
	'0': []
};

export default function App(){
	const year = new Date().getFullYear();
	const [slots, setSlots] = React.useState(() => INITIAL_WORD.slice(0, MAX_LEN).split(''));
	const [lastEditIndex, setLastEditIndex] = React.useState(-1);
	const [lastKeyInfo, setLastKeyInfo] = React.useState({ key: null, index: 0, time: 0 });
	const [touchStartX, setTouchStartX] = React.useState(null);
	const [isTouch, setIsTouch] = React.useState(false);

	const hasEmpty = slots.some(ch => !ch);

	React.useEffect(() => {
		setIsTouch(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
	}, []);

	React.useEffect(() => {
		const onKeyDown = (e) => {
			const key = e.key;
			if (key === 'Backspace'){
				e.preventDefault();
				setSlots(prev => {
					const next = [...prev];
					for (let i = next.length - 1; i >= 0; i--){
						if (next[i] && next[i].length){
							next[i] = '';
							setLastEditIndex(i);
							break;
						}
					}
					return next;
				});
				return;
			}
			if (key.length === 1 && /[a-zA-Z0-9]/.test(key)){
				e.preventDefault();
				const ch = key.toLowerCase();
				setSlots(prev => {
					const next = [...prev];
					for (let i = 0; i < MAX_LEN; i++){
						if (!next[i]){ next[i] = ch; setLastEditIndex(i); break; }
					}
					return next;
				});
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	// Touch swipe: left swipe clears last letter
	const onTouchStart = (e) => {
		if (!isTouch) return;
		setTouchStartX(e.touches[0].clientX);
	};
	const onTouchEnd = (e) => {
		if (!isTouch || touchStartX == null) return;
		const dx = e.changedTouches[0].clientX - touchStartX;
		setTouchStartX(null);
		if (dx < -40){
			// swipe left
			setSlots(prev => {
				const next = [...prev];
				for (let i = next.length - 1; i >= 0; i--){
					if (next[i] && next[i].length){ next[i] = ''; setLastEditIndex(i); break; }
				}
				return next;
			});
		}
	};

	const fillNextEmpty = (value) => {
		setSlots(prev => {
			const next = [...prev];
			for (let i = 0; i < MAX_LEN; i++){
				if (!next[i]){ next[i] = value; setLastEditIndex(i); break; }
			}
			return next;
		});
	};

	const replaceLastEdited = (value) => {
		if (lastEditIndex < 0) return;
		setSlots(prev => {
			const next = [...prev];
			next[lastEditIndex] = value;
			return next;
		});
	};

	// T9 input handling
	const handleT9Press = (digit, isLongPress = false) => {
		if (digit === '⌫'){
			setSlots(prev => {
				const next = [...prev];
				for (let i = next.length - 1; i >= 0; i--){
					if (next[i] && next[i].length){ next[i] = ''; setLastEditIndex(i); break; }
				}
				return next;
			});
			return;
		}
		const letters = T9_MAP[digit] || [];
		const now = Date.now();
		if (isLongPress || letters.length === 0){
			fillNextEmpty(digit);
			setLastKeyInfo({ key: null, index: 0, time: now });
			return;
		}
		if (lastKeyInfo.key === digit && now - lastKeyInfo.time < 800 && lastEditIndex >= 0){
			// cycle letters in the last edited slot
			const nextIndex = (lastKeyInfo.index + 1) % letters.length;
			replaceLastEdited(letters[nextIndex]);
			setLastKeyInfo({ key: digit, index: nextIndex, time: now });
		} else {
			fillNextEmpty(letters[0]);
			setLastKeyInfo({ key: digit, index: 0, time: now });
		}
	};

	// Long-press detection for keypad buttons
	const longPressHandlers = (digit) => {
		let timer = null;
		return {
			onTouchStart: () => { timer = setTimeout(() => handleT9Press(digit, true), 450); },
			onTouchEnd: () => { if (timer){ clearTimeout(timer); timer = null; } },
			onClick: () => handleT9Press(digit, false)
		};
	};

	return (
		<div className="wrap">
			<main className="hero" aria-label="aside.network landing" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
				<h1 className="logo" aria-label="interactive word" role="textbox" aria-live="polite">
					{Array.from({ length: MAX_LEN }).map((_, i) => {
						const ch = slots[i] || '';
						const isRedA = i === 0 && ch === 'a';
					return (
						<span
							key={i}
							className={`slot${ch ? ' filled' : ' empty'}${isRedA ? ' a' : ''}${ch && ('il1'.includes(ch) ? ' narrow' : '')}`}
						>
							{ch || '\u00A0'}
						</span>
					);
					})}
				</h1>
				{isTouch && hasEmpty && (
					<div className="keypad" role="group" aria-label="T9 keypad">
						<div className="row">
							<button className="key" {...longPressHandlers('1')}>1</button>
							<button className="key" {...longPressHandlers('2')}><span className="num">2</span><span className="letters">abc</span></button>
							<button className="key" {...longPressHandlers('3')}><span className="num">3</span><span className="letters">def</span></button>
						</div>
						<div className="row">
							<button className="key" {...longPressHandlers('4')}><span className="num">4</span><span className="letters">ghi</span></button>
							<button className="key" {...longPressHandlers('5')}><span className="num">5</span><span className="letters">jkl</span></button>
							<button className="key" {...longPressHandlers('6')}><span className="num">6</span><span className="letters">mno</span></button>
						</div>
						<div className="row">
							<button className="key" {...longPressHandlers('7')}><span className="num">7</span><span className="letters">pqrs</span></button>
							<button className="key" {...longPressHandlers('8')}><span className="num">8</span><span className="letters">tuv</span></button>
							<button className="key" {...longPressHandlers('9')}><span className="num">9</span><span className="letters">wxyz</span></button>
						</div>
						<div className="row">
							<button className="key" {...longPressHandlers('0')}>0</button>
							<button className="key back" onClick={() => handleT9Press('⌫')}>⌫</button>
						</div>
					</div>
				)}
			</main>

			<footer>
				<span>©{year} aside.network</span>
			</footer>
		</div>
	);
}


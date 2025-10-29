import React from 'react';
import { createCommands } from './commands.js';

export default function AdminConsole({ onExit }){
	const [log, setLog] = React.useState([]);
	const [input, setInput] = React.useState('');
	const [history, setHistory] = React.useState([]);
	const [histIdx, setHistIdx] = React.useState(-1);
	const [transient, setTransient] = React.useState('');
	const scrollRef = React.useRef(null);
	const inputRef = React.useRef(null);
	const isTouch = React.useMemo(() => (window.matchMedia && window.matchMedia('(pointer: coarse)').matches), []);

	const ctx = React.useMemo(() => ({
		appendOutput: (line) => setLog(prev => [...prev, line]),
		replaceTransient: (line) => setTransient(line),
		exitMode: () => onExit?.()
	}), [onExit]);

	const cmd = React.useMemo(() => createCommands(ctx), [ctx]);

	React.useEffect(() => {
		if (scrollRef.current){ scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }
	}, [log, transient]);

	React.useEffect(() => {
		if (inputRef.current){
			try{
				inputRef.current.focus();
				const len = inputRef.current.value?.length ?? 0;
				if (typeof inputRef.current.setSelectionRange === 'function'){
					inputRef.current.setSelectionRange(len, len);
				}
			}catch(e){}
		}
	}, []);

	const submit = async () => {
		const line = input.trim();
		if (!line) return;
		setLog(prev => [...prev, `admin: ${line}`]);
		setHistory(prev => [...prev, line]);
		setHistIdx(-1);
		setInput('');
		setTransient('');
		await cmd.run(line);
		if (inputRef.current){ inputRef.current.focus(); }
	};

	const onKeyDown = (e) => {
		if (e.key === 'Enter'){ e.preventDefault(); submit(); return; }
		if (e.key === 'c' && e.ctrlKey){ e.preventDefault(); cmd.cancel(); setTransient(''); return; }
		if (e.key === 'ArrowUp'){
			e.preventDefault();
			const nextIdx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
			if (history[nextIdx] != null){ setInput(history[nextIdx]); setHistIdx(nextIdx); }
			return;
		}
		if (e.key === 'ArrowDown'){
			e.preventDefault();
			const nextIdx = histIdx === -1 ? -1 : (histIdx + 1);
			if (nextIdx === -1 || nextIdx >= history.length){ setInput(''); setHistIdx(-1); }
			else { setInput(history[nextIdx]); setHistIdx(nextIdx); }
			return;
		}
	};

	const onInput = (e) => { setInput(e.target.value); };

	const touchStartX = React.useRef(null);
	const onTouchStart = (e) => { if (!isTouch) return; touchStartX.current = e.touches[0].clientX; };
	const onTouchEnd = (e) => {
		if (!isTouch || touchStartX.current == null) return;
		const dx = e.changedTouches[0].clientX - touchStartX.current; touchStartX.current = null;
		if (dx < -40){ cmd.cancel(); setTransient(''); }
	};

	return (
		<div className="console" role="textbox" aria-label="admin console" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
			<div className="console-log" ref={scrollRef}>
				{log.map((line, i) => (
					<div className="line" key={i}>{line}</div>
				))}
				{transient && (
					<div className="line transient">{transient}</div>
				)}
			</div>
			<div className="console-input admin-layout">
				<span className="logo logo-console" aria-hidden="true"><span className="a">a</span>dmin: </span>
				<input
					ref={inputRef}
					className="admin-input"
					value={input}
					onChange={onInput}
					onKeyDown={onKeyDown}
					spellCheck={false}
					autoCapitalize="off"
					autoCorrect="off"
					style={{ minWidth: '1ch' }}
				/>
				<button 
					className="admin-delete-btn" 
					onClick={() => {
						setInput(prev => prev.slice(0, -1));
						if (inputRef.current) inputRef.current.focus();
					}}
					aria-label="Delete last character"
				>
					⌫
				</button>
			</div>
		</div>
	);
}



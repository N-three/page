export function createCommands(ctx){
	let countdownTimer = null;
	let countdownCancel = null;

	const write = (line) => ctx.appendOutput(line);

	const commands = {
		help(){
			write('Commands:');
			write('  help               Show this help');
			write('  print <text>       Echo text');
			write('  countdown          Count down to New Year (Ctrl+C/swipe to cancel)');
			write('  close              Exit admin mode');
		},
		print(args){
			write(args.join(' '));
		},
		countdown(){
			if (countdownTimer) return;
			const now = new Date();
			const targetYear = now.getMonth() === 0 && now.getDate() === 1 ? now.getFullYear() : now.getFullYear() + 1;
			const target = new Date(targetYear, 0, 1, 0, 0, 0, 0);
			write(`Counting down to ${target.toISOString()}`);
			countdownCancel = () => { clearInterval(countdownTimer); countdownTimer = null; write('^C'); };
			countdownTimer = setInterval(() => {
				const diff = target.getTime() - Date.now();
				if (diff <= 0){
					clearInterval(countdownTimer); countdownTimer = null; write('Happy New Year!');
					return;
				}
				const sec = Math.floor(diff / 1000);
				const days = Math.floor(sec / 86400);
				const hours = Math.floor((sec % 86400) / 3600);
				const minutes = Math.floor((sec % 3600) / 60);
				const seconds = sec % 60;
				ctx.replaceTransient(`${days}d ${hours}h ${minutes}m ${seconds}s`);
			}, 1000);
		},
		close(){
			if (countdownTimer){ clearInterval(countdownTimer); countdownTimer = null; }
			ctx.exitMode();
		}
	};

	const api = {
		async run(line){
			const [cmd, ...args] = line.trim().split(/\s+/);
			if (!cmd) return;
			if (!commands[cmd]){ write(`Unknown command: ${cmd}`); return; }
			await commands[cmd](args);
		},
		cancel(){ if (countdownTimer){ countdownCancel?.(); } },
	};

	return api;
}



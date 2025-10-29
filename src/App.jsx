import React from 'react';

export default function App(){
	const year = new Date().getFullYear();
	return (
		<div className="wrap">
			<main className="hero" aria-label="aside.network landing">
				<h1 className="logo" aria-label="aside network">
					<span className="a">a</span>side
				</h1>
			</main>

			<footer>
				<span>©{year} aside.network</span>
			</footer>
		</div>
	);
}


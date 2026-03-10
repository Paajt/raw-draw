'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/src/components/App'), {
	ssr: false,
	loading: () => (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '60vh',
				color: 'var(--text-muted)',
				fontSize: '14px',
			}}
		>
			Loading...
		</div>
	),
});

export default function Home() {
	return (
		<main
			style={{
				padding: '16px',
				maxWidth: '1000px',
				margin: '0 auto',
			}}
		>
			<header
				style={{
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					marginBottom: '16px',
					paddingBottom: '12px',
					borderBottom: '1px solid var(--border)',
				}}
			>
				<div>
					<h1
						style={{
							fontSize: 'clamp(18px, 4vw, 22px)',
							fontWeight: 700,
							letterSpacing: '-0.02em',
						}}
					>
						Raw Draw
					</h1>
					<p
						style={{
							fontSize: '12px',
							color: 'var(--text-muted)',
							marginTop: '2px',
						}}
					>
						Collaborative drawing in real-time
					</p>
				</div>
			</header>
			<App />
		</main>
	);
}

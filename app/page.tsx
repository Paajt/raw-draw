'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/src/components/App'), {
	ssr: false,
	loading: () => <p>Loading canvas...</p>,
});

export default function Home() {
	return (
		<main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
			<h1 style={{ marginBottom: '16px' }}>Raw Draw</h1>
			<App />
		</main>
	);
}

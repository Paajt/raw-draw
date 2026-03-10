'use client';

import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('@/src/components/Canvas'), {
	ssr: false,
	loading: () => <p>Loading canvas...</p>,
});

export default function Home() {
	return (
		<main style={{ padding: '20px' }}>
			<h1 style={{ marginBottom: '16px' }}>Raw Draw</h1>
			<Canvas />
		</main>
	);
}

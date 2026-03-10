// En enskild punkt på canvasen
export interface Point {
	x: number;
	y: number;
}

// Meddelande som skickas via WebSocket
export type WSMessage =
	| {
			type: 'draw';
			points: Point[];
			color: string;
			userId: string;
	  }
	| {
			type: 'clear-canvas';
	  }
	| {
			type: 'user-joined';
			userId: string;
			color: string;
			userCount: number;
	  }
	| {
			type: 'user-left';
			userId: string;
			userCount: number;
	  }
	| {
			type: 'alarm';
			message: string;
			severity: 'info' | 'warning' | 'error';
	  };

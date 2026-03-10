# Raw Draw

Collaborative real-time drawing app where multiple users can sketch together on a shared canvas and save it as a .PNG-file. Built to demonstrate real-time push communication from server to client without page refresh.

## Tech Stack

-   **Next.js 16** — Frontend framework with App Router
-   **TypeScript** — Type-safe communication between frontend and backend
-   **WebSocket (ws)** — Two-way real-time communication for drawing, alarms, user tracking and canvas clear
-   **Server-Sent Events (SSE)** — One-way server-to-client stream for the event log
-   **HTML5 Canvas** — Drawing surface with freehand mouse and touch support

## WebSocket vs SSE

This app uses both technologies to demonstrate the difference:

-   **WebSocket** is used for drawing data, alarms, and user events. Clients both send and receive data.
-   **SSE** is used for the event log. The client only needs to listen, not send anything back.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in multiple browser tabs to test real-time sync.

## Test backend push

Send an alarm with different severities (info, warning, error) to all connected clients:

```bash
curl -X POST http://localhost:3000/api/alarm -H "Content-Type: application/json" -d '{"message": "Hello from backend!", "severity": "info"}'
```

Clear the canvas with a 5 second countdown:

```bash
curl -X POST http://localhost:3000/api/clear
```

# OnlineSnakeServer

Backend Server Code für das OnlineSnake-Spiel.

Ausschnitt aus README.md von OnlineSnake:

## Zwischenstand 3 | 26.06.2025 | Fertig
### Mindestanforderungen Backend
- Backend-Repository eingerichtet
- Mindestens 1 Demo-Endpunkt implementiert
- Lokale Ausführung reicht aus
### Sonstiges
- 10 Minuten Präsentation pro Gruppe (Zwischenstand, Funktionsdemo)

## Zwischenstand 4 (Ende) | 10.07.2025 | Zu tun
### Anforderungen Backend
- Deployment auf einem Server / Serverless
- Web-Security Best-Practices befolgt
- Verbindung Frontend - Backend
### Sonstiges
- Abgabe Quellcode + Dokumentation
- 15 Minuten Präsentation pro Gruppe (Produktvorstellung)

# Elysia with Bun runtime

* To start the development server, run:
```bash
bun run dev
```

* To start the server normally, run:
```bash
bun run src/index.ts
```

* Open http://localhost:3000/ with your browser to see the result.

* If the Neon Database doesn't contain a table, run in root directory:
```bash
npx drizzle-kit push
```
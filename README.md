# AVA - ChatGPT App für Versicherungssuche

Eine ChatGPT App, die Versicherungsprodukte sucht und in einem interaktiven Widget anzeigt.

## 🎯 Features

- **Smart Search**: Durchsucht 5 Mock-Versicherungsprodukte (Haftpflicht, Hausrat, BU, Rechtsschutz, Zahnzusatz)
- **Instant Widget**: Zeigt Suchergebnisse sofort in einem visuellen Widget an
- **Intelligente Query-Verarbeitung**: Erkennt Varianten wie "Haftpflichtversicherung", "alle Produkte", "BU"
- **MCP-Standard**: Nutzt Model Context Protocol für ChatGPT Integration

## 🏗️ Architektur

### Tech Stack
- **Next.js 15** mit App Router
- **MCP Server** (Model Context Protocol) über JSON-RPC
- **Widget**: Vanilla HTML/CSS/JS mit MCP Apps Bridge
- **TypeScript** für Type Safety

### MCP Tool: `search_and_show_products`

Ein kombiniertes Tool, das:
1. Versicherungsdatenbank durchsucht
2. Ergebnisse sofort im Widget anzeigt
3. Keine Zwischenschritte - optimale UX

**Warum ein kombiniertes Tool?**
- ✅ ChatGPT macht nur einen Tool-Call
- ✅ Keine Zwischenfragen an den User
- ✅ Widget wird sofort mit Daten geladen
- ✅ Bessere User Experience

---

## 🚀 Quick Start

### 1. Development Server

```bash
npm install
npm run dev
```

Server läuft auf `http://localhost:3000`

### 2. Lokales Testing mit MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest http://localhost:3000/mcp
```

Der Inspector öffnet sich im Browser. Dort kannst du:
- ✅ Tools anzeigen
- ✅ Tool-Calls manuell testen
- ✅ JSON-Responses debuggen
- ℹ️ Widget-HTML ansehen (wird nicht gerendert im Inspector)

**Wichtig**: Das Widget wird nur in ChatGPT als iframe gerendert, nicht im Inspector!

### 3. ChatGPT Integration (Developer Mode)

#### Tunnel einrichten

```bash
ngrok http 3000
```

Kopiere die ngrok URL (z.B. `https://abc123.ngrok.app`)

#### ChatGPT Setup

1. Öffne [ChatGPT](https://chatgpt.com)
2. Gehe zu **Settings → Apps & Connectors → Advanced settings**
3. Aktiviere **Developer Mode**
4. Gehe zu **Settings → Connectors**
5. Klicke **Create**
6. Trage ein:
   - **URL**: `https://abc123.ngrok.app/mcp`
   - **Name**: `AVA - Versicherungssuche`
   - **Beschreibung**: `Findet und zeigt Versicherungsprodukte`
7. Klicke **Create**

#### Im Chat testen

1. Neuer Chat
2. Klicke **+** Button
3. Wähle **AVA** aus
4. Teste mit:

```
"Suche nach Haftpflichtversicherungen"
"Zeige mir alle verfügbaren Versicherungen"
"Ich brauche eine Berufsunfähigkeitsversicherung"
```

Das Widget erscheint automatisch mit den Produkten! 🎉

#### Nach Code-Änderungen

1. **Settings → Connectors**
2. Wähle deinen Connector
3. Klicke **Refresh** (⟳)

---

## 📦 Mock-Datenbank

5 Versicherungsprodukte sind aktuell gemockt:

| ID      | Name                          | Typ          | Anbieter          | Preis/Monat |
|---------|-------------------------------|--------------|-------------------|-------------|
| ins-001 | Privat-Haftpflicht Optimal    | Haftpflicht  | ERGO              | 5,90€       |
| ins-002 | Hausrat Premium Plus          | Hausrat      | Allianz           | 12,50€      |
| ins-003 | Berufsunfähigkeit Komfort     | BU           | Alte Leipziger    | 45,00€      |
| ins-004 | Rechtsschutz Mobil & Privat   | Rechtsschutz | ARAG              | 18,90€      |
| ins-005 | Zahnzusatz Premium            | Zahnzusatz   | DKV               | 32,00€      |

---

## 🎨 Widget Customization

Widget-Datei: [`public/insurance-widget.html`](public/insurance-widget.html)

Anpassbar:
- **Styles**: `<style>`-Block
- **Layout**: Product Card Struktur
- **Texte**: Labels und Beschreibungen
- **Animationen**: CSS Transitions

### MCP Apps Bridge

Das Widget nutzt JSON-RPC over `postMessage`:

```javascript
// Bridge initialisieren
await rpcRequest("ui/initialize", { appInfo, appCapabilities, protocolVersion })

// Benachrichtigung senden
rpcNotify("ui/notifications/initialized", {})

// Tool aufrufen (vom Widget aus)
await rpcRequest("tools/call", { name, arguments })

// Tool-Results empfangen
window.addEventListener("message", (event) => {
  if (event.data.method === "ui/notifications/tool-result") {
    updateFromResponse(event.data.params)
  }
})
```

---

## 🔧 Troubleshooting

### Widget zeigt "Keine Produkte"

**Ursache**: Query wird nicht erkannt

**Lösung**: Die Suche normalisiert automatisch:
- `"Haftpflichtversicherung"` → `"Haftpflicht"`
- `"alle"` / `"alles"` → zeigt alle Produkte
- `"BU"` / `"Berufsunfähigkeit"` → wird gemappt

Prüfe Server-Logs für die gesendete Query.

### Widget zeigt Loading-Spinner endlos

**Ursache**: `structuredContent` fehlt oder falsch platziert

**Lösung**: Stelle sicher, dass `structuredContent` top-level im Tool-Result ist:

```typescript
{
  content: [...],
  structuredContent: { products: [...] },  // ← Hier, nicht unter _meta
  _meta: { ... }
}
```

### ChatGPT findet Connector nicht

- Prüfe, ob ngrok läuft
- Teste URL manuell: `https://abc123.ngrok.app/mcp`
- Erwartet: JSON mit `protocolVersion`, `serverInfo`, `capabilities`

### MCP Inspector Connection Error

- Server läuft? `npm run dev`
- Port 3000 frei?
- Browser Console prüfen

---

## 📂 Projektstruktur

```
chatgpt.snoopr.de/
├── app/
│   ├── mcp/
│   │   └── route.ts          # MCP Server (JSON-RPC Handler)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   └── insurance-widget.html # Widget Component
├── package.json
└── README.md
```

### Key Files

- **`app/mcp/route.ts`**: MCP Server Implementation
  - `handleMCPRequest()` - JSON-RPC Router
  - `searchInsuranceProducts()` - Smart Search mit Normalisierung
  - `getInsuranceWidget()` - Widget Resource Loader
  - `POST`, `GET`, `OPTIONS` Handler

- **`public/insurance-widget.html`**: Widget UI
  - MCP Apps Bridge Integration
  - Product Card Rendering
  - Loading States

---

## 📚 Resources

- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)

---

## 🚀 Deployment (Vercel)

```bash
git add .
git commit -m "Update AVA app"
git push
```

Vercel deployed automatisch.

**Nach Deployment**:
1. Kopiere die Vercel URL
2. In ChatGPT: Connector **Refresh** oder neu anlegen mit Production URL
3. Testen!

---

## ✅ Roadmap

- [x] MCP Server mit Tool
- [x] Widget mit MCP Apps Bridge
- [x] Mock-Datenbank
- [x] Smart Query Normalisierung
- [ ] Echte API-Integration
- [ ] Filter (Preis, Rating, Anbieter)
- [ ] Vergleichsfunktion
- [ ] OAuth Authentication
- [ ] Production Deployment
- [ ] App Store Submission

---

## 🤝 Contributing

Feedback und Verbesserungsvorschläge willkommen!

---

**Built with ❤️ for ChatGPT Apps**

Without this, Next.js will attempt to load assets from the iframe's URL, causing 404 errors.

### 3. CORS Middleware (`middleware.ts`)

Handles browser OPTIONS preflight requests required for cross-origin RSC (React Server Components) fetching during client-side navigation:

```typescript
export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    // Return 204 with CORS headers
  }
  // Add CORS headers to all responses
}
```

### 4. SDK Bootstrap (`app/layout.tsx`)

The `<NextChatSDKBootstrap>` component patches browser APIs to work correctly within the ChatGPT iframe:

**What it patches:**
- `history.pushState` / `history.replaceState` - Prevents full-origin URLs in history
- `window.fetch` - Rewrites same-origin requests to use the correct base URL
- `<html>` attribute observer - Prevents ChatGPT from modifying the root element

**Required configuration:**
```tsx
<html lang="en" suppressHydrationWarning>
  <head>
    <NextChatSDKBootstrap baseUrl={baseURL} />
  </head>
  <body>{children}</body>
</html>
```

**Note:** `suppressHydrationWarning` is currently required because ChatGPT modifies the initial HTML before the Next.js app hydrates, causing hydration mismatches.

## Getting Started

### Installation

```bash
npm install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Testing the MCP Server

The MCP server is available at:
```
http://localhost:3000/mcp
```

### Connecting from ChatGPT

1. [Deploy your app to Vercel](https://vercel.com/new/clone?demo-description=Ship%20an%20ChatGPT%20app%20on%20Vercel%20with%20Next.js%20and%20Model%20Context%20Protocol%20%28MCP%29.%0A&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F5TdbPy0tev8hh3rTOsdfMm%2F155b970ca5e75adb74206db26493efc7%2Fimage.png&demo-title=ChatGPT%20app%20with%20Next.js&demo-url=https%3A%2F%2Fchatgpt-apps-sdk-nextjs-starter.labs.vercel.dev%2F&from=templates&project-name=ChatGPT%20app%20with%20Next.js&project-names=Comma%20separated%20list%20of%20project%20names%2Cto%20match%20the%20root-directories&repository-name=chatgpt-app-with-next-js&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fchatgpt-apps-sdk-nextjs-starter&root-directories=List%20of%20directory%20paths%20for%20the%20directories%20to%20clone%20into%20projects&skippable-integrations=1&teamSlug=vercel)
3. In ChatGPT, navigate to **Settings → [Connectors](https://chatgpt.com/#settings/Connectors) → Create** and add your MCP server URL with the `/mcp` path (e.g., `https://your-app.vercel.app/mcp`)

**Note:** Connecting MCP servers to ChatGPT requires developer mode access. See the [connection guide](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt) for setup instructions.


## Project Structure

```
app/
├── mcp/
│   └── route.ts          # MCP server with tool/resource registration
├── layout.tsx            # Root layout with SDK bootstrap
├── page.tsx              # Homepage content
└── globals.css           # Global styles
middleware.ts             # CORS handling for RSC
next.config.ts            # Asset prefix configuration
```

## How It Works

1. **Tool Invocation**: ChatGPT calls a tool registered in `app/mcp/route.ts`
2. **Resource Reference**: Tool response includes `templateUri` pointing to a registered resource
3. **Widget Rendering**: ChatGPT fetches the resource HTML and renders it in an iframe
4. **Client Hydration**: Next.js hydrates the app inside the iframe with patched APIs
5. **Navigation**: Client-side navigation uses patched `fetch` to load RSC payloads

## Learn More

- [OpenAI Apps SDK Documentation](https://developers.openai.com/apps-sdk)
- [OpenAI Apps SDK - MCP Server Guide](https://developers.openai.com/apps-sdk/build/mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Next.js Documentation](https://nextjs.org/docs)

## Deployment

This project is designed to work seamlessly with [Vercel](https://vercel.com) deployment. The `baseUrl.ts` configuration automatically detects Vercel environment variables and sets the correct asset URLs.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel-labs/chatgpt-apps-sdk-nextjs-starter)

The configuration automatically handles:
- Production URLs via `VERCEL_PROJECT_PRODUCTION_URL`
- Preview/branch URLs via `VERCEL_BRANCH_URL`
- Asset prefixing for correct resource loading in iframes

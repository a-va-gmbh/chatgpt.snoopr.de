# AVA - ChatGPT App für Versicherungssuche

## 🎯 Übersicht

AVA ist eine ChatGPT App, die Versicherungsprodukte suchen und in einem interaktiven Widget anzeigen kann.

### Features
- **search_products**: Durchsucht 5 Mock-Versicherungsprodukte (Haftpflicht, Hausrat, BU, Rechtsschutz, Zahnzusatz)
- **render_products_widget**: Zeigt die Produkte in einem schönen Widget an
- **Decoupled Pattern**: Trennung von Datensuche und UI-Rendering (Best Practice!)

---

## 🚀 Lokales Testing

### 1. Development Server starten

```bash
npm run dev
```

Der Server läuft auf `http://localhost:3000`

### 2. MCP Inspector starten

In einem neuen Terminal:

```bash
npx @modelcontextprotocol/inspector@latest --server-url http://localhost:3000/mcp --transport http
```

Dies öffnet eine Browser-Oberfläche, wo du:
- ✅ Alle verfügbaren Tools siehst
- ✅ Tools manuell aufrufen kannst
- ✅ Die strukturierten Responses siehst
- ✅ Das Widget testen kannst

### 3. Beispiel-Tests im Inspector

#### Test 1: Produktsuche
```json
Tool: search_products
Arguments:
{
  "query": "Haftpflicht"
}
```

Erwartete Antwort:
```json
{
  "resultCount": 1,
  "productIds": ["ins-001"],
  "products": [...]
}
```

#### Test 2: Widget rendern
```json
Tool: render_products_widget
Arguments:
{
  "productIds": ["ins-001", "ins-002", "ins-003"]
}
```

Das Widget sollte die 3 Produkte anzeigen!

---

## 🌐 Testing mit ChatGPT Developer Mode

### 1. Öffentlichen Tunnel einrichten

Da ChatGPT deine lokale App erreichen muss, brauchst du einen Tunnel:

```bash
ngrok http 3000
```

Du bekommst eine URL wie: `https://abc123.ngrok.app`

### 2. Developer Mode aktivieren

1. Öffne ChatGPT: https://chatgpt.com
2. Gehe zu **Settings → Apps & Connectors → Advanced settings**
3. Aktiviere **Developer Mode**

### 3. Connector hinzufügen

1. Gehe zu **Settings → Connectors**
2. Klicke auf **Create**
3. Füge deine ngrok URL + `/mcp` hinzu:
   ```
   https://abc123.ngrok.app/mcp
   ```
4. Name: `AVA - Versicherungssuche`
5. Beschreibung: `Findet und zeigt Versicherungsprodukte an`
6. Klicke auf **Create**

### 4. Connector refreshen (nach Code-Änderungen)

Nach jedem Update der Tools:
1. Gehe zu **Settings → Connectors**
2. Wähle deinen Connector
3. Klicke auf **Refresh** (⟳)

### 5. Im Chat testen

1. Starte einen neuen Chat
2. Klicke auf **+** Button
3. Wähle deinen **AVA** Connector aus dem **More** Menü
4. Teste mit Prompts wie:

**Prompt Beispiele:**

```
"Suche nach Haftpflichtversicherungen"
```

```
"Zeige mir alle verfügbaren Versicherungen"
```

```
"Ich brauche eine Berufsunfähigkeitsversicherung"
```

```
"Vergleiche Hausrat und Haftpflichtversicherungen"
```

---

## 🏗️ Architektur

### Decoupled Pattern (Best Practice!)

Wir verwenden das **empfohlene Muster** aus der OpenAI Dokumentation:

1. **Data Tool** (`search_products`):
   - Sucht Produkte
   - Gibt nur IDs + Metadaten zurück
   - **KEIN** Widget angehängt
   - Erlaubt ChatGPT, die Daten intelligent zu verarbeiten

2. **Render Tool** (`render_products_widget`):
   - Nimmt Produkt-IDs
   - Rendert das Widget
   - **HAT** Widget angehängt via `_meta["openai/outputTemplate"]`

### Warum ist das besser?

- ChatGPT kann mehrere Suchen kombinieren
- Das Modell entscheidet, WANN das Widget gezeigt wird
- Weniger unnötige UI-Reloads
- Bessere User Experience

---

## 📦 Mock-Datenbank

Aktuell sind 5 Versicherungsprodukte gemockt:

| ID | Name | Typ | Anbieter | Preis/Monat |
|----|------|-----|----------|-------------|
| ins-001 | Privat-Haftpflicht Optimal | Haftpflicht | ERGO | 5,90€ |
| ins-002 | Hausrat Premium Plus | Hausrat | Allianz | 12,50€ |
| ins-003 | Berufsunfähigkeit Komfort | BU | Alte Leipziger | 45,00€ |
| ins-004 | Rechtsschutz Mobil & Privat | Rechtsschutz | ARAG | 18,90€ |
| ins-005 | Zahnzusatz Premium | Zahnzusatz | DKV | 32,00€ |

---

## 🔧 Troubleshooting

### MCP Inspector zeigt keine Tools

- Prüfe, ob der Server läuft: `http://localhost:3000/mcp`
- Prüfe die Console auf Fehler
- Restart den Dev-Server

### Widget wird nicht angezeigt

- Prüfe, ob `public/insurance-widget.html` existiert
- Prüfe die Browser Console im Inspector
- Stelle sicher, dass `_meta["openai/outputTemplate"]` gesetzt ist

### ChatGPT findet den Connector nicht

- Prüfe, ob ngrok läuft
- Teste die URL manuell: `https://abc123.ngrok.app/mcp`
- Klicke auf **Refresh** im Connector-Settings

### CORS-Fehler

- Der `mcp-handler` sollte CORS automatisch handhaben
- Falls nicht, prüfe die Network-Logs

---

## 🎨 Widget anpassen

Das Widget ist in [public/insurance-widget.html](public/insurance-widget.html).

Du kannst anpassen:
- ✏️ Styles in `<style>`-Block
- 🎨 Product Card Layout
- 💬 Texte und Labels
- 🔄 Animationen

Das Widget verwendet **MCP Apps Bridge** (JSON-RPC over postMessage) für:
- `ui/initialize` - Bridge initialisieren
- `ui/notifications/initialized` - Bereit-Signal
- `tools/call` - Tools vom Widget aus aufrufen
- `ui/notifications/tool-result` - Updates empfangen

---

## 📚 Weitere Infos

- [OpenAI Apps SDK Docs](https://developers.openai.com/apps-sdk/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)

---

## ✅ Nächste Schritte

1. ✅ Teste mit MCP Inspector
2. ✅ Teste mit ChatGPT Developer Mode
3. 🚀 Erweitere die Mock-Datenbank
4. 🔗 Verbinde mit echter API
5. 🎯 Füge mehr Filter hinzu (Preis, Rating, etc.)
6. 🔐 Implementiere OAuth falls nötig
7. 📝 Bereite App Submission vor

Viel Erfolg mit AVA! 🎉

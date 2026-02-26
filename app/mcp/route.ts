import { baseURL } from "@/baseUrl";
import { z } from "zod";
import { readFile } from "fs/promises";
import { join } from "path";

let requestCounter = 0;

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

// Mock Versicherungsprodukte-Datenbank
type InsuranceProduct = {
  id: string;
  name: string;
  type: string;
  provider: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  rating: number;
};

const mockInsuranceProducts: InsuranceProduct[] = [
  {
    id: "ins-001",
    name: "Privat-Haftpflicht Optimal",
    type: "Haftpflicht",
    provider: "ERGO Versicherung",
    description: "Umfassender Schutz bei Personen-, Sach- und Vermögensschäden im privaten Bereich mit weltweiter Deckung.",
    features: ["Deckungssumme 50 Mio €", "Schlüsselverlust", "Deliktunfähige Kinder", "Gefälligkeitsschäden"],
    monthlyPrice: 5.90,
    rating: 4.8
  },
  {
    id: "ins-002",
    name: "Hausrat Premium Plus",
    type: "Hausrat",
    provider: "Allianz Deutschland",
    description: "Vollständiger Schutz Ihres Eigentums gegen Einbruch, Feuer, Leitungswasser und Naturgefahren.",
    features: ["Unterversicherungsverzicht", "Fahrraddiebstahl 3.000€", "Elementarschäden", "Glasbruch"],
    monthlyPrice: 12.50,
    rating: 4.6
  },
  {
    id: "ins-003",
    name: "Berufsunfähigkeit Komfort",
    type: "BU",
    provider: "Alte Leipziger",
    description: "Finanzielle Absicherung bei Berufsunfähigkeit mit verzicht auf abstrakte Verweisung.",
    features: ["Nachversicherungsgarantie", "Weltweiter Schutz", "Verzicht abstrakte Verweisung", "6 Monate rückwirkend"],
    monthlyPrice: 45.00,
    rating: 4.9
  },
  {
    id: "ins-004",
    name: "Rechtsschutz Mobil & Privat",
    type: "Rechtsschutz",
    provider: "ARAG",
    description: "Umfassender Rechtsschutz für Verkehr, Privat, Beruf und Wohnen ohne Wartezeiten.",
    features: ["Ohne Wartezeit", "Strafrechtsschutz", "Mediation", "Online-Rechtsberatung"],
    monthlyPrice: 18.90,
    rating: 4.5
  },
  {
    id: "ins-005",
    name: "Zahnzusatz Premium",
    type: "Zahnzusatz",
    provider: "DKV",
    description: "Erstattung bis zu 100% für Zahnersatz, Implantate und professionelle Zahnreinigung.",
    features: ["Implantate 100%", "Zahnersatz 90%", "2x PZR/Jahr", "Ohne Wartezeit"],
    monthlyPrice: 32.00,
    rating: 4.7
  }
];

function searchInsuranceProducts(query: string, productType?: string): InsuranceProduct[] {
  const lowerQuery = query.toLowerCase();
  
  return mockInsuranceProducts.filter(product => {
    const matchesQuery = 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.type.toLowerCase().includes(lowerQuery) ||
      product.features.some(f => f.toLowerCase().includes(lowerQuery));
    
    const matchesType = !productType || product.type.toLowerCase() === productType.toLowerCase();
    
    return matchesQuery && matchesType;
  });
}

// Simple JSON-RPC MCP Server
let insuranceWidgetHtml: string | null = null;

async function getInsuranceWidget() {
  if (!insuranceWidgetHtml) {
    insuranceWidgetHtml = await readFile(
      join(process.cwd(), "public", "insurance-widget.html"),
      "utf-8"
    );
  }
  
  const widget: ContentWidget = {
    id: "render_products_widget",
    title: "AVA Versicherungssuche",
    templateUri: "ui://widget/insurance-products.html",
    invoking: "Suche nach Versicherungen...",
    invoked: "Versicherungen gefunden",
    html: insuranceWidgetHtml,
    description: "Zeigt Versicherungsprodukte in einem interaktiven Widget an",
    widgetDomain: "https://ava.snoopr.de",
  };
  
  return widget;
}

async function handleMCPRequest(method: string, params: any, id: any) {
  console.log(`[MCP] Handling method: ${method}`);
  
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        serverInfo: {
          name: "ava-insurance",
          version: "1.0.0",
        },
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    };
  }

  if (method === "tools/list") {
    const widget = await getInsuranceWidget();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "search_and_show_products",
            description:
              "Durchsucht die Versicherungsdatenbank und zeigt die Ergebnisse sofort im Widget an. Dies ist das Haupt-Tool für Produktsuchen.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "Suchbegriff für die Versicherungssuche (z.B. 'Haftpflicht', 'Zahnersatz', 'Berufsunfähigkeit', oder 'alle' für alle Produkte)",
                },
                productType: {
                  type: "string",
                  description:
                    "Optionaler Filter nach Versicherungstyp (z.B. 'Haftpflicht', 'Hausrat', 'BU', 'Rechtsschutz', 'Zahnzusatz')",
                },
              },
              required: ["query"],
            },
            _meta: widgetMeta(widget),
          },
        ],
      },
    };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    const widget = await getInsuranceWidget();

    if (name === "search_and_show_products") {
      const { query, productType } = args;
      const results = searchInsuranceProducts(query, productType);

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Gefunden: ${results.length} Versicherungsprodukt${results.length !== 1 ? 'e' : ''} für "${query}"${
                productType ? ` (Typ: ${productType})` : ""
              }`,
            },
          ],
          structuredContent: {
            query,
            productType,
            resultCount: results.length,
            products: results,
          },
          _meta: {
            ...widgetMeta(widget),
          },
        },
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  if (method === "resources/list") {
    const widget = await getInsuranceWidget();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        resources: [
          {
            uri: widget.templateUri,
            name: widget.title,
            description: widget.description,
            mimeType: "text/html;profile=mcp-app",
            _meta: {
              "openai/widgetDescription": widget.description,
              "openai/widgetPrefersBorder": true,
            },
          },
        ],
      },
    };
  }

  if (method === "resources/read") {
    const { uri } = params;
    const widget = await getInsuranceWidget();
    
    if (uri === widget.templateUri) {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: "text/html;profile=mcp-app",
              text: widget.html,
              _meta: {
                "openai/widgetDescription": widget.description,
                "openai/widgetPrefersBorder": true,
                "openai/widgetDomain": widget.widgetDomain,
              },
            },
          ],
        },
      };
    }
    
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32602,
        message: `Resource not found: ${uri}`,
      },
    };
  }

  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`,
    },
  };
}

export const OPTIONS = async (req: Request) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const GET = async (req: Request) => {
  requestCounter++;
  const id = requestCounter;
  try {
    console.log(`\n[MCP-${id}] GET request`);
    
    // Return server info for GET requests
    const response = await handleMCPRequest("initialize", {}, null);
    
    return new Response(JSON.stringify(response.result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error(`[MCP-${id}] GET ERROR:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error) console.error(`[MCP-${id}] Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : String(error),
        },
        id: null,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

export const POST = async (req: Request) => {
  requestCounter++;
  const id = requestCounter;
  try {
    console.log(`\n[MCP-${id}] POST request`);
    
    const body = await req.json();
    console.log(`[MCP-${id}] Request:`, JSON.stringify(body, null, 2));
    
    const { method, params, id: reqId } = body;
    const response = await handleMCPRequest(method, params || {}, reqId);
    
    console.log(`[MCP-${id}] Response:`, JSON.stringify(response, null, 2));
    
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error(`[MCP-${id}] POST ERROR:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error) console.error(`[MCP-${id}] Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : String(error),
        },
        id: null,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

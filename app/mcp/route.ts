import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

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

const handler = createMcpHandler(async (server) => {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://nextjs.org/docs",
  };
  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z.string().describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );
});

export const GET = async (req: Request) => {
  requestCounter++;
  const id = requestCounter;
  try {
    console.log(`\n[MCP-${id}] GET request`);
    console.log(`[MCP-${id}] Method: GET`);
    console.log(`[MCP-${id}] URL: ${req.url}`);
    console.log(`[MCP-${id}] Headers:`, JSON.stringify(Object.fromEntries(req.headers), null, 2));
    
    const response = handler(req);
    console.log(`[MCP-${id}] GET returning`);
    return response;
  } catch (error) {
    console.error(`[MCP-${id}] GET ERROR:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error) console.error(`[MCP-${id}] Stack:`, error.stack);
    throw error;
  }
};

export const POST = async (req: Request) => {
  requestCounter++;
  const id = requestCounter;
  try {
    console.log(`\n[MCP-${id}] POST request`);
    console.log(`[MCP-${id}] Method: POST`);
    console.log(`[MCP-${id}] URL: ${req.url}`);
    console.log(`[MCP-${id}] Headers:`, JSON.stringify(Object.fromEntries(req.headers), null, 2));
    
    // Read body
    const clonedReq = req.clone();
    const body = await clonedReq.text();
    console.log(`[MCP-${id}] Body:`, body);
    
    const response = handler(req);
    console.log(`[MCP-${id}] POST returning`);
    return response;
  } catch (error) {
    console.error(`[MCP-${id}] POST ERROR:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error) console.error(`[MCP-${id}] Stack:`, error.stack);
    throw error;
  }
};

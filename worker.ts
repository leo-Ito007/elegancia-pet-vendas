import { env } from "cloudflare:workers";
import { GET as readStore, POST as writeStore } from "@/app/api/store/route";
import { POST as uploadProductImage } from "@/app/api/product-image/route";
import { GET as readProductImage } from "@/app/api/product-image/[key]/route";

/**
 * Servidor Cloudflare Worker.
 *
 * O index.html inicia a interface no navegador. Este Worker atende as rotas
 * de banco de dados e imagens e encaminha os demais pedidos para os arquivos
 * estáticos gerados pelo Vite.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/store") {
      if (request.method === "GET") return readStore();
      if (request.method === "POST") return writeStore(request);
      return methodNotAllowed();
    }

    if (url.pathname === "/api/product-image") {
      if (request.method === "POST") return uploadProductImage(request);
      return methodNotAllowed();
    }

    const imageRoute = url.pathname.match(/^\/api\/product-image\/(.+)$/);
    if (imageRoute) {
      if (request.method !== "GET") return methodNotAllowed();
      return readProductImage(request, {
        params: Promise.resolve({ key: decodeURIComponent(imageRoute[1]) }),
      });
    }

    if (!env.ASSETS) {
      return new Response("Interface indisponível.", { status: 503 });
    }

    return env.ASSETS.fetch(request);
  },
};

function methodNotAllowed() {
  return Response.json({ error: "Método não permitido." }, { status: 405 });
}

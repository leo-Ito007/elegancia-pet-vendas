import { env } from "cloudflare:workers";
export async function GET(_request:Request,{params}:{params:Promise<{key:string}>}){
 if(!env.BUCKET)return new Response("Indisponível",{status:503});const {key}=await params;const object=await env.BUCKET.get(key);if(!object)return new Response("Não encontrada",{status:404});
 return new Response(object.body,{headers:{"content-type":object.httpMetadata?.contentType||"image/jpeg","cache-control":"public, max-age=31536000, immutable"}});
}

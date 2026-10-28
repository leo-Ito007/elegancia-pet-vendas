import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
export async function POST(request:Request){
 try{
  if(!env.BUCKET)return Response.json({error:"Armazenamento de imagens indisponível."},{status:503});
  const form=await request.formData();const file=form.get("image");const productId=Number(form.get("productId"));
  if(!(file instanceof File)||!productId)return Response.json({error:"Foto ou produto inválido."},{status:400});
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5_000_000)return Response.json({error:"Use JPG, PNG ou WebP de até 5 MB."},{status:400});
  const ext=file.type.split("/")[1].replace("jpeg","jpg");const key=`product-${productId}-${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
  const db=getDb();const [old]=await db.select({imageKey:products.imageKey}).from(products).where(eq(products.id,productId)).limit(1);
  await db.update(products).set({imageKey:key}).where(eq(products.id,productId));
  if(old?.imageKey)await env.BUCKET.delete(old.imageKey);
  return Response.json({ok:true,imageUrl:`/api/product-image/${key}`});
 }catch(e){console.error(e);return Response.json({error:"Não foi possível salvar a foto."},{status:500})}
}

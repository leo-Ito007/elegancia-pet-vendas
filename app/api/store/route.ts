import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, companies, customers, products, quotes, receivables, sales } from "@/db/schema";

/**
 * API central do sistema.
 *
 * GET reúne os dados necessários para o painel.
 * POST recebe uma propriedade "action" e executa a operação correspondente.
 * Regras críticas, como estoque e cliente obrigatório, são validadas aqui.
 */
export const dynamic="force-dynamic";
const num=(v:unknown)=>Number(v)||0;
const str=(v:unknown)=>String(v||"").trim();
export async function GET(){
 try{
  const db=getDb();
  const [ps,cs,ss,cos,cats,qs,rs,rev,topProducts,topCustomers]=await Promise.all([
   db.select().from(products).orderBy(desc(products.id)),
   db.select().from(customers).orderBy(desc(customers.id)),
   db.select({id:sales.id,customerId:sales.customerId,customerName:customers.name,productName:products.name,quantity:sales.quantity,total:sales.total,status:sales.status,paymentMethod:sales.paymentMethod,createdAt:sales.createdAt}).from(sales).leftJoin(customers,eq(sales.customerId,customers.id)).leftJoin(products,eq(sales.productId,products.id)).orderBy(desc(sales.id)).limit(200),
   db.select().from(companies).orderBy(desc(companies.id)),
   db.select().from(categories).orderBy(categories.parentId,categories.name),
   db.select({id:quotes.id,customerName:customers.name,companyName:companies.tradeName,productName:products.name,quantity:quotes.quantity,unitPrice:quotes.unitPrice,discount:quotes.discount,total:quotes.total,validUntil:quotes.validUntil,status:quotes.status,notes:quotes.notes,createdAt:quotes.createdAt}).from(quotes).leftJoin(customers,eq(quotes.customerId,customers.id)).leftJoin(companies,eq(quotes.companyId,companies.id)).leftJoin(products,eq(quotes.productId,products.id)).orderBy(desc(quotes.id)),
   db.select({id:receivables.id,customerName:customers.name,description:receivables.description,amount:receivables.amount,dueDate:receivables.dueDate,status:receivables.status,paidAt:receivables.paidAt}).from(receivables).leftJoin(customers,eq(receivables.customerId,customers.id)).orderBy(receivables.status,receivables.dueDate),
   db.select({revenue:sql<number>`coalesce(sum(${sales.total}),0)`,count:sql<number>`count(*)`}).from(sales).where(sql`${sales.createdAt} >= datetime('now','start of month')`),
   db.select({name:products.name,quantity:sql<number>`sum(${sales.quantity})`,revenue:sql<number>`sum(${sales.total})`}).from(sales).innerJoin(products,eq(sales.productId,products.id)).groupBy(products.id).orderBy(desc(sql`sum(${sales.quantity})`)).limit(10),
   db.select({name:customers.name,purchases:sql<number>`count(${sales.id})`,total:sql<number>`sum(${sales.total})`}).from(sales).innerJoin(customers,eq(sales.customerId,customers.id)).groupBy(customers.id).orderBy(desc(sql`sum(${sales.total})`)).limit(10)
  ]);
  return Response.json({products:ps,customers:cs,sales:ss,companies:cos,categories:cats,quotes:qs,receivables:rs,reports:{topProducts,topCustomers},metrics:{revenue:rev[0]?.revenue||0,salesCount:rev[0]?.count||0,customersCount:cs.length,lowStock:ps.filter(p=>p.stock<=p.minStock).length,receivable:rs.filter(r=>r.status==="Pendente").reduce((a,r)=>a+r.amount,0)}});
 }catch(e){console.error(e);return Response.json({error:"Banco de dados temporariamente indisponível."},{status:500})}
}
export async function POST(req:Request){
 try{
  const body=await req.json() as Record<string,unknown>;const db=getDb();let createdId:number|undefined;
  if(body.action==="createProduct"){if(!str(body.name))return bad("Informe o nome do produto.");const [r]=await db.insert(products).values({name:str(body.name),sku:str(body.sku),category:str(body.category),price:num(body.price),cost:num(body.cost),stock:num(body.stock),minStock:num(body.minStock)}).returning({id:products.id});createdId=r.id;}
  else if(body.action==="createCustomer"){if(!str(body.name))return bad("Informe o nome do cliente.");if(!str(body.document))return bad("Informe o CPF ou CNPJ.");const [r]=await db.insert(customers).values({name:str(body.name),document:str(body.document),address:str(body.address),phone:str(body.phone),whatsapp:str(body.whatsapp),email:str(body.email),city:str(body.city)}).returning({id:customers.id});createdId=r.id;}
  else if(body.action==="createCompany"){if(!str(body.name))return bad("Informe a razão social.");const [r]=await db.insert(companies).values({name:str(body.name),tradeName:str(body.tradeName),document:str(body.document),phone:str(body.phone),email:str(body.email),address:str(body.address)}).returning({id:companies.id});createdId=r.id;}
  else if(body.action==="createCategory"){if(!str(body.name))return bad("Informe o nome da categoria.");const [r]=await db.insert(categories).values({name:str(body.name),parentId:num(body.parentId)||null}).returning({id:categories.id});createdId=r.id;}
  else if(body.action==="createQuote"){const productId=num(body.productId),quantity=num(body.quantity)||1,discount=num(body.discount);const [p]=await db.select().from(products).where(eq(products.id,productId)).limit(1);if(!p)return bad("Selecione um produto.");const total=Math.max(0,p.price*quantity-discount);const [r]=await db.insert(quotes).values({customerId:num(body.customerId)||null,companyId:num(body.companyId)||null,productId,quantity,unitPrice:p.price,discount,total,validUntil:str(body.validUntil),notes:str(body.notes)}).returning({id:quotes.id});createdId=r.id;}
  else if(body.action==="createReceivable"){if(!str(body.description)||num(body.amount)<=0)return bad("Preencha a descrição e o valor.");const [r]=await db.insert(receivables).values({customerId:num(body.customerId)||null,description:str(body.description),amount:num(body.amount),dueDate:str(body.dueDate)}).returning({id:receivables.id});createdId=r.id;}
  else if(body.action==="markReceivablePaid"){await db.update(receivables).set({status:"Pago",paidAt:new Date().toISOString()}).where(eq(receivables.id,num(body.id)));}
  else if(body.action==="updateQuoteStatus"){await db.update(quotes).set({status:str(body.status)}).where(eq(quotes.id,num(body.id)));}
  else if(body.action==="createCartSale"){
   // Nunca confie apenas no carrinho do navegador: o estoque é relido aqui.
   const items=Array.isArray(body.items)?body.items as Array<{productId:number;quantity:number}>:[];const customerId=num(body.customerId);const payment=str(body.paymentMethod)||"Pix";
   if(!customerId)return bad("Selecione o cliente antes de finalizar a venda.");
   if(!items.length)return bad("Adicione produtos ao carrinho.");
   const selected=[] as Array<{id:number;name:string;price:number;stock:number;quantity:number}>;
   for(const item of items){const [p]=await db.select().from(products).where(eq(products.id,num(item.productId))).limit(1);const quantity=num(item.quantity);if(!p||quantity<1||p.stock<quantity)return bad(`Estoque insuficiente para ${p?.name||"um produto"}.`);selected.push({...p,quantity});}
   const orderTotal=selected.reduce((sum,p)=>sum+p.price*p.quantity,0);const actions:any[]=[];
   for(const p of selected){actions.push(db.insert(sales).values({productId:p.id,customerId,quantity:p.quantity,unitPrice:p.price,total:p.price*p.quantity,paymentMethod:payment}));actions.push(db.update(products).set({stock:p.stock-p.quantity}).where(eq(products.id,p.id)));}
   if(payment==="Boleto"||payment==="Prazo")actions.push(db.insert(receivables).values({customerId,description:"Venda pronta entrega",amount:orderTotal,dueDate:str(body.dueDate)||new Date().toISOString().slice(0,10)}));
   // O batch grava os itens e atualiza seus estoques na mesma operação.
   await db.batch(actions as [any,...any[]]);createdId=Date.now();
  }
  else if(body.action==="createSale"){const productId=num(body.productId),quantity=num(body.quantity),customerId=num(body.customerId);if(!customerId)return bad("Selecione o cliente antes de iniciar a venda.");if(!productId||quantity<1)return bad("Selecione o produto e a quantidade.");const [p]=await db.select().from(products).where(eq(products.id,productId)).limit(1);if(!p||p.stock<quantity)return bad("Estoque insuficiente para esta venda.");const total=p.price*quantity;const [sale]=await db.insert(sales).values({productId,customerId,quantity,unitPrice:p.price,total,paymentMethod:str(body.paymentMethod)||"Pix"}).returning({id:sales.id});const actions:any[]=[db.update(products).set({stock:p.stock-quantity}).where(eq(products.id,productId))];if(str(body.paymentMethod)==="Boleto"||str(body.paymentMethod)==="Prazo")actions.push(db.insert(receivables).values({customerId,saleId:sale.id,description:`Venda #${sale.id}`,amount:total,dueDate:str(body.dueDate)||new Date().toISOString().slice(0,10)}));await db.batch(actions as [any,...any[]]);createdId=sale.id;}
  else return bad("Ação inválida.");
  return Response.json({ok:true,id:createdId},{status:201});
 }catch(e){console.error(e);return Response.json({error:"Não foi possível salvar. Tente novamente."},{status:500})}
}
function bad(error:string){return Response.json({error},{status:400})}

/**
 * Estrutura relacional do sistema.
 *
 * O Drizzle usa estas declarações para tipar as consultas e gerar as
 * migrações SQL salvas na pasta drizzle/.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/** Produtos disponíveis para venda e controle de estoque. */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull().default(""),
  category: text("category").notNull().default(""),
  price: real("price").notNull().default(0),
  cost: real("cost").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  // A imagem fica no R2; o banco guarda apenas a chave do arquivo.
  imageKey: text("image_key"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Clientes. CPF/CNPJ é obrigatório na criação pela API. */
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  document: text("document").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull().default(""),
  city: text("city").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Cada linha representa um item vendido.
 * Uma venda com vários produtos gera várias linhas.
 */
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("Pago"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Dados das empresas emissoras de pedidos e orçamentos. */
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tradeName: text("trade_name").notNull().default(""),
  document: text("document").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** Categoria principal ou subcategoria, indicada por parentId. */
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    parentId: integer("parent_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_categories_parent_id").on(table.parentId)],
);

/** Orçamentos comerciais gerados pelo sistema. */
export const quotes = sqliteTable(
  "quotes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id").references(() => customers.id),
    companyId: integer("company_id").references(() => companies.id),
    productId: integer("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    discount: real("discount").notNull().default(0),
    total: real("total").notNull(),
    validUntil: text("valid_until").notNull(),
    status: text("status").notNull().default("Pendente"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_quotes_customer_id").on(table.customerId),
    index("idx_quotes_status").on(table.status),
  ],
);

/** Títulos financeiros gerados manualmente ou por vendas a prazo. */
export const receivables = sqliteTable(
  "receivables",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id").references(() => customers.id),
    saleId: integer("sale_id").references(() => sales.id),
    description: text("description").notNull(),
    amount: real("amount").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status").notNull().default("Pendente"),
    paidAt: text("paid_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_receivables_status_due").on(table.status, table.dueDate),
    index("idx_receivables_customer_id").on(table.customerId),
  ],
);

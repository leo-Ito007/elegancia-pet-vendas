# Gestor de Vendas — Elegância Pet

Código-fonte completo do sistema de vendas para produtos a pronta entrega.
O projeto funciona em celular e computador e foi preparado para edição no
Visual Studio Code.

## Recursos

- venda rápida com cliente obrigatório;
- catálogo visual com fotos, pesquisa e controle de quantidade;
- carrinho e baixa automática de estoque;
- produtos, categorias e subcategorias;
- clientes com CPF/CNPJ, endereço, telefone e WhatsApp;
- empresas, orçamentos e contas a receber;
- pedidos e orçamentos em PDF;
- relatórios, produtos mais vendidos e melhores clientes;
- armazenamento de dados em Cloudflare D1;
- armazenamento de fotos em Cloudflare R2.

## Tecnologias

- TypeScript, React 19 e Tailwind CSS
- Vite, React 19 e Cloudflare Worker
- Drizzle ORM
- Cloudflare D1 e R2
- jsPDF

## Abrir no VS Code

1. Extraia o arquivo ZIP.
2. No VS Code, clique em **Arquivo > Abrir Pasta**.
3. Selecione a pasta **elegancia-pet-vendas-vscode**.
4. Abra o terminal integrado.
5. Instale o Node.js 22 ou superior.
6. Execute:

    corepack enable
    pnpm install
    pnpm build
    pnpm dev

O endereço local será exibido no terminal, normalmente
http://localhost:5173.

## Banco de dados local

O projeto usa DB (D1) e BUCKET (R2). Para criar as tabelas no ambiente local,
compile o projeto e aplique, em ordem, os arquivos SQL da pasta drizzle. Cada
migração deve ser aplicada apenas uma vez. Exemplo:

    pnpm build
    pnpm exec wrangler d1 execute elegancia-pet-local --local --config dist/elegancia_pet_vendas/wrangler.json --persist-to .wrangler/state --file drizzle/0000_typical_master_chief.sql

Repita o último comando para as migrações 0001, 0002 e 0003.

> Esse banco é apenas para desenvolvimento no computador. Para vários
> dispositivos utilizarem os mesmos dados, publique o Worker e configure as
> vinculações D1 (`DB`) e R2 (`BUCKET`) na hospedagem.

## Organização das pastas

    index.html              Arquivo principal e entrada do sistema
    src/                    Interface React e estilos
    worker.ts               Servidor das APIs e arquivos estáticos
    app/api/                Rotas do servidor
    components/ui/          Componentes visuais reutilizáveis
    db/                     Conexão e estrutura do banco
    drizzle/                Migrações SQL versionadas
    lib/                    Funções auxiliares
    public/                 Ícones e arquivos públicos
    scripts/                Scripts de execução e compilação
    docs/                   Documentação técnica

## Onde alterar cada função

- Entrada principal: index.html
- Inicialização da interface: src/main.tsx
- Tela, carrinho e formulários: src/App.tsx
- Servidor principal: worker.ts
- Regras de vendas e relatórios: app/api/store/route.ts
- Upload e leitura de fotos: app/api/product-image/
- Estrutura do banco: db/schema.ts
- Cores e aparência: src/globals.css

Leia também docs/ARQUITETURA.md.

## Segurança

- Nunca coloque senhas ou tokens diretamente no código.
- Não envie a pasta .wrangler para repositórios.
- Antes de publicar, restrinja o acesso ao sistema.
- Faça backup do banco antes de alterações estruturais.

## Scripts principais

    pnpm dev          ambiente de desenvolvimento
    pnpm build        valida e compila o projeto
    pnpm start        executa a versão compilada
    pnpm db:generate  cria uma migração após mudar o schema

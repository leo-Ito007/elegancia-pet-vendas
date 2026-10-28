# Arquitetura do sistema

## Fluxo de uma venda

1. A interface carrega produtos e clientes por GET /api/store.
2. O operador seleciona obrigatoriamente um cliente.
3. Produtos e quantidades são adicionados ao carrinho.
4. A interface envia createCartSale para POST /api/store.
5. O servidor confere novamente o estoque de cada produto.
6. As vendas são gravadas e o estoque é reduzido.
7. Em boleto ou prazo, uma conta a receber é criada.
8. A interface recarrega os dados atualizados.

As validações no servidor são obrigatórias. Nunca confie apenas nas validações
da tela.

## Fotos de produtos

1. O produto é gravado no D1.
2. A imagem é enviada para POST /api/product-image.
3. O arquivo fica no R2.
4. O campo image_key guarda somente a chave do arquivo.
5. GET /api/product-image/[key] entrega a imagem ao navegador.

Formatos aceitos: JPG, PNG e WebP, com limite de 5 MB.

## Banco de dados

- products: produtos, preços, custos, estoque e foto;
- customers: clientes e documentos;
- sales: itens vendidos;
- companies: empresas emissoras;
- categories: categorias e subcategorias;
- quotes: orçamentos;
- receivables: contas a receber.

As mudanças de estrutura devem gerar uma nova migração. Não altere migrações já
aplicadas em produção.

## Recomendações para evolução

- separar app/page.tsx em módulos menores ao adicionar novas telas;
- criar testes para regras financeiras e estoque;
- adicionar permissões antes de liberar acesso a funcionários;
- implementar cancelamento com devolução controlada ao estoque;
- registrar auditoria de alterações importantes.

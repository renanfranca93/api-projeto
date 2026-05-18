# API Projeto

API serverless em Node.js para gerenciar um catálogo de produtos (mídias). Os dados são persistidos no **MongoDB** e o deploy é feito na **Vercel**.

## O que esta API faz

- Expõe um endpoint de **status** para verificar se a API está no ar.
- Permite **listar** e **cadastrar** produtos em uma coleção do MongoDB.
- Valida os dados enviados no cadastro antes de salvar no banco.

## Tecnologias

| Tecnologia | Uso |
|------------|-----|
| Node.js 24.x | Runtime |
| Vercel | Hospedagem e funções serverless |
| MongoDB | Banco de dados |
| `mongodb` (driver oficial) | Conexão e operações no banco |

## Estrutura do projeto

```
api-projeto/
├── api/
│   ├── index.js              # Health check (GET /)
│   ├── medias.js             # Listagem e cadastro de produtos
│   └── _lib/
│       ├── mongo.js          # Conexão reutilizável com o MongoDB
│       └── validators/
│           └── media.js      # Validação dos campos do produto
├── .env.example              # Modelo das variáveis de ambiente
├── package.json
└── vercel.json               # Configuração de rotas na Vercel
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 24.x
- Conta na [Vercel](https://vercel.com/) (para deploy e desenvolvimento local)
- Cluster [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ou outra instância MongoDB acessível pela internet)

## Configuração

1. Clone o repositório e instale as dependências:

```bash
npm install
```

2. Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `MONGODB_URI` | Sim | String de conexão do MongoDB (ex.: `mongodb+srv://usuario:senha@cluster.mongodb.net/`) |
| `MONGODB_DB` | Não | Nome do banco. Padrão: `project_api` |
| `MONGODB_PRODUCTS_COLLECTION` | Não | Nome da coleção. Padrão: `products` |

3. Na Vercel, configure as mesmas variáveis em **Settings → Environment Variables** do projeto.

## Desenvolvimento local

Com o [Vercel CLI](https://vercel.com/docs/cli) instalado:

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3000` (porta padrão do `vercel dev`).

## Endpoints

### `GET /`

Verifica se a API está online.

**Resposta de exemplo (200):**

```json
{
  "message": "API online"
}
```

### `GET /api/medias`

Retorna todos os produtos cadastrados na coleção.

**Resposta de exemplo (200):**

```json
[
  {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "nome": "Exemplo",
    "imagemUrl": "https://exemplo.com/imagem.jpg",
    "resumo": "Descrição opcional",
    "anoLancamento": 2024
  }
]
```

### `POST /api/medias`

Cadastra um novo produto.

**Corpo da requisição (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome do produto (não pode ser vazio) |
| `imagemUrl` | string | Sim | URL da imagem (não pode ser vazia) |
| `resumo` | string | Não | Texto descritivo |
| `anoLancamento` | number | Não | Ano de lançamento |

**Exemplo de requisição:**

```bash
curl -X POST http://localhost:3000/api/medias \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Meu produto",
    "imagemUrl": "https://exemplo.com/foto.jpg",
    "resumo": "Um resumo opcional",
    "anoLancamento": 2025
  }'
```

**Respostas:**

- `200` — Produto cadastrado; o corpo da resposta traz a lista atualizada de todos os produtos (mesmo formato do `GET`).
- `400` — Dados inválidos (ex.: `nome` ausente ou `anoLancamento` que não é número).

```json
{
  "error": "Field \"nome\" is required"
}
```

- `405` — Método HTTP não permitido (apenas `GET` e `POST`).

## Deploy

O projeto está preparado para deploy na Vercel:

1. Conecte o repositório à Vercel.
2. Defina as variáveis de ambiente (`MONGODB_URI`, etc.).
3. Faça o deploy — as rotas em `api/` viram funções serverless automaticamente.

A rota raiz (`/`) é reescrita para `/api/index` via `vercel.json`, mantendo o health check na URL principal do projeto.

## Observações

- A conexão com o MongoDB é **cacheada** entre invocações das funções serverless para melhor desempenho.
- Após um `POST` bem-sucedido, a API retorna a lista completa de produtos, não apenas o item criado.

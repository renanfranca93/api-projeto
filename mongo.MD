## Guia de MongoDB (Atlas) para esta API (Vercel)

Este documento é um passo a passo para conectar esta API ao **MongoDB Atlas**, criar a camada de conexão, implementar **GET/POST** persistindo dados reais e testar.

> Objetivo: qualquer estagiário conseguir “copiar e colar” os trechos daqui e deixar a API funcionando.

---

## 1) Instalando dependências

Na raiz do projeto:

```bash
npm install mongodb
```

Se você já baixou o projeto e quer instalar tudo:

```bash
npm install
```

---

## 2) Criando o banco no MongoDB Atlas

### 2.1 Criar cluster

- Entre no MongoDB Atlas
- Crie um **Project**
- Crie um **Cluster** (o gratuito M0 já serve)

### 2.2 Criar usuário (Database User)

- Vá em **Security → Database Access**
- Clique em **Add New Database User**
- Guarde **usuário** e **senha** (vamos usar na connection string)

### 2.3 Liberar acesso (Network Access)

- Vá em **Security → Network Access**
- Clique em **Add IP Address**
- Para desenvolvimento rápido, pode liberar `0.0.0.0/0` (não recomendado para produção)

### 2.4 Pegar a connection string (MONGODB_URI)

- Vá em **Database (Deployments)**
- No cluster, clique em **Connect**
- Selecione **Drivers**
- Escolha **Node.js** e copie a connection string

Vai ficar parecido com:

```txt
mongodb+srv://USUARIO:SENHA@seu-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

> Importante: o usuário/senha devem ser do **Database Access** (não é o email do Atlas).
>
> Se sua senha tiver caracteres especiais (`@`, `#`, `:`, `/` etc), você precisa “escapar” (URL-encode) a senha, senão pode dar erro `bad auth : authentication failed`.
> Exemplo: `minha@senha#123` vira `minha%40senha%23123`.

---

## 3) Configurando variáveis de ambiente (`.env`)

Crie (ou edite) o arquivo `.env` na raiz do projeto com estas variáveis:

```env
MONGODB_URI="mongodb+srv://USUARIO:SENHA@seu-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="project_api"
MONGODB_PRODUCTS_COLLECTION="products"
```

- **`MONGODB_URI`**: obrigatório
- **`MONGODB_DB`**: opcional (default: `project_api`)
- **`MONGODB_PRODUCTS_COLLECTION`**: opcional (default: `products`)

> Dica: não commite `.env` (mantenha no `.gitignore`).

---

## 4) Criando a conexão com Mongo (caching para Vercel)

Crie o arquivo `api/_lib/mongo.js` com o conteúdo abaixo.
Ele faz cache do cliente no `global` para evitar abrir uma conexão nova em toda requisição (boa prática em serverless).

```js
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

let cached = global._mongo;

if (!cached) {
  cached = global._mongo = { client: null, clientPromise: null };
}

async function getClient() {
  if (cached.client) return cached.client;
  if (!cached.clientPromise) {
    cached.clientPromise = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    })
      .connect()
      .then((client) => {
        cached.client = client;
        return client;
      });
  }
  return cached.clientPromise;
}

async function getCollection() {
  const client = await getClient();
  const dbName = process.env.MONGODB_DB || 'project_api';
  const collectionName = process.env.MONGODB_PRODUCTS_COLLECTION || 'products';
  return client.db(dbName).collection(collectionName);
}

module.exports = { getCollection };
```

---

## 5) (Recomendado) Criando validação do payload do produto

Crie o arquivo `api/_lib/validators/product.js`.

Regras:
- `nome`: obrigatório (string não vazia)
- `imagemUrl`: obrigatório (string não vazia)
- `resumo`: opcional (se vier, deve ser string)
- `anoLancamento`: opcional (se vier, deve ser number)

```js
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateProduct(input) {
  const p = input && typeof input === 'object' ? input : {};

  const nome = p.nome;
  const imagemUrl = p.imagemUrl;
  const resumo = p.resumo;
  const anoLancamento = p.anoLancamento;

  if (!isNonEmptyString(nome)) {
    return { ok: false, error: 'Field "nome" is required' };
  }

  if (!isNonEmptyString(imagemUrl)) {
    return { ok: false, error: 'Field "imagemUrl" is required' };
  }

  if (anoLancamento !== undefined && typeof anoLancamento !== 'number') {
    return { ok: false, error: 'Field "anoLancamento" must be a number' };
  }

  return {
    ok: true,
    value: {
      nome: nome.trim(),
      imagemUrl: imagemUrl.trim(),
      ...(typeof resumo === 'string' ? { resumo } : {}),
      ...(anoLancamento !== undefined ? { anoLancamento } : {}),
    },
  };
}

module.exports = { validateProduct };
```

---

## 6) Criando a rota `GET/POST` persistindo no MongoDB

Edite/crie `api/products.js` com o handler abaixo.

Comportamento:
- **GET**: retorna todos os documentos da collection `products`
- **POST**: valida, insere 1 documento e retorna a lista atualizada

```js
const { getCollection } = require('./_lib/mongo');
const { validateProduct } = require('./_lib/validators/product');

module.exports = async (req, res) => {
  const collection = await getCollection();

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;

    const validation = validateProduct(body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    await collection.insertOne(validation.value);
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const products = await collection.find({}).toArray();
  return res.status(200).json(products);
};
```

---

## 7) Rodando localmente (Vercel Dev)

Se você nunca logou na Vercel na sua máquina:

```bash
npx vercel login
```

Depois rode o servidor local:

```bash
npm run dev
```

Por padrão o `vercel dev` sobe em `http://localhost:3000`.

---

## 8) Testando a API

### 8.1 GET

```bash
curl http://localhost:3000/api/products
```

### 8.2 POST (Windows PowerShell)

```powershell
curl -Method POST http://localhost:3000/api/products `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ "nome":"Título do filme", "imagemUrl":"https://pathwise.com.br/d20.png", "resumo":"Isso é um resumo", "anoLancamento":2020 }'
```

> Se você mandar `anoLancamento` como string (`"2020"`), a validação acima vai rejeitar. Mande como número: `2020`.

---

## 9) Subindo para produção (Vercel)

No dashboard do projeto na Vercel:

- **Settings → Environment Variables**
- Crie **`MONGODB_URI`** (obrigatório)
- (Opcional) **`MONGODB_DB`**, **`MONGODB_PRODUCTS_COLLECTION`**
- Faça **Redeploy**

Se aparecer erro:
- `bad auth : authentication failed` → usuário/senha errados (ou senha precisa de URL-encode)
- Timeout / network error → IP não liberado no Atlas (Network Access)


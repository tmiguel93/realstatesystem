# Imobiliaria SaaS

Base inicial das fases 1 e 2 do sistema de administracao imobiliaria.

## Estrutura

- `apps/api`: API REST em Node.js, TypeScript, Express e Prisma.
- `apps/web`: frontend React com Vite, TypeScript, Tailwind e TanStack Query.
- `packages/shared`: constantes e contratos compartilhados.
- `docs`: arquitetura, wireframes e planejamento.

## Como rodar

1. Instale dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env` e ajuste o `DATABASE_URL`.

3. Gere o client do Prisma:

```bash
npm run db:generate
```

4. Suba o banco e aplique o schema:

```bash
npm run db:push
```

5. Rode o seed inicial:

```bash
npm run db:seed
```

6. Inicie frontend e backend:

```bash
npm run dev
```

## Credenciais iniciais

- Email: valor de `SEED_ADMIN_EMAIL`
- Senha: valor de `SEED_ADMIN_PASSWORD`


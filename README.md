# Sistema de Gestão de Clínicas

Sistema de gerenciamento para clínicas de reabilitação, com foco em acessibilidade e gestão eficiente de pacientes e profissionais.

## Tecnologias

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL (Railway)
- **ORM**: Drizzle
- **Infraestrutura**: Vercel (deploy)

## Características

- Gerenciamento de pacientes e profissionais
- Agendamento de consultas e procedimentos
- Evolução de pacientes
- Upload e gestão de documentos
- Chat entre profissionais
- Notificações em tempo real (WebSockets)
- Gestão de múltiplas unidades/clínicas
- Conformidade com LGPD

## Configuração Local

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env` com suas variáveis de ambiente:
   ```
   DATABASE_URL=sua_string_de_conexao_postgresql
   SESSION_SECRET=sua_chave_secreta
   NODE_ENV=development
   PORT=5000
   ```
4. Execute as migrações: `npm run db:push`
5. Popule o banco com dados iniciais: `npm run db:seed`
6. Inicie o servidor de desenvolvimento: `npm run dev`

## Deploy no Vercel com Railway

### 1. Configurar o banco de dados no Railway

1. Crie uma conta no [Railway](https://railway.app/)
2. Crie um novo projeto e selecione PostgreSQL
3. Após a criação, acesse a aba "Connect" e copie a connection string

### 2. Configurar o projeto no Vercel

1. Crie uma conta no [Vercel](https://vercel.com/)
2. Importe o repositório do GitHub
3. Configure as seguintes variáveis de ambiente:
   - `DATABASE_URL` (string de conexão do Railway)
   - `SESSION_SECRET` (chave secreta para sessões)
   - `NODE_ENV=production`
4. Deploy!

### 3. Executar migrações no banco de dados

```bash
# Localmente, com a variável DATABASE_URL apontando para o Railway
npm run db:migrate
```

## Estrutura do Projeto

- `/api` - Endpoints serverless para Vercel
- `/client` - Frontend React
- `/server` - Backend Express
- `/db` - Configuração de banco de dados
- `/shared` - Schemas e tipos compartilhados
- `/uploads` - Arquivos enviados pelos usuários

## Migração do Replit para Vercel/Railway

Esta versão do projeto foi migrada do Replit para Vercel e Railway, com adaptações para funcionar como serverless na infraestrutura do Vercel. As principais mudanças incluem:

1. Configurações específicas para o Vercel (vercel.json)
2. Adaptação do sistema de autenticação para funcionar sem depender do Replit Auth
3. Configuração para usar PostgreSQL no Railway
4. Otimização do código para ambiente serverless

## Licença

MIT
# Amigo ou Inimigo

> Um sorteio de amigo secreto onde o caos decide se você ganhou um **AMIGO** ou um **INIMIGO**.

🌐 **Aplicação em produção:** https://amigo-ou-inimigo.vercel.app

## Sobre o projeto

**Amigo ou Inimigo** é uma aplicação web para organizar um sorteio secreto entre amigos.

O organizador cria um evento, convida os participantes e realiza o sorteio. Cada participante recebe exatamente uma pessoa e descobre apenas o próprio resultado.

Além da pessoa sorteada, o sistema também define aleatoriamente se a relação será:

* 🟢 **AMIGO**
* 🔴 **INIMIGO**

A proposta é transformar o tradicional amigo secreto em uma brincadeira mais caótica e imprevisível.

## Funcionalidades

### Eventos

* Criar eventos
* Listar eventos organizados
* Visualizar eventos dos quais o usuário participa
* Organizador adicionado automaticamente como participante
* Evento bloqueado após a realização do sorteio

### Participantes

* Convites por e-mail
* Aceitação de convites
* Inclusão automática como participante após aceitação
* Remoção de participantes antes do sorteio
* Proteção contra participantes duplicados

### Sorteio

* Cada participante recebe exatamente uma pessoa
* Nenhum participante pode sortear a si próprio
* Nenhuma pessoa é sorteada por mais de um participante
* É permitido que A sorteie B e B sorteie A
* Cada resultado recebe aleatoriamente `AMIGO` ou `INIMIGO`
* O sorteio possui proteção contra execuções simultâneas
* Depois do sorteio, a composição do evento fica congelada

### Privacidade

* Cada participante visualiza apenas o próprio resultado
* Usuários não participantes não conseguem acessar resultados
* Operações administrativas exigem autorização do organizador
* Convites são protegidos por token
* Tokens possuem validade

### Autenticação

* Cadastro de usuários
* Login com e-mail e senha
* Senhas armazenadas com hash
* Sessões com JWT
* Logout
* Proteção das rotas autenticadas
* Redirecionamento seguro após login/cadastro

### E-mail

* Envio de convites por e-mail
* Links individuais para cada convite
* Integração com Gmail SMTP

## Tecnologias

### Frontend

* Next.js 16
* React 19
* Tailwind CSS 4

### Backend

* Next.js App Router
* NextAuth
* Prisma 7
* PostgreSQL
* bcrypt

### Infraestrutura

* Vercel — hospedagem da aplicação
* Supabase — PostgreSQL
* Gmail SMTP — envio de convites
* GitHub — versionamento e código-fonte

## Arquitetura

O projeto utiliza o App Router do Next.js.

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── invitations/
│   │   └── register/
│   │
│   ├── dashboard/
│   │   ├── events/
│   │   └── participating/
│   │
│   ├── invitations/
│   ├── login/
│   ├── register/
│   └── page.js
│
├── generated/
│   └── prisma/
│
├── lib/
│   ├── draw/
│   ├── email.js
│   ├── prisma.js
│   └── ...
│
└── auth.js

prisma/
├── migrations/
└── schema.prisma
```

## Modelo do sorteio

O sorteio é construído para formar uma atribuição válida entre os participantes:

```text
Participante
     ↓
recebe exatamente uma pessoa
     ↓
não pode receber a si mesmo
     ↓
cada pessoa é recebida exatamente uma vez
```

Depois disso, cada relação recebe independentemente:

```text
AMIGO
ou
INIMIGO
```

A aplicação também utiliza transações com isolamento `Serializable` para evitar resultados inconsistentes em tentativas simultâneas de sorteio.

## Segurança

O projeto foi desenvolvido com foco em isolamento entre usuários e autorização no backend.

Entre as proteções implementadas estão:

* autorização por usuário e evento
* proteção de rotas autenticadas
* resultados privados
* tokens de convite
* expiração de convites
* prevenção de duplicidade
* bloqueio de alterações após o sorteio
* tratamento de concorrência
* validação de `callbackUrl`
* segredos mantidos por variáveis de ambiente

## Executando localmente

### Pré-requisitos

* Node.js
* npm
* PostgreSQL ou um banco PostgreSQL compatível
* variáveis de ambiente configuradas

### Instalação

```bash
git clone <URL_DO_REPOSITORIO>
cd amigo-ou-inimigo
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` com as variáveis necessárias para o ambiente local:

```env
DATABASE_URL=...
DIRECT_URL=...

NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

GMAIL_USER=...
GMAIL_APP_PASSWORD=...
```

Nunca versione credenciais, senhas ou chaves de API.

### Banco de dados

Aplicar as migrations:

```bash
npx prisma migrate deploy
```

Gerar o Prisma Client:

```bash
npx prisma generate
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:3000
```

### Testes e build

```bash
npm test
npm run lint
npm run build
```

## Fluxo principal

```text
Criar conta
    ↓
Login
    ↓
Criar evento
    ↓
Convidar participantes
    ↓
Aceitação dos convites
    ↓
Todos os participantes definidos
    ↓
Realizar sorteio
    ↓
AMIGO ou INIMIGO
    ↓
Cada participante consulta seu próprio resultado
```

## Roadmap

Algumas melhorias podem ser adicionadas futuramente:

* recuperação de senha
* reenvio manual de convites
* personalização adicional dos eventos
* melhorias de experiência e animações
* histórico de convites
* notificações adicionais por e-mail
* melhorias de perfil e conta

## Status

**Em produção.**

O fluxo principal da aplicação está implementado e validado, incluindo autenticação, eventos, convites, participantes, sorteio, resultados privados e envio de e-mails.

---

## Autor

Desenvolvido por **JvCruzM**.

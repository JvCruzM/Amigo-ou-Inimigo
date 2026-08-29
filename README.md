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
* Conversas anônimas não revelam a identidade dos participantes
* Usuários só conseguem acessar conversas das quais participam
* O conteúdo das mensagens não é armazenado em texto puro no banco

### Autenticação

* Cadastro de usuários
* Login com e-mail e senha
* Senhas armazenadas com hash
* Sessões com JWT
* Logout
* Proteção das rotas autenticadas
* Redirecionamento seguro após login/cadastro
* Recuperação de senha
* Tokens de recuperação com expiração e uso único

### Mensagens anônimas

* Conversas anônimas entre participantes relacionados pelo sorteio
* Conversas criadas após a realização do sorteio
* Conversas bidirecionais
* Histórico de mensagens
* Envio de mensagens em tempo real
* Recebimento de mensagens em tempo real
* Envio com `Enter`
* `Shift + Enter` para quebrar linha
* Contador de caracteres
* Indicador de mensagem enviada
* Indicador de mensagem lida
* Atualização de `✓` para `✓✓` em tempo real
* Contador de mensagens não lidas por conversa
* Contador global de mensagens não lidas
* Marcação automática como lida ao abrir a conversa
* Atualização em tempo real do estado de leitura
* Caixa de entrada com preview da última mensagem
* Atualização em tempo real da caixa de entrada
* Identificação de conversa ativa
* Interface responsiva para dispositivos móveis

### Criptografia

* Mensagens armazenadas criptografadas no banco de dados
* Criptografia utilizando AES-256-GCM
* Descriptografia realizada no backend antes da entrega ao usuário autorizado
* Conteúdo original não é armazenado em texto puro no banco
* Uso de uma chave de criptografia mantida em variável de ambiente
* Nonce/IV aleatório por mensagem
* Autenticação de integridade do conteúdo criptografado

### E-mail

* Envio de convites por e-mail
* Links individuais para cada convite
* Recuperação de senha por e-mail
* Notificação de novas mensagens anônimas
* Apenas uma notificação por bloco de mensagens não lidas
* Não envia e-mail enquanto o destinatário está ativo na conversa
* O conteúdo da mensagem não é incluído no e-mail de notificação
* A identidade do remetente não é revelada no e-mail
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
* Nodemailer

### Realtime

* Supabase Realtime
* JWT temporário para autenticação do Realtime
* Eventos `INSERT` para novas mensagens
* Eventos `UPDATE` para atualização do estado de leitura

### Infraestrutura

* Vercel — hospedagem da aplicação
* Supabase — PostgreSQL e Realtime
* Gmail SMTP — envio de e-mails
* GitHub — versionamento e código-fonte

## Arquitetura

O projeto utiliza o App Router do Next.js.

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── events/
│   │   │   └── [eventId]/
│   │   │       └── messages/
│   │   │           ├── activity/
│   │   │           ├── read/
│   │   │           └── route.js
│   │   ├── invitations/
│   │   ├── messages/
│   │   ├── realtime/
│   │   │   └── token/
│   │   └── register/
│   │
│   ├── dashboard/
│   │   ├── events/
│   │   ├── messages/
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
│   ├── message-encryption.js
│   ├── prisma.js
│   └── supabase-browser.js
│
└── auth.js

prisma/
├── migrations/
└── schema.prisma

tests/
├── message-encryption-test.js
└── ...
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

## Modelo das conversas anônimas

Após o sorteio, os participantes possuem conversas anônimas relacionadas às suas relações de sorteio.

A conversa não expõe a identidade visual do participante ao outro lado.

```text
Participante A
      ↕
Conversa anônima
      ↕
Participante B
```

Cada mensagem pertence a uma conversa e possui:

```text
Mensagem
├── conteúdo criptografado
├── remetente
├── data de criação
└── data de leitura
```

O acesso às conversas é validado no backend. Um usuário que não participa da conversa não consegue visualizar seu conteúdo nem enviar mensagens para ela.

## Realtime

O sistema utiliza Supabase Realtime para acompanhar alterações nas mensagens.

Os principais eventos são:

```text
INSERT
  ↓
nova mensagem
  ↓
atualização imediata do chat

UPDATE
  ↓
mensagem marcada como lida
  ↓
atualização imediata do indicador ✓ / ✓✓
```

O frontend mantém a conversa ativa enquanto o usuário está visualizando o chat.

Essa informação é utilizada para evitar o envio de notificações por e-mail quando a pessoa já está acompanhando a conversa em tempo real.

## Segurança

O projeto foi desenvolvido com foco em isolamento entre usuários e autorização no backend.

Entre as proteções implementadas estão:

* autorização por usuário e evento
* proteção de rotas autenticadas
* resultados privados
* proteção das conversas anônimas
* validação de acesso à conversa antes do envio de mensagens
* usuários não participantes não conseguem acessar mensagens
* tokens de convite
* expiração de convites
* prevenção de duplicidade
* bloqueio de alterações após o sorteio
* tratamento de concorrência
* validação de `callbackUrl`
* segredos mantidos por variáveis de ambiente
* mensagens armazenadas criptografadas
* chave de criptografia fora do banco de dados
* autenticação do acesso ao Supabase Realtime
* validação de autorização no backend para operações de mensagens

## Executando localmente

### Pré-requisitos

* Node.js
* npm
* PostgreSQL ou um banco PostgreSQL compatível
* Projeto Supabase configurado
* Conta Gmail com credencial para SMTP
* Variáveis de ambiente configuradas

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

APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

SUPABASE_JWT_SECRET=...

MESSAGE_ENCRYPTION_KEY=...
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
    ↓
Conversas anônimas disponíveis
    ↓
Mensagens em tempo real
    ↓
Mensagens lidas em tempo real
    ↓
Notificações por e-mail quando necessário
```

## Fluxo das mensagens

```text
Usuário abre conversa
        ↓
Conversa marcada como ativa
        ↓
Mensagem recebida
        ↓
Realtime INSERT
        ↓
Mensagem aparece imediatamente
        ↓
Mensagem marcada como lida
        ↓
Realtime UPDATE
        ↓
Remetente recebe atualização ✓ → ✓✓
```

Quando o destinatário não está ativo:

```text
Nova mensagem
     ↓
Mensagem salva criptografada
     ↓
Destinatário está ativo?
     ├── SIM → não envia e-mail
     └── NÃO
           ↓
      verifica notificação pendente
           ↓
      envia apenas uma notificação
      enquanto houver mensagens não lidas
```

## Roadmap

Algumas melhorias podem ser adicionadas futuramente:

* personalização adicional dos eventos
* melhorias de experiência e animações
* histórico de convites
* melhorias de perfil e conta
* novas opções de notificações
* melhorias adicionais de gerenciamento de eventos

## Status

**Em produção.**

O fluxo principal da aplicação está implementado e validado, incluindo autenticação, cadastro, recuperação de senha, eventos, convites, participantes, sorteio, resultados privados, conversas anônimas, mensagens em tempo real, criptografia das mensagens, indicadores de leitura, contadores de mensagens não lidas, notificações por e-mail e proteção de acesso.

---

## Autor

Desenvolvido por **JvCruzM**.

# 💈 Anthony's Barbearia — AgendaPro Web SaaS

> **Estilo • Respeito • Autoestima**  
> *"Mais que um corte, é um cuidado com você!"*

Sistema web moderno e completo para agendamento online e gestão para barbearias, com arquitetura **mobile-first**, design dark luxuoso com detalhes dourados, zero burocracia para o cliente (sem necessidade de login ou app) e painel administrativo completo para gestão do estabelecimento.

---

## 🚀 Tabela de Serviços e Preços Oficiais

| Ícone | Serviço | Valor | Duração |
| :---: | :--- | :---: | :---: |
| ✂️ | **Corte de Cabelo** | **R$ 25,00** | 30 min |
| 🧔 | **Barba** | **R$ 20,00** | 25 min |
| ✂️🧔 | **Corte + Barba** | **R$ 40,00** | 50 min |
| 👁️ | **Sobrancelha** | **R$ 5,00** | 15 min |
| 👣 | **Pezinho** | **R$ 5,00** | 15 min |
| ✒️ | **Pigmentação** | **R$ 10,00** | 20 min |

---

## 🌟 Principais Funcionalidades

### 📱 Para o Cliente (Página Pública `/agendar/:slug`)
- **Zero Login:** O cliente agenda em menos de 1 minuto sem precisar criar conta ou baixar aplicativo.
- **Fluxo Mobile-First em 4 Etapas Fluidas:**
  1. **Serviço:** Tabela de preços oficial com ícones circulares e tags douradas.
  2. **Profissional:** Escolha de barbeiro preferido ou atalho *"Qualquer profissional disponível"* (mais rápido).
  3. **Data & Horário Unificados:** Carrossel de 14 dias + horários livres agrupados por período (*Manhã*, *Tarde*, *Noite*).
  4. **Identificação & Confirmação:** Apenas Nome e WhatsApp com resumo do agendamento estilo VIP Pass.
- **Comprovante Digital & Ações Rápidas:**
  - Código único de reserva (ex: `AP-PQSVS`) com botão de copiar em 1 toque.
  - Botão direto para **Avisar no WhatsApp** da barbearia com mensagem pré-formatada.
  - Botão para **Adicionar ao Google Agenda**.
- **Prevenção Concorrente de Double-Booking:** Restrição atômica no banco contra agendamentos simultâneos para o mesmo barbeiro.

### 💼 Para o Proprietário / Barbeiro (Painel `/app`)
- **Dashboard Operacional:** Resumo diário de atendimentos, agendamentos pendentes e previsão de faturamento do dia.
- **Agenda Completa:** Visualização diária e semanal com filtros por barbeiro e status.
- **Agendamento Manual:** Inclusão rápida de clientes presenciais ou via telefone com validação preventiva.
- **Gestão da Equipe & Escalas:** Cadastro de profissionais, folgas pontuais e jornadas de trabalho.
- **Base de Clientes:** Histórico de frequência e atalho direto para WhatsApp do cliente.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, TypeScript (modo estrito), Vite 8.
- **Estilização:** Tailwind CSS v4, Vanilla CSS tokens, Google Fonts (`Cinzel`, `Caveat`, `Inter`).
- **Ícones:** Lucide React + SVGs customizados.
- **Banco de Dados & Auth:** PostgreSQL via Supabase (Row Level Security, extensões `btree_gist`, restrição temporal `tstzrange`).
- **Testes:** Vitest e React Testing Library (15 testes passando).
- **Hospedagem:** Otimizado para **Vercel** (inclui `vercel.json` para rotas SPA).

---

## 💻 Como Rodar Localmente

### 1. Clonar e Instalar
```bash
git clone <URL_DO_REPOSITORIO>
cd agendapro
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Para rodar offline imediatamente (sem precisar do Supabase remoto):
```env
VITE_DEMO_MODE=true
VITE_DEFAULT_TIMEZONE=America/Maceio
```

### 3. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse:
- **Página de Agendamento:** `http://localhost:5173/agendar/anthonys-barbearia`
- **Painel Administrativo:** `http://localhost:5173/app`

### 4. Testes & Validação de Build
```bash
# Executar suíte de testes (Vitest)
npm test

# Validar tipagem e compilar bundle de produção
npm run build
```

---

## 🚀 Guia Passo a Passo: Subir para o GitHub (Git)

### 1. Inicializar e comitar (caso ainda não tenha feito)
```bash
git init
git add .
git commit -m "feat: initial commit - Anthony's Barbearia production MVP"
```

### 2. Criar repositório no GitHub
1. Acesse [github.com/new](https://github.com/new) e crie um repositório (ex: `anthonys-barbearia` ou `agendapro`).
2. Vincule e envie os arquivos:
```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

## 🗄️ Guia Passo a Passo: Configurar o Supabase

Quando quiser colocar o sistema em produção com banco de dados real:

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Defina uma senha forte para o banco e selecione a região (ex: `sa-east-1` São Paulo).

### 2. Rodar as Tabelas e Políticas (Migration)
1. No painel do Supabase, abra o menu **SQL Editor**.
2. Clique em **New query**.
3. Copie todo o conteúdo do arquivo [`supabase/migrations/00001_initial_schema.sql`](supabase/migrations/00001_initial_schema.sql) e cole no editor.
4. Clique em **Run**. Isso criará todas as tabelas, índices `btree_gist`, trigger functions, políticas de RLS e o procedure `book_public_appointment`.

### 3. Inserir Dados Iniciais (Seed)
1. No **SQL Editor**, abra outra query.
2. Copie o conteúdo de [`supabase/seed.sql`](supabase/seed.sql) e cole no editor.
3. Clique em **Run**. A **Anthony's Barbearia** com os 6 serviços oficiais e equipe será criada no banco.

### 4. Obter as Chaves de Conexão
1. No Supabase, vá em **Project Settings** > **API**.
2. Copie os valores:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API Keys** > `anon public`

---

## 🌐 Guia Passo a Passo: Deploy na Vercel

O projeto já inclui o arquivo [`vercel.json`](vercel.json) configurado para redirecionar todas as rotas para o `index.html`, garantindo que links como `/agendar/anthonys-barbearia` e `/app` funcionem sem erro 404 ao recarregar a página.

### 1. Conectar com o GitHub
1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **Add New...** > **Project**.
3. Selecione o repositório que você acabou de subir.

### 2. Configurar Build & Output
- **Framework Preset:** `Vite`
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 3. Configurar as Variáveis de Ambiente (Environment Variables)
No campo de variáveis da Vercel, adicione:

| Chave | Valor Recomendado | Descrição |
| :--- | :--- | :--- |
| `VITE_DEMO_MODE` | `false` *(ou `true` se quiser testar sem banco)* | Modo de operação |
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | URL da sua instância Supabase |
| `VITE_SUPABASE_ANON_KEY` | `sua-chave-anon-publica` | Chave pública anônima do Supabase |
| `VITE_DEFAULT_TIMEZONE` | `America/Maceio` | Fuso horário da barbearia |

### 4. Finalizar Deploy
1. Clique em **Deploy**.
2. Em menos de 2 minutos seu site estará no ar com link público HTTPS (ex: `https://anthonys-barbearia.vercel.app`)!

---

## 🔒 Segurança e Regras de Negócio Implementadas

1. **Proteção Contra Double-Booking:** Exclusion constraint nativa do PostgreSQL (`tstzrange` via `btree_gist`) impedindo qualquer agendamento duplo mesmo sob concorrência simultânea.
2. **Proteção Anti-Bot:** Honeypot invisível na página pública de agendamento que rejeita preenchimentos automáticos de robôs sem gerar atrito para o cliente humano.
3. **Isolamento Multitenant:** Row Level Security (RLS) habilitado em todas as tabelas, impedindo que um proprietário acerte ou visualize dados de outras barbearias.
4. **Armazenamento de Valores Inteiros:** Todos os preços são gravados em centavos BRL (`price_cents`), prevenindo erros de arredondamento de ponto flutuante.

---

## 📄 Licença
Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.

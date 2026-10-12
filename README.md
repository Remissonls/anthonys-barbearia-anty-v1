# AgendaPro — Sistema Web de Agendamento e Gestão para Barbearias

AgendaPro é uma plataforma web SaaS multiempresa desenvolvida sob o princípio **mobile-first**, com foco em barbearias brasileiras. Ela combina um painel administrativo completo para o proprietário gerenciar serviços, equipe e atendimento, com uma página pública exclusiva de agendamento online de alta conversão sem exigir cadastro ou download por parte dos clientes.

---

## 1. Funcionalidades Implementadas

### Área Administrativa (Proprietário)
- **Autenticação & Sessão:** Login por e-mail/senha, cadastro de nova barbearia, recuperação de senha e acesso rápido para demonstração.
- **Onboarding Guiado:** Configuração inicial de dados comerciais, slug da página pública, primeiro serviço e primeiro profissional.
- **Dashboard Operacional:** Responde instantaneamente às 3 perguntas diárias:
  1. *Quais são os próximos atendimentos?* (cronograma em tempo real com ações rápidas)
  2. *Existe alguma pendência?* (painel de agendamentos pendentes de confirmação)
  3. *Como está a movimentação de hoje?* (total do dia, em atendimento, concluídos, cancelados e faturamento estimado).
- **Agenda Diária & Semanal:** Navegação entre datas, botão "Hoje", filtros por barbeiro e por status, e cartões de atendimento com status visual e textual.
- **Criação Manual de Agendamentos:** Reserva direta pelo proprietário com busca/criação de clientes e validação preventiva contra conflitos.
- **Gestão de Serviços:** CRUD de serviços, valores em centavos BRL (`price_cents`), durações em minutos e desativação sem afetar dados históricos.
- **Gestão de Barbeiros & Equipe:** Cadastro de profissionais, vinculação de serviços habilitados (`barber_services`), escalas individuais com horários de entrada/saída, pausa de almoço e registro de folgas/bloqueios pontuais (`barber_time_off`).
- **Base de Clientes:** Listagem, pesquisa instantânea por nome ou telefone normalizado, histórico de atendimentos e atalho direto para WhatsApp.
- **Configurações Gerais:** Horários de funcionamento por dia da semana (`business_hours`), modo de confirmação de reservas (automática vs. manual) e link público exclusivo.

### Página Pública de Agendamento (`/agendar/:slug`)
- **Zero Login:** O cliente agenda em menos de 1 minuto sem criar conta ou digitar senhas.
- **Fluxo em 7 Etapas Otimizado para Mobile:**
  1. Seleção de serviço com nome, duração e valor.
  2. Escolha do barbeiro preferido ou opção *"Qualquer profissional disponível"*.
  3. Seleção do dia com carrossel dos próximos 14 dias.
  4. Horários disponíveis em botões táteis (cadência de 15 minutos).
  5. Contato do cliente (Nome e WhatsApp com máscara automática e proteção anti-bot via honeypot).
  6. Revisão completa da reserva antes do envio.
  7. Confirmação instantânea com código exclusivo da reserva (ex: `AP-VVU49`).
- **Prevenção de Conflitos & Concorrência:** Proteção atômica no banco de dados contra agendamentos simultâneos para o mesmo barbeiro.

---

## 2. Stack Tecnológica

- **Frontend:** React 19, TypeScript (modo estrito), Vite 8.
- **Estilização:** Tailwind CSS v4, Vanilla CSS Design Tokens (paleta grafite `#0B0D0F`, `#14171B` com destaques dourados `#D6B875`).
- **Ícones:** Lucide React.
- **Banco de Dados & Autenticação:** PostgreSQL com Supabase (Row Level Security, extensões `btree_gist` e restrição de exclusão temporal `tstzrange`).
- **Backend Serverless:** Supabase Edge Functions (Deno/TypeScript) e Stored Procedures SQL (`book_public_appointment`).
- **Testes Automatizados:** Vitest e React Testing Library.

---

## 3. Pré-requisitos

- **Node.js:** Versão 20 ou superior (testado no Node.js v25).
- **npm:** Versão 10 ou superior.
- **Supabase CLI:** (Opcional, para aplicar migrations localmente ou no projeto Supabase remoto).

---

## 4. Instalação e Execução Local

### 1. Clonar ou Acessar o Repositório
```bash
cd agendapro
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Conteúdo de `.env`:
```env
# Modo Demonstração (Permite usar e avaliar o AgendaPro imediatamente sem credenciais remotas)
VITE_DEMO_MODE=true

# Fuso horário padrão
VITE_DEFAULT_TIMEZONE=America/Maceio

# Credenciais do Supabase (Obrigatórias apenas quando VITE_DEMO_MODE=false)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

> **Nota:** Por padrão, com `VITE_DEMO_MODE=true`, o AgendaPro executa com um motor de banco de dados em memória/LocalStorage idêntico ao PostgreSQL, populado com a "Barbearia Mestre Navalha" (slug `mestre-navalha`).

### 4. Executar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no navegador:
- Painel Administrativo: `http://localhost:5173/app`
- Página Pública de Agendamento: `http://localhost:5173/agendar/mestre-navalha`

---

## 5. Execução de Testes Automatizados

O AgendaPro inclui testes unitários e de integração cobrindo cálculo de disponibilidade, restrições de concorrência, formatação monetária e normalização de telefones:

```bash
npm test
```

Para executar em modo contínuo (watch):
```bash
npm run test:watch
```

---

## 6. Build de Produção

Para validar a tipagem estrita do TypeScript e gerar o bundle otimizado:
```bash
npm run build
```

Para visualizar o build localmente:
```bash
npm run preview
```

---

## 7. Configuração do Supabase e Banco de Dados

### 1. Aplicar Migrations SQL
Execute o arquivo `supabase/migrations/00001_initial_schema.sql` via Supabase Dashboard (SQL Editor) ou através do Supabase CLI:

```bash
supabase db push
# ou
supabase migration up
```

Esta migration cria:
1. Extensões `uuid-ossp` e `btree_gist`.
2. Tabelas: `barbershops`, `barbers`, `services`, `barber_services`, `business_hours`, `barber_working_hours`, `barber_time_off`, `customers`, `appointments`.
3. **Restrição de Exclusão (Exclusion Constraint):**
   ```sql
   ALTER TABLE appointments
   ADD CONSTRAINT no_overlapping_appointments
   EXCLUDE USING gist (
     barber_id WITH =,
     tstzrange(starts_at, ends_at) WITH &&
   )
   WHERE (status IN ('pending', 'confirmed', 'in_progress'));
   ```
4. Políticas de Row Level Security (RLS) que isolam completamente os dados entre diferentes barbearias.
5. Função transacional `book_public_appointment(...)` com segurança elevada (`SECURITY DEFINER` com `search_path = public, pg_temp`).

### 2. Popular Dados de Demonstração (Seed)
Execute o arquivo `supabase/seed.sql` no SQL Editor do Supabase para criar a barbearia fictícia "Barbearia Mestre Navalha" com 3 profissionais, 5 serviços e agendamentos de teste.

---

## 8. Implantação das Edge Functions

Para publicar as Edge Functions no Supabase:
```bash
supabase functions deploy public-booking
supabase functions deploy public-availability
```

---

## 9. Limitações Conhecidas do MVP & Próximos Passos Comerciais

Conforme o escopo do produto (Seção 2.2 do Documento Mestre):
1. **WhatsApp & Notificações:** Não realiza disparos automatizados de WhatsApp via API oficial nesta versão (fornece link `wa.me` manual com um clique).
2. **Pagamentos Online:** Não processa cartão nem cobrança de sinal no checkout (o cliente paga diretamente no estabelecimento).
3. **Multi-usuário por Barbeiro:** Os barbeiros são registros gerenciados pela conta do proprietário da barbearia; logins individuais por barbeiro serão implementados em versão posterior.

---

## 10. Checklist Antes de Vender para Clientes Reais

- [ ] Criar projeto de produção no Supabase.
- [ ] Aplicar migration `00001_initial_schema.sql` e verificar a extensão `btree_gist`.
- [ ] Configurar chaves `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de hospedagem (Vercel, Netlify ou Cloudflare Pages).
- [ ] Definir `VITE_DEMO_MODE=false`.
- [ ] Configurar domínio personalizado com certificado SSL.
- [ ] Configurar envio de e-mails transacionais (SMTP) no Supabase Auth para recuperação de senha.

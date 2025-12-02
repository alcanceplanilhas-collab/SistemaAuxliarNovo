# Configuração de Variáveis de Ambiente

## 📋 Visão Geral

Este projeto usa variáveis de ambiente para configurar a conexão com o Supabase de forma segura, separando ambientes de desenvolvimento e produção.

## 🔧 Desenvolvimento Local

### Passo 1: Criar arquivo `.env.local`

Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

### Passo 2: Preencher as credenciais

Edite `.env.local` e adicione suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### Passo 3: Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Você deve ver no console do navegador:
```
✅ Supabase configurado (Modo Desenvolvimento)
   URL: https://seu-projeto.supabase.co
```

## ☁️ Produção (Vercel)

### Configurar variáveis de ambiente na Vercel

1. Acesse o dashboard do seu projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:
   - `VITE_SUPABASE_URL` = URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = Chave anônima do Supabase
4. Selecione os ambientes: **Production**, **Preview**, **Development**
5. Clique em **Save**

### Deploy

Após configurar as variáveis, faça o deploy:
```bash
git push
```

A Vercel automaticamente usará as variáveis de ambiente configuradas.

## 🔒 Segurança

### ✅ Boas Práticas

- ✅ `.env.local` está no `.gitignore` (nunca será commitado)
- ✅ `.env.example` não contém valores reais (apenas template)
- ✅ Variáveis de produção ficam apenas na Vercel
- ✅ Logs mostram ambiente atual (dev/prod)

### ❌ Evite

- ❌ Nunca commite `.env.local` ao Git
- ❌ Nunca compartilhe suas chaves em código
- ❌ Nunca use chaves de produção localmente

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente do Supabase não configuradas"

**Local**: Verifique se `.env.local` existe e contém as variáveis corretas.

**Vercel**: Verifique se as variáveis estão configuradas no dashboard da Vercel.

### Build falha com erro TS18047

Este erro foi corrigido. Se ainda aparecer, certifique-se de que está usando a versão mais recente do `src/supabase.ts`.

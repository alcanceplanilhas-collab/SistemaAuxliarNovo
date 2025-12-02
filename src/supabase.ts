import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------------
// CONFIGURAÇÃO DO SUPABASE
// ----------------------------------------------------------------------------------
// Este arquivo funciona tanto localmente quanto na Vercel:
// - LOCAL: Lê do arquivo .env.local (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
// - VERCEL: Lê das variáveis de ambiente configuradas no dashboard da Vercel
// ----------------------------------------------------------------------------------

/**
 * Função auxiliar para ler variáveis de ambiente de forma segura
 * Prioriza import.meta.env (Vite) que funciona tanto local quanto na Vercel
 */
const getEnv = (key: string): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const val = import.meta.env[key];
    if (val) return val;
  }
  return '';
};

// Busca as variáveis de ambiente
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Validação
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Detecta ambiente (apenas para log)
const isDev = import.meta.env.DEV;

if (!isSupabaseConfigured) {
  console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('📝 Verifique se as seguintes variáveis estão definidas:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  console.error('');
  if (isDev) {
    console.error('🔧 AMBIENTE LOCAL DETECTADO:');
    console.error('   Certifique-se de ter um arquivo .env.local na raiz do projeto.');
    console.error('   Exemplo: cp .env.example .env.local');
  } else {
    console.error('☁️  AMBIENTE DE PRODUÇÃO DETECTADO:');
    console.error('   Configure as variáveis no dashboard da Vercel (Settings > Environment Variables).');
  }
} else {
  // Log discreto apenas em desenvolvimento para confirmar conexão
  if (isDev) {
    console.log('✅ Supabase configurado (Modo Desenvolvimento)');
    console.log('   URL:', supabaseUrl);
  }
}

// Exporta o cliente do Supabase
// Fallback para strings vazias para evitar erros de tipo (TS18047), 
// mas as chamadas falharão se não estiver configurado.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

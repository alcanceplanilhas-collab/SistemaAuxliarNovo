-- =====================================================================
-- MIGRATION: Setup PDF Documents and Storage
-- Descrição: Criar tabela para metadata de PDFs e configurar Storage
-- Data: 2025-12-05
-- =====================================================================

-- Ativar extensão UUID (caso não esteja ativa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. CRIAR TABELA DE DOCUMENTOS PDF
-- =====================================================================

CREATE TABLE IF NOT EXISTS tbl_pdf_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id INTEGER NOT NULL,
  ordem_id VARCHAR(50),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP DEFAULT NOW(),
  uploaded_by INTEGER,
  signed BOOLEAN DEFAULT FALSE,
  signature_url VARCHAR(500),
  signature_date TIMESTAMP,
  signed_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_pdf_documents_empresa 
  ON tbl_pdf_documents(empresa_id);

CREATE INDEX IF NOT EXISTS idx_pdf_documents_ordem 
  ON tbl_pdf_documents(ordem_id);

CREATE INDEX IF NOT EXISTS idx_pdf_documents_signed 
  ON tbl_pdf_documents(signed);

CREATE INDEX IF NOT EXISTS idx_pdf_documents_upload_date 
  ON tbl_pdf_documents(upload_date DESC);

-- =====================================================================
-- 3. ATIVAR RLS (ROW LEVEL SECURITY)
-- =====================================================================

ALTER TABLE tbl_pdf_documents ENABLE ROW LEVEL SECURITY;

-- Drop políticas existentes se houver
DROP POLICY IF EXISTS "Users can view PDFs from their company" ON tbl_pdf_documents;
DROP POLICY IF EXISTS "Users can upload PDFs to their company" ON tbl_pdf_documents;
DROP POLICY IF EXISTS "Users can update PDFs from their company" ON tbl_pdf_documents;

-- Permitir SELECT para usuários autenticados
CREATE POLICY "Users can view PDFs from their company"
  ON tbl_pdf_documents FOR SELECT
  TO authenticated
  USING (true);  -- Permitir visualização para todos usuários autenticados
                 -- Filtro por empresa será feito na aplicação

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Users can upload PDFs to their company"
  ON tbl_pdf_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Permitir upload para usuários autenticados

-- Permitir UPDATE para usuários autenticados (para assinaturas)
CREATE POLICY "Users can update PDFs from their company"
  ON tbl_pdf_documents FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================================
-- 4. BUCKET STORAGE - CRIAR NO PAINEL DO SUPABASE
-- =====================================================================

-- IMPORTANTE: As políticas de Storage NÃO podem ser criadas via SQL!
-- Você deve criar manualmente no painel do Supabase.

-- Passo 1: Criar bucket 'pdf-documents'
-- 1. Ir para Storage > Create bucket
-- 2. Nome: pdf-documents
-- 3. Public bucket: NÃO (deixe desmarcado)
-- 4. File size limit: 10485760 (10MB)
-- 5. Allowed MIME types: application/pdf,image/png

-- Passo 2: Configurar políticas de Storage
-- 1. Ir para Storage > Policies > pdf-documents bucket
-- 2. Clique em "New Policy"
-- 3. Crie as seguintes políticas:

-- POLÍTICA 1: Permitir INSERT (upload)
-- - Policy name: Allow authenticated uploads
-- - Allowed operation: INSERT
-- - Target roles: authenticated
-- - WITH CHECK expression:
--   bucket_id = 'pdf-documents'

-- POLÍTICA 2: Permitir SELECT (leitura)
-- - Policy name: Allow authenticated reads  
-- - Allowed operation: SELECT
-- - Target roles: authenticated
-- - USING expression:
--   bucket_id = 'pdf-documents'

-- POLÍTICA 3: Permitir UPDATE (atualização)
-- - Policy name: Allow authenticated updates
-- - Allowed operation: UPDATE
-- - Target roles: authenticated
-- - USING expression:
--   bucket_id = 'pdf-documents'
-- - WITH CHECK expression:
--   bucket_id = 'pdf-documents'

-- POLÍTICA 4: Permitir DELETE (opcional)
-- - Policy name: Allow authenticated deletes
-- - Allowed operation: DELETE
-- - Target roles: authenticated
-- - USING expression:
--   bucket_id = 'pdf-documents'

-- =====================================================================
-- 5. TRIGGER PARA ATUALIZAR updated_at
-- =====================================================================

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger
DROP TRIGGER IF EXISTS update_tbl_pdf_documents_updated_at ON tbl_pdf_documents;

CREATE TRIGGER update_tbl_pdf_documents_updated_at
    BEFORE UPDATE ON tbl_pdf_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- FIM DA MIGRATION
-- =====================================================================

-- Verificar se tudo foi criado corretamente
SELECT 
    'tbl_pdf_documents' as object,
    COUNT(*) as count 
FROM information_schema.tables 
WHERE table_name = 'tbl_pdf_documents';

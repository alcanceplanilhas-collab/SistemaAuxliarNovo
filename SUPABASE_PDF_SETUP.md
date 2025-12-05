# Configuração do Supabase para Sistema de Assinaturas PDF

Este documento descreve como configurar o Supabase para suportar a funcionalidade de visualização e assinatura de PDFs.

## Pré-requisitos

- Acesso ao painel de administração do Supabase
- Permissões para criar buckets e executar SQL
- Projeto Supabase já configurado no arquivo `.env.local`

## Passo 1: Criar Bucket de Storage

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **Create bucket**
5. Configure o bucket:
   - **Name**: `pdf-documents`
   - **Public bucket**: **NÃO** (deixe desmarcado)
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: `application/pdf,image/png`
6. Clique em **Create bucket**

## Passo 2: Executar Migration SQL

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase_pdf_migration.sql`
4. Cole no editor SQL
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Verifique se não há erros na execução

### O que o script faz:

- ✅ Cria a tabela `tbl_pdf_documents` para armazenar metadata dos PDFs
- ✅ Cria índices para melhorar performance de buscas
- ✅ Configura Row Level Security (RLS) policies
- ✅ Adiciona trigger para atualizar campo `updated_at` automaticamente

## Passo 3: Configurar Políticas de Storage

**IMPORTANTE:** As políticas de Storage precisam ser configuradas manualmente no painel.

1. Vá para **Storage** > **Policies**
2. Selecione o bucket `pdf-documents`
3. Clique em **New Policy**

### Política 1: Upload de Arquivos

- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'pdf-documents' AND auth.role() = 'authenticated'
  ```

### Política 2: Leitura de Arquivos

- **Policy name**: `Allow authenticated reads`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'pdf-documents' AND auth.role() = 'authenticated'
  ```

### Política 3: Atualização de Arquivos

- **Policy name**: `Allow authenticated updates`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'pdf-documents' AND auth.role() = 'authenticated'
  ```

## Passo 4: Verificar Instalação

Execute as seguintes queries no SQL Editor para verificar:

### Verificar Tabela

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tbl_pdf_documents'
ORDER BY ordinal_position;
```

**Resultado esperado:** Lista de 14 colunas (id, empresa_id, ordem_id, etc.)

### Verificar Índices

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'tbl_pdf_documents';
```

**Resultado esperado:** 5 índices (primary key + 4 índices criados)

### Verificar RLS

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tbl_pdf_documents';
```

**Resultado esperado:** `rowsecurity` deve ser `true`

### Verificar Bucket

```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'pdf-documents';
```

**Resultado esperado:** 1 linha com `public = false`

## Passo 5: Testar via Aplicação

1. Inicie o servidor de desenvolvimento:
   ```powershell
   npm run dev
   ```

2. Faça login na aplicação

3. Navegue até a aba **Assinaturas**

4. Teste as seguintes operações:

   ✅ **Upload de PDF**
   - Clique em "Enviar PDF"
   - Selecione um arquivo PDF (< 10MB)
   - Verifique se o upload completa sem erros
   - Confirme se o PDF aparece na lista

   ✅ **Visualização de PDF**
   - Clique em um PDF da lista
   - Verifique se o PDF é renderizado corretamente
   - Teste os controles de navegação de página
   - Teste os controles de zoom

   ✅ **Assinatura de PDF**
   - Abra um PDF não assinado
   - Clique em "Assinar"
   - Desenhe uma assinatura no canvas
   - Clique em "Confirmar"
   - Verifique se o status muda para "Assinado"

## Solução de Problemas

### Erro: "Failed to upload PDF"

**Causa:** Políticas de Storage não configuradas corretamente

**Solução:**
1. Verifique se o bucket `pdf-documents` existe
2. Confirme se as políticas de Storage estão ativas
3. Verifique se o usuário está autenticado (verifique localStorage)

### Erro: "Failed to insert into tbl_pdf_documents"

**Causa:** Tabela não criada ou RLS bloqueando insert

**Solução:**
1. Execute novamente o script de migration
2. Verifique se as políticas RLS estão corretas
3. Confirme authentication no Supabase Auth

### PDF não renderiza

**Causa:** Worker do PDF.js não carregado

**Solução:**
- Verifique se há acesso à internet (CDN do PDF.js)
- Verifique console do navegador para erros
- Tente limpar cache do navegador

### Assinatura não é salva

**Causa:** Política de upload de imagens no Storage

**Solução:**
1. Verifique se MIME type `image/png` está permitido no bucket
2. Confirme se a política de INSERT do Storage está ativa
3. Verifique logs do console para detalhes do erro

## Estrutura de Arquivos no Storage

Os arquivos serão organizados da seguinte forma:

```
pdf-documents/
├── {empresa_id}/
│   ├── {ordem_id}/
│   │   ├── {timestamp}_{filename}.pdf
│   │   └── ...
│   ├── {timestamp}_{filename}.pdf  (PDFs sem ordem)
│   └── signatures/
│       ├── {document_id}_signature_{timestamp}.png
│       └── ...
└── ...
```

## Manutenção

### Limpar PDFs antigos (opcional)

Para limpar PDFs com mais de 90 dias:

```sql
DELETE FROM tbl_pdf_documents 
WHERE upload_date < NOW() - INTERVAL '90 days'
AND signed = false;
```

**ATENÇÃO:** Isso não remove os arquivos do Storage. Para remover arquivos, use:

```javascript
// No código da aplicação
const { data, error } = await supabase.storage
  .from('pdf-documents')
  .remove([file_path])
```

### Monitorar tamanho do Storage

```sql
SELECT 
    COUNT(*) as total_documents,
    SUM(file_size) as total_size_bytes,
    SUM(file_size) / 1024 / 1024 as total_size_mb,
    COUNT(*) FILTER (WHERE signed = true) as signed_documents,
    COUNT(*) FILTER (WHERE signed = false) as unsigned_documents
FROM tbl_pdf_documents;
```

## Segurança

### Recomendações:

1. **Backup Regular**: Configure backups automáticos no Supabase
2. **HTTPS Obrigatório**: Sempre use HTTPS em produção
3. **Validação de Arquivo**: O sistema já valida tipo e tamanho no frontend
4. **RLS Ativo**: Nunca desative Row Level Security em produção
5. **Políticas Refinadas**: Em produção, considere políticas mais restritivas por empresa

## Conclusão

Após seguir todos os passos, o sistema de assinaturas PDF estará totalmente funcional. 

Para suporte adicional, consulte:
- [Documentação do Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentação de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [react-pdf Documentation](https://github.com/wojtekmaj/react-pdf)

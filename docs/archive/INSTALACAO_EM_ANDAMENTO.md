# 🔧 INSTALAÇÃO DO NODE.JS - EM ANDAMENTO

## 📍 Status Atual: Instalando Homebrew

O instalador do Homebrew está rodando e pedindo sua **senha de administrador do macOS**.

---

## ⚠️ AÇÃO NECESSÁRIA:

1. **Digite sua senha do macOS** no terminal quando solicitado
2. A senha não aparecerá na tela enquanto você digita (é normal!)
3. Pressione **Enter** após digitar a senha

---

## ⏱️ Tempo Estimado:

- **Homebrew**: 5-10 minutos
- **Node.js**: 2-3 minutos
- **Total**: ~10-15 minutos

---

## 📋 O que vai acontecer automaticamente:

### 1. Instalação do Homebrew
- Download dos arquivos necessários
- Configuração do ambiente
- Instalação de ferramentas base

### 2. Instalação do Node.js
Após o Homebrew, vou executar:
```bash
brew install node
```

### 3. Verificação
```bash
node --version
npm --version
```

### 4. Instalação das Dependências do Projeto
```bash
cd /Users/lailamiranda/dev-imi
npm install
```

### 5. Configuração do Prisma
```bash
npm run prisma:generate
npm run prisma:push
```

---

## 🎯 Resultado Final:

Após todos os passos, você terá:

✅ Homebrew instalado  
✅ Node.js instalado  
✅ npm disponível  
✅ Dependências do projeto instaladas  
✅ Prisma Client gerado  
✅ **7 tabelas criadas no Supabase**:
   1. users
   2. clients
   3. properties
   4. property_images
   5. client_property_links
   6. property_access_logs
   7. notifications

---

## 📊 Progresso:

```
[████░░░░░░░░░░░░░░░░] 20% - Instalando Homebrew...
```

---

**Aguardando**: Digite sua senha no terminal e pressione Enter 🔑

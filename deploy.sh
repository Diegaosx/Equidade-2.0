#!/bin/bash

# Script para facilitar o deploy no Vercel

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Script de Deploy para Vercel e Railway ===${NC}"

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI não encontrado. Instalando...${NC}"
    npm install -g vercel
fi

# Verificar se o arquivo .env.production existe
if [ ! -f .env.production ]; then
    echo -e "${RED}Arquivo .env.production não encontrado!${NC}"
    echo -e "${YELLOW}Criando arquivo .env.production com base no .env...${NC}"
    cp .env .env.production
    echo "Lembre-se de verificar e ajustar as variáveis de ambiente para produção."
fi

# Construir o projeto
echo -e "${GREEN}Compilando o projeto...${NC}"
npm run build

# Verificar se a compilação foi bem-sucedida
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro na compilação! Abortando deploy.${NC}"
    exit 1
fi

# Executar migrações no banco de dados (opcional)
echo -e "${YELLOW}Deseja aplicar migrações no banco de dados de produção? (s/N)${NC}"
read aplicar_migracoes

if [[ $aplicar_migracoes == "s" || $aplicar_migracoes == "S" ]]; then
    echo -e "${GREEN}Aplicando migrações no banco de dados de produção...${NC}"
    npm run db:migrate
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Erro ao aplicar migrações! Verifique a conexão com o banco de dados.${NC}"
        echo -e "${YELLOW}Deseja continuar com o deploy mesmo assim? (s/N)${NC}"
        read continuar
        if [[ $continuar != "s" && $continuar != "S" ]]; then
            echo -e "${RED}Deploy abortado pelo usuário.${NC}"
            exit 1
        fi
    fi
fi

# Deploy no Vercel
echo -e "${GREEN}Iniciando deploy no Vercel...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
else
    echo -e "${RED}Erro no deploy! Verifique os logs acima.${NC}"
fi
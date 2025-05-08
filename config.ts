import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Determina qual banco de dados usar (local vs Railway)
let databaseUrl = process.env.DATABASE_URL;

// Em produção, podemos alternar para o Railway
if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_DATABASE_URL) {
  console.log('Usando banco de dados do Railway em produção');
  databaseUrl = process.env.RAILWAY_DATABASE_URL;
} else {
  console.log('Usando banco de dados local/desenvolvimento');
}

// Verifica se a URL do banco de dados está definida
if (!databaseUrl) {
  console.error('Erro: Nenhuma URL de banco de dados válida encontrada.');
  console.error('Por favor, verifique DATABASE_URL no seu arquivo .env');
}

// Exporta as variáveis de ambiente para fácil acesso
export default {
  databaseUrl,
  railwayDatabaseUrl: process.env.RAILWAY_DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || 'senha-secreta-temporaria',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  isProduction: process.env.NODE_ENV === 'production',
};
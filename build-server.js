import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildServer() {
  console.log('Building server for production...');
  
  try {
    await build({
      entryPoints: ['./server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: './dist/server/index.js',
      format: 'esm',
      external: [
        'pg-native',
        'express',
        'react',
        'react-dom'
      ],
      minify: true,
      sourcemap: true,
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    // Copiar arquivos estáticos necessários
    const staticDirs = [
      ['client/public', 'dist/client/public'],
      ['uploads', 'dist/uploads']
    ];
    
    for (const [src, dest] of staticDirs) {
      if (fs.existsSync(src)) {
        // Criar diretório de destino se não existir
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        for (const file of files) {
          const srcPath = join(src, file);
          const destPath = join(dest, file);
          
          if (fs.statSync(srcPath).isDirectory()) {
            // Recursivamente copiar diretórios
            fs.cpSync(srcPath, destPath, { recursive: true });
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      } else {
        console.log(`Warning: Static directory ${src} not found`);
        fs.mkdirSync(dest, { recursive: true });
      }
    }
    
    // Copiar arquivos de ambiente para a pasta dist
    const envFiles = ['.env.production'];
    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, join('dist', file));
      }
    }
    
    console.log('Server build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildServer();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. Defina a URL do Frontend para o CORS
const FRONTEND_URL = 'https://crm-x-production-8a15.up.railway.app';

// 2. Defina a URL BASE do Backend (Removendo o '/api' para configuração mais limpa do proxy)
// O prefixo '/api' será adicionado de volta pelo pathRewrite
const BACKEND_BASE_URL = 'https://crm-x-backend-production.up.railway.app'; 

// --- Configuração de CORS ---

// Aplica o middleware CORS básico
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));

// Lida com as requisições OPTIONS (pre-flight requests)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        return res.sendStatus(200);
    }
    next();
});

// --- Configuração do Proxy ---

// Define que requisições para '/api' serão roteadas
app.use('/api', createProxyMiddleware({
    target: BACKEND_BASE_URL + '/api', // O destino é a URL base do backend
    changeOrigin: true,
    
    // O pathRewrite garante que o caminho /api seja mantido (ou adicionado de volta) 
    // antes de ser enviado ao backend, resultando em:
    // https://crm-x-backend-production.up.railway.app/api/users
    pathRewrite: {
        '^/api': '/api' 
    },
    
    // Configura cabeçalhos CORS na resposta do proxy
    onProxyRes: (proxyRes, req, res) => {
        // Garante que o frontend receba os cabeçalhos necessários
        res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        // Você pode remover os headers abaixo, pois o CORS middleware já cuida deles, 
        // mas mantê-los aqui não causa problemas e serve como redundância.
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    }
}));

// --- Inicialização do Servidor ---

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Proxy rodando na porta ${PORT}`);
});
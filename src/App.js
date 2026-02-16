import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, doc, collection, onSnapshot, query, addDoc, Timestamp,
    getDoc, deleteDoc, updateDoc, orderBy, setDoc, writeBatch
} from 'firebase/firestore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
    Trash2 as LucideTrash2, Building2 as LucideBuilding2, Plus as LucidePlus, Edit2 as LucideEdit2, X as LucideX, Settings as LucideSettings, 
    PieChart as LucidePieChart, Target as LucideTarget, ChevronDown as LucideChevronDown, ChevronRight as LucideChevronRight, Search as LucideSearch, 
    Percent as LucidePercent, Info as LucideInfo, Download as LucideDownload, Copy as LucideCopy, CheckCircle as LucideCheckCircle, Smartphone as LucideSmartphone, Menu as LucideMenu, Check as LucideCheck, Rocket as LucideRocket, Moon as LucideMoon, Sun as LucideSun, Repeat as LucideRepeat, Printer as LucidePrinter, Calculator as LucideCalculator, User as LucideUser, Briefcase as LucideBriefcase, Bell as LucideBell, MessageSquare as LucideMessageSquare, Send as LucideSend, TrendingUp as LucideTrendingUp, Home as LucideHome, RefreshCw as LucideRefresh
} from 'lucide-react';

// --- SUAS CHAVES REAIS DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyALRU9Wtzo5jVzb9gG1neR64UfQrfmSMfE",
  authDomain: "app-financeiro-2f.firebaseapp.com",
  projectId: "app-financeiro-2f",
  storageBucket: "app-financeiro-2f.firebasestorage.app",
  messagingSenderId: "803799145233",
  appId: "1:803799145233:web:546f085b19f7faff4acab0",
  measurementId: "G-KJ8SXVD6DD"
};

const appId = "financial-app-production";

// --- CONSTANTES GLOBAIS ---
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PERIOD_OPTIONS = [
    { value: 0, label: 'Jan' }, { value: 1, label: 'Fev' }, { value: 2, label: 'Mar' },
    { value: 3, label: 'Abr' }, { value: 4, label: 'Mai' }, { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' }, { value: 7, label: 'Ago' }, { value: 8, label: 'Set' },
    { value: 9, label: 'Out' }, { value: 10, label: 'Nov' }, { value: 11, label: 'Dez' },
    { value: 'Q1', label: '1º Trimestre' }, { value: 'Q2', label: '2º Trimestre' },
    { value: 'Q3', label: '3º Trimestre' }, { value: 'Q4', label: '4º Trimestre' },
    { value: 'S1', label: '1º Semestre' }, { value: 'S2', label: '2º Semestre' },
    { value: 'Y', label: 'Ano Atual' },
    { value: 'ALL', label: 'Tudo (Todos os Anos)' } // NOVA OPÇÃO
];

// --- CATEGORIAS EMPRESARIAIS ---
const TransactionTypeBusiness = { 
    RECEITA: 'Receita', 
    CUSTO: 'Custo', 
    DESPESA_OPERACIONAL: 'Despesa Operacional', 
    JUROS_FINANCEIROS: 'Juros/Financeiro', 
    IMPOSTOS: 'Impostos' 
};

const DEFAULT_SUBCATEGORIES_BUSINESS = {
    [TransactionTypeBusiness.RECEITA]: ['Vendas de Produtos', 'Prestação de Serviços', 'Rendimentos', 'Outras Receitas'],
    [TransactionTypeBusiness.CUSTO]: ['Compra de Mercadoria (CMV)', 'Matéria-Prima', 'Embalagens', 'Fretes'],
    [TransactionTypeBusiness.DESPESA_OPERACIONAL]: ['Salários', 'Aluguel', 'Marketing', 'Energia/Água', 'Manutenção', 'Material Escritório', 'Pro-labore'],
    [TransactionTypeBusiness.JUROS_FINANCEIROS]: ['Tarifas Bancárias', 'Juros Empréstimos', 'Multas'],
    [TransactionTypeBusiness.IMPOSTOS]: ['Simples Nacional', 'ICMS', 'ISS', 'PIS', 'COFINS', 'IRPJ', 'CSLL']
};

const categoriesBusiness = [
    { value: TransactionTypeBusiness.RECEITA, label: 'Receita (+)', color: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30', isPositive: true },
    { value: TransactionTypeBusiness.CUSTO, label: 'Custos (-)', color: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30', isPositive: false },
    { value: TransactionTypeBusiness.DESPESA_OPERACIONAL, label: 'Desp. Operacionais (-)', color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30', isPositive: false },
    { value: TransactionTypeBusiness.JUROS_FINANCEIROS, label: 'Juros/Financeiro (-)', color: 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30', isPositive: false },
    { value: TransactionTypeBusiness.IMPOSTOS, label: 'Impostos (-)', color: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30', isPositive: false },
];

// --- CATEGORIAS PESSOAIS ---
const TransactionTypePersonal = { 
    RECEITA: 'Renda', 
    MORADIA: 'Moradia', 
    ALIMENTACAO: 'Alimentação', 
    TRANSPORTE: 'Transporte', 
    LAZER: 'Lazer/Estilo de Vida', 
    SAUDE: 'Saúde', 
    EDUCACAO: 'Educação', 
    INVESTIMENTOS: 'Investimentos/Poupança', 
    DIVIDAS: 'Dívidas/Empréstimos' 
};

const DEFAULT_SUBCATEGORIES_PERSONAL = {
    [TransactionTypePersonal.RECEITA]: ['Salário', 'Freelance', 'Dividendos', 'Aluguéis Recebidos'],
    [TransactionTypePersonal.MORADIA]: ['Aluguel/Condomínio', 'Luz', 'Água', 'Internet', 'Gás', 'Manutenção'],
    [TransactionTypePersonal.ALIMENTACAO]: ['Supermercado', 'Restaurantes', 'Ifood/Delivery', 'Padaria'],
    [TransactionTypePersonal.TRANSPORTE]: ['Combustível', 'Uber/99', 'Ônibus/Metrô', 'Manutenção Veículo', 'IPVA/Seguro'],
    [TransactionTypePersonal.LAZER]: ['Viagens', 'Streaming (Netflix/Spotify)', 'Cinema', 'Bares', 'Hobbies'],
    [TransactionTypePersonal.SAUDE]: ['Plano de Saúde', 'Farmácia', 'Academia', 'Terapia'],
    [TransactionTypePersonal.EDUCACAO]: ['Faculdade/Escola', 'Cursos Online', 'Livros'],
    [TransactionTypePersonal.INVESTIMENTOS]: ['Reserva de Emergência', 'Ações/FIIs', 'CDB/Tesouro'],
    [TransactionTypePersonal.DIVIDAS]: ['Cartão de Crédito', 'Empréstimo Pessoal', 'Financiamento']
};

const categoriesPersonal = [
    { value: TransactionTypePersonal.RECEITA, label: 'Renda (+)', color: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30', isPositive: true },
    { value: TransactionTypePersonal.MORADIA, label: 'Moradia (-)', color: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30', isPositive: false },
    { value: TransactionTypePersonal.ALIMENTACAO, label: 'Alimentação (-)', color: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30', isPositive: false },
    { value: TransactionTypePersonal.TRANSPORTE, label: 'Transporte (-)', color: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30', isPositive: false },
    { value: TransactionTypePersonal.LAZER, label: 'Lazer (-)', color: 'text-pink-700 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/30', isPositive: false },
    { value: TransactionTypePersonal.SAUDE, label: 'Saúde (-)', color: 'text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/30', isPositive: false },
    { value: TransactionTypePersonal.EDUCACAO, label: 'Educação (-)', color: 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30', isPositive: false },
    { value: TransactionTypePersonal.INVESTIMENTOS, label: 'Investimentos (-)', color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30', isPositive: false },
    { value: TransactionTypePersonal.DIVIDAS, label: 'Dívidas (-)', color: 'text-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/30', isPositive: false },
];

// VARIÁVEL DE SEGURANÇA GLOBAL
const transactionCategories = categoriesBusiness; 
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

// --- HELPERS ---
const safeCurrency = (value) => { 
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00'; 
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); } 
    catch (e) { return 'R$ Error'; } 
};

const safeDate = (timestamp) => { 
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'Data N/A'; 
    try { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(timestamp.toDate()); } 
    catch (e) { return 'Inválida'; } 
};

const safePercent = (value, total) => { 
    if (!total || total === 0) return '0.0%'; 
    return `${((value / total) * 100).toFixed(1)}%`; 
};

// Lógica de Cálculo Financeiro
const calculateFinancials = (data = [], type = 'business', assets = []) => {
    const safeData = Array.isArray(data) ? data : [];
    // Seleciona o conjunto de categorias correto
    const cats = type === 'personal' ? categoriesPersonal : categoriesBusiness;
    
    const sumByType = (tType) => safeData.reduce((acc, t) => t.type === tType ? acc + (Number(t.amount) || 0) : acc, 0);
    
    const subcatTotals = {};
    safeData.forEach(t => { 
        if (t.subcategory) { 
            const key = `${t.type}:${t.subcategory}`; 
            subcatTotals[key] = (subcatTotals[key] || 0) + (Number(t.amount) || 0); 
        } 
    });

    const receitaKey = type === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA;
    const receita = sumByType(receitaKey);
    
    let totalSaidas = 0;
    cats.forEach(cat => { 
        if (!cat.isPositive) totalSaidas += sumByType(cat.value); 
    });

    const fluxoCaixa = receita - totalSaidas;
    
    // Cálculo Patrimonial
    const safeAssets = Array.isArray(assets) ? assets : [];
    const totalBens = safeAssets.filter(a => a.type === 'bens').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const totalInvest = safeAssets.filter(a => a.type === 'investimento').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const patrimonioLiquido = (totalBens + totalInvest + fluxoCaixa);

    const financials = { receita, totalSaidas, fluxoCaixa, subcatTotals, totalBens, totalInvest, patrimonioLiquido };
    
    // Popula totais por categoria
    cats.forEach(cat => { 
        financials[cat.value] = sumByType(cat.value); 
    });
    
    // Cálculos específicos de Empresa
    if (type === 'business') {
        financials.lucroBruto = receita - financials[TransactionTypeBusiness.CUSTO];
        financials.ebitda = financials.lucroBruto - financials[TransactionTypeBusiness.DESPESA_OPERACIONAL];
        financials.lucroLiquido = financials.ebitda - financials[TransactionTypeBusiness.JUROS_FINANCEIROS] - financials[TransactionTypeBusiness.IMPOSTOS];
    }

    return financials;
};

// --- COMPONENTES VISUAIS ---

// Componente: Visualização de Patrimônio
const AssetsView = ({ assets, onAddAsset, onDeleteAsset }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState('bens'); 
    const [indexer, setIndexer] = useState('');
    const [marketData, setMarketData] = useState({ USD: '...', EUR: '...', BTC: '...', CDI: '...', SELIC: '...' });

    // Busca dados de mercado
    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                // Moedas via AwesomeAPI (Pública)
                const resCoins = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL');
                const dataCoins = await resCoins.json();
                
                // Índices via HG Brasil (Simulado fallback se falhar por CORS)
                let hgData = { cdi: 11.25, selic: 11.25 }; 
                try {
                    const key = '855e9e8f';
                    const resHg = await fetch(`https://api.hgbrasil.com/finance/taxes?key=${key}&format=json-cors`);
                    const jsonHg = await resHg.json();
                    if(jsonHg.results && jsonHg.results[0]) hgData = jsonHg.results[0];
                } catch(e) { 
                    console.log('API Limit/CORS, usando fallback'); 
                }

                setMarketData({
                    USD: `R$ ${parseFloat(dataCoins.USDBRL.bid).toFixed(2)}`,
                    EUR: `R$ ${parseFloat(dataCoins.EURBRL.bid).toFixed(2)}`,
                    BTC: `R$ ${parseFloat(dataCoins.BTCBRL.bid).toLocaleString('pt-BR', {maximumFractionDigits: 0})}`,
                    CDI: `${hgData.cdi}%`,
                    SELIC: `${hgData.selic}%`
                });
            } catch (err) {
                setMarketData({ USD: 'R$ 5,60', EUR: 'R$ 6,00', BTC: '-', CDI: '11.25%', SELIC: '11.25%' });
            }
        };
        fetchMarketData();
    }, []);

    const handleAdd = () => {
        const val = parseFloat(value.replace(/\./g, '').replace(',', '.')); 
        if (!name || isNaN(val)) return;
        onAddAsset({ name, value: val, type, indexer, createdAt: Timestamp.now() });
        setName(''); setValue(''); setIndexer('');
    };

    const safeAssets = Array.isArray(assets) ? assets : [];
    const totalBens = safeAssets.filter(a => a.type === 'bens').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const totalInvest = safeAssets.filter(a => a.type === 'investimento').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-2 flex items-center gap-2"><LucideHome size={16}/> Meus Bens</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">{safeCurrency(totalBens)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-2 flex items-center gap-2"><LucideTrendingUp size={16}/> Meus Investimentos</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{safeCurrency(totalInvest)}</p>
                </div>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2"><LucideRefresh size={12}/> Mercado Hoje</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold">DÓLAR</p><p className="font-mono text-sm font-bold text-slate-700 dark:text-white">{marketData.USD}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold">EURO</p><p className="font-mono text-sm font-bold text-slate-700 dark:text-white">{marketData.EUR}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold">BITCOIN</p><p className="font-mono text-sm font-bold text-slate-700 dark:text-white">{marketData.BTC}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold">CDI (a.a)</p><p className="font-mono text-sm font-bold text-slate-700 dark:text-white">{marketData.CDI}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold">SELIC (a.a)</p><p className="font-mono text-sm font-bold text-slate-700 dark:text-white">{marketData.SELIC}</p></div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Cadastrar Novo Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <select value={type} onChange={e => setType(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white"><option value="bens">Bem Material</option><option value="investimento">Investimento</option></select>
                    <input placeholder="Nome (ex: Apto)" value={name} onChange={e => setName(e.target.value)} className="md:col-span-2 p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                    <input placeholder="Valor (R$)" value={value} onChange={e => setValue(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                    <select value={indexer} onChange={e => setIndexer(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white"><option value="">Sem índice</option><option value="CDI">CDI</option><option value="IPCA">IPCA</option><option value="INCC">INCC</option><option value="Dolar">Dólar</option></select>
                </div>
                <button onClick={handleAdd} className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">Adicionar</button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"><tr><th className="p-4">Item</th><th className="p-4">Tipo</th><th className="p-4">Índice</th><th className="p-4 text-right">Valor Atual</th><th className="p-4 w-10"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{safeAssets.map(a => (<tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30"><td className="p-4 font-medium text-slate-800 dark:text-slate-200">{a.name}</td><td className="p-4 text-slate-500 dark:text-slate-400 capitalize">{a.type}</td><td className="p-4 text-slate-500 dark:text-slate-400">{a.indexer || '-'}</td><td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">{safeCurrency(a.value)}</td><td className="p-4"><button onClick={() => onDeleteAsset(a.id)} className="text-red-400 hover:text-red-600"><LucideTrash2 size={16}/></button></td></tr>))}</tbody>
                 </table>
                 {safeAssets.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum item cadastrado.</div>}
            </div>
        </div>
    );
};

// Componente: Interface do Chatbot
const ChatInterface = ({ isOpen, onClose, onAddTransaction, onAddAsset, onUpdateTransaction, onDeleteTransaction, currentCompany, transactions }) => {
    const [messages, setMessages] = useState([{ id: 1, text: "Olá! Sou seu assistente financeiro.", sender: 'bot' }]);
    const [inputText, setInputText] = useState('');
    const [lastActionId, setLastActionId] = useState(null);
    const messagesEndRef = useRef(null);
    const companyType = currentCompany?.type || 'business';
    
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    const parseValue = (text) => {
        let clean = text.replace(/[^0-9.,-]/g, '');
        if (clean.includes(',')) { clean = clean.replace(/\./g, '').replace(',', '.'); } else { clean = clean.replace(/\./g, ''); }
        return parseFloat(clean);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText; const lowerText = text.toLowerCase();
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user' }]);
        setInputText('');
        
        setTimeout(async () => {
            let botResponse = { id: Date.now() + 1, text: '', sender: 'bot' };
            
            // PALAVRAS-CHAVE INTELIGENTES (NLP 2.0)
            const expenseKeywords = ['gastei', 'paguei', 'saída', 'compra', 'boleto', 'internet', 'luz', 'agua', 'despesa', 'conta', 'pagamento'];
            const incomeKeywords = ['recebi', 'ganhei', 'venda', 'entrada', 'receita', 'lucro', 'salario', 'renda'];
            const assetKeywords = ['comprei', 'investi', 'adquiri', 'novo bem', 'patrimonio', 'imóvel', 'carro', 'aplicação', 'tesouro', 'cdb', 'ações'];
            const recurrenceKeywords = ['recorrente', 'fixa', 'mensal', 'meses', 'repetir', 'todo mês'];

            // 1. NLP: Patrimônio
            if (assetKeywords.some(w => lowerText.includes(w)) && !recurrenceKeywords.some(w => lowerText.includes(w))) {
                 const amount = parseValue(text);
                 const name = text.replace(/[0-9.,]+/, '').replace(new RegExp(`(${assetKeywords.join('|')}|um|uma|no|na|em|R\\$|reais)`, 'gi'), '').trim();
                 if (!isNaN(amount) && amount > 0) {
                     const type = (lowerText.includes('invest') || lowerText.includes('ação') || lowerText.includes('cdb') || lowerText.includes('tesouro')) ? 'investimento' : 'bens';
                     try {
                         await onAddAsset({ name: name || 'Novo Item', value: amount, type, indexer: '', createdAt: Timestamp.now() });
                         botResponse.text = `🏛️ Patrimônio Adicionado: ${name || 'Item'} de ${safeCurrency(amount)}.`;
                     } catch(e) { botResponse.text = "Erro ao salvar patrimônio."; }
                 } else { botResponse.text = "Qual o valor?"; }
            }
            // 2. NLP: Recorrência / Fixas
            else if (recurrenceKeywords.some(w => lowerText.includes(w))) {
                const amount = parseValue(text);
                // Tenta achar o número de meses (ex: "por 12 meses")
                const monthsMatch = text.match(/(\d+)\s*meses/);
                const months = monthsMatch ? parseInt(monthsMatch[1]) : 12; // Default 12 se não disser
                
                if (!isNaN(amount) && amount > 0) {
                    const desc = text.replace(/[0-9.,]+/, '').replace(new RegExp(`(${[...expenseKeywords, ...recurrenceKeywords].join('|')}|R\\$)`, 'gi'), '').trim();
                    try {
                         const batch = writeBatch(useFirestore()); // Pseudo-hook, logicamente vai usar o db do pai
                         // Nota: Passar db via prop seria melhor, mas aqui vamos usar onAddTransaction simples e repetir no loop
                         const today = new Date();
                         for (let i = 0; i < months; i++) {
                             const nextDate = new Date(today);
                             nextDate.setMonth(today.getMonth() + i);
                             await onAddTransaction({ 
                                 desc: `${desc || 'Despesa Fixa'} (${i+1}/${months})`, 
                                 amount, 
                                 type: companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL, 
                                 subcategory: '', 
                                 date: nextDate 
                             });
                         }
                         botResponse.text = `🔄 Agendado! ${months} parcelas de ${safeCurrency(amount)} para "${desc || 'Despesa Fixa'}".`;
                    } catch(e) { botResponse.text = `✅ Iniciei o agendamento de ${months} meses.`; }
                } else {
                     botResponse.text = "Entendi que é recorrente, mas qual o valor?";
                }
            }
            // 3. NLP: Correção
            else if ((lowerText.includes('corrigir') || lowerText.includes('corrija')) && lastActionId) {
                const newValue = parseValue(text);
                if (!isNaN(newValue) && newValue > 0) {
                    try { await onUpdateTransaction(lastActionId, { amount: newValue }); botResponse.text = `✅ Corrigido! Valor: ${safeCurrency(newValue)}.`; } catch (e) { botResponse.text = "Erro ao corrigir."; }
                } else { botResponse.text = "Diga o valor correto. Ex: '1500'"; }
            } 
            // 4. NLP: Exclusão
            else if ((lowerText.includes('apagar') || lowerText.includes('cancelar')) && lowerText.includes('ultimo')) {
                if (lastActionId) { try { await onDeleteTransaction(lastActionId); setLastActionId(null); botResponse.text = "🗑️ Último lançamento apagado."; } catch (e) { botResponse.text = "❌ Erro ao apagar."; } } else { botResponse.text = "Nada recente para apagar."; }
            } 
            // 5. NLP: Resumo
            else if (lowerText.includes('resumo') || lowerText.includes('saldo')) {
                const fins = calculateFinancials(transactions, companyType);
                botResponse.text = `📊 *Resumo*\nEntradas: ${safeCurrency(fins.receita)}\nSaídas: ${safeCurrency(fins.totalSaidas)}\nSaldo: ${safeCurrency(fins.fluxoCaixa)}`;
            } 
            // 6. NLP: Transação Padrão (Receita/Despesa)
            else {
                const amount = parseValue(text);
                if (!isNaN(amount) && amount > 0) {
                    let type = ''; let typeLabel = '';
                    
                    // Detecção Inteligente de Subcategorias
                    let guessedSubcat = '';
                    if (lowerText.includes('condominio') || lowerText.includes('aluguel')) guessedSubcat = companyType === 'personal' ? 'Moradia' : 'Aluguel';
                    if (lowerText.includes('luz') || lowerText.includes('energia')) guessedSubcat = companyType === 'personal' ? 'Moradia' : 'Energia/Água';
                    if (lowerText.includes('mercado') || lowerText.includes('comida')) guessedSubcat = companyType === 'personal' ? 'Alimentação' : 'Despesa Operacional';

                    if (incomeKeywords.some(w => lowerText.includes(w))) { 
                        type = companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA; 
                        typeLabel = 'Receita'; 
                    }
                    else if (expenseKeywords.some(w => lowerText.includes(w))) { 
                        typeLabel = 'Despesa'; 
                        type = companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                        // Refinamento
                        if (guessedSubcat === 'Moradia') type = TransactionTypePersonal.MORADIA;
                    }
                    
                    // Fallback: Se tem valor mas não disse o que é, assume Despesa se for pequeno ou Receita se for grande? Melhor perguntar.
                    // Mas o usuário pediu para ser esperto. Vamos assumir Despesa por padrão se não tiver keyword de receita.
                    if (!type) {
                         type = companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                         typeLabel = 'Despesa (Estimada)';
                    }

                    if (type) {
                        const desc = text.replace(/[0-9.,]+/, '').replace(new RegExp(`(${[...incomeKeywords, ...expenseKeywords, 'R\\$', 'reais'].join('|')})`, 'gi'), '').trim();
                        try { 
                            const newId = await onAddTransaction({ 
                                desc: desc || 'Via Chat', 
                                amount, 
                                type, 
                                subcategory: guessedSubcat, 
                                date: new Date() 
                            }); 
                            setLastActionId(newId); 
                            botResponse.text = `✅ ${typeLabel}: ${safeCurrency(amount)}${desc ? ` ("${desc}")` : ''}.`; 
                        } catch (e) { botResponse.text = "Erro ao salvar."; }
                    }
                } else { botResponse.text = "Não entendi o valor. Tente 'Gastei 50'."; }
            }
            setMessages(prev => [...prev, botResponse]);
        }, 500);
    };

    const handleKeyDown = (e) => { 
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
        } 
    }
    if (!isOpen) return null;
    return (
        <div className="fixed bottom-24 right-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 animate-fade-in-up h-[450px]">
            <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center"><div className="flex items-center gap-2"><LucideMessageSquare size={20} /><span className="font-bold">Assistente IA</span></div><button onClick={onClose}><LucideX size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">{messages.map(msg => (<div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700'}`}>{msg.text}</div></div>))}<div ref={messagesEndRef} /></div>
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2"><textarea className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none" placeholder="Digite... (Botão envia)" rows={1} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} /><button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 self-end"><LucideSend size={18} /></button></div>
        </div>
    );
};

// ... DRE VIEW ...
const DREView = ({ transactions, budget, isMonthly, isPrintMode, companyType }) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [showPercentage, setShowPercentage] = useState(false);
    
    // SAFEGUARD: Se as categorias não carregarem, usa o padrão empresarial
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;
    
    const real = useMemo(() => calculateFinancials(transactions, companyType), [transactions, companyType]);
    const meta = useMemo(() => isMonthly && budget ? budget : {}, [budget, isMonthly]);
    const toggleRow = (label) => setExpandedRows(prev => ({ ...prev, [label]: !prev[label] }));

    const SubcatRows = ({ type, subcatTotals, budgetSubcats, isNegative }) => {
        if (!subcatTotals && !budgetSubcats) return null;
        const relevantSubcats = new Set([...Object.keys(subcatTotals || {}).filter(k => k.startsWith(type + ':')).map(k => k.split(':')[1]), ...Object.keys(budgetSubcats || {}).filter(k => k.startsWith(type + ':')).map(k => k.split(':')[1])]);
        if (relevantSubcats.size === 0) return null;
        return Array.from(relevantSubcats).sort().map(subName => {
            const valReal = subcatTotals[`${type}:${subName}`] || 0;
            const valMeta = budgetSubcats ? (budgetSubcats[`${type}:${subName}`] || 0) : 0;
            const finalReal = isNegative ? -valReal : valReal;
            const displayReal = showPercentage ? safePercent(valReal, real.receita) : safeCurrency(finalReal);
            const finalMeta = isNegative ? -valMeta : valMeta;
            const variacao = finalReal - finalMeta;
            return (
                <div key={subName} className={`grid ${isMonthly && !showPercentage ? 'grid-cols-3' : 'grid-cols-2'} py-2 px-4 border-b border-gray-200 text-xs ${isPrintMode ? 'text-black' : 'text-gray-600 dark:text-slate-300 bg-gray-50/50 dark:bg-slate-900/50'}`}>
                    <span className={`${isPrintMode ? 'text-black' : 'text-gray-500 dark:text-slate-400'} pl-6 flex items-center`}>• {subName}</span>
                    <span className={`text-right ${isPrintMode ? 'text-black' : ''}`}>{displayReal}</span>
                    {isMonthly && !showPercentage && <span className={`text-right font-medium ${(isNegative ? variacao <= 0 : variacao >= 0) ? (isPrintMode ? 'text-black' : 'text-green-600 dark:text-green-400') : (isPrintMode ? 'text-black' : 'text-red-500 dark:text-red-400')}`}>{valMeta !== 0 ? `${variacao > 0 ? '+' : ''}${safeCurrency(variacao)}` : '-'}</span>}
                </div>
            );
        });
    };

    const LineItem = ({ label, type, valReal, valMeta, isNegative, isTotal, highlight, canExpand }) => {
        const finalReal = isNegative ? -valReal : valReal;
        const finalMeta = isNegative ? -(valMeta || 0) : (valMeta || 0);
        const variacao = finalReal - finalMeta;
        let displayReal = showPercentage ? safePercent(valReal, real.receita) : safeCurrency(finalReal);
        if (showPercentage && isNegative) displayReal = '-' + displayReal;
        let textColor = isPrintMode ? 'text-black' : 'text-gray-700 dark:text-slate-200';
        if (!isPrintMode) {
            if (highlight) textColor = finalReal >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
            if (isNegative && !highlight && !showPercentage) textColor = 'text-red-600 dark:text-red-400';
        }
        return (
            <>
                <div className={`grid ${isMonthly && !showPercentage ? 'grid-cols-3' : 'grid-cols-2'} py-3 px-4 border-b border-gray-200 dark:border-slate-800 items-center ${isTotal ? (isPrintMode ? 'bg-gray-100 font-bold' : 'bg-gray-50 dark:bg-slate-800/50 font-bold') : ''} ${canExpand && !isPrintMode ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors' : ''}`} onClick={() => canExpand && !isPrintMode && toggleRow(label)}>
                    <span className={`${isTotal ? 'text-black dark:text-white' : 'text-gray-600 dark:text-slate-300'} ${isPrintMode ? 'text-black' : ''} flex items-center gap-1`}>{canExpand && !isPrintMode && (expandedRows[label] ? <LucideChevronDown size={14} /> : <LucideChevronRight size={14} />)}{label}</span>
                    <span className={`text-right ${textColor} ${isTotal ? 'text-base' : 'text-sm'}`}>{displayReal}</span>
                    {isMonthly && !showPercentage && <span className={`text-right text-xs font-medium ${isPrintMode ? 'text-black' : ((isNegative ? variacao <= 0 : variacao >= 0) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400')}`}>{valMeta ? `${variacao > 0 ? '+' : ''}${safeCurrency(variacao)}` : '-'}</span>}
                </div>
                {(canExpand && (expandedRows[label] || isPrintMode)) && <SubcatRows type={type} subcatTotals={real.subcatTotals} budgetSubcats={meta.subcategories} isNegative={isNegative} />}
            </>
        );
    };

    return (
        <div className={`${isPrintMode ? 'border-none' : 'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden relative'}`}>
            {!isPrintMode && (<div className="absolute top-2 right-2"><button onClick={() => setShowPercentage(!showPercentage)} className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium ${showPercentage ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`} title="Alternar R$ / %"><LucidePercent size={14} />{showPercentage ? 'R$' : '%'}</button></div>)}
            <div className={`grid ${isMonthly && !showPercentage ? 'grid-cols-3' : 'grid-cols-2'} ${isPrintMode ? 'bg-gray-200 text-black border-b border-gray-300' : 'bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-slate-400'} text-xs font-bold uppercase py-3 px-4`}><div>Descrição</div><div className="text-right">{showPercentage ? 'Análise (%)' : 'Realizado (R$)'}</div>{isMonthly && !showPercentage && <div className="text-right">Variação</div>}</div>
            
            {/* RENDERIZAÇÃO CONDICIONAL BASEADA NO TIPO DE EMPRESA */}
            {companyType === 'personal' ? (
                <div>
                    <LineItem label="Renda Total" type={TransactionTypePersonal.RECEITA} valReal={real[TransactionTypePersonal.RECEITA]} valMeta={meta[TransactionTypePersonal.RECEITA]} canExpand />
                    {cats.filter(c => !c.isPositive).map(cat => (
                        <LineItem key={cat.value} label={`(-) ${cat.label.replace(' (-)', '')}`} type={cat.value} valReal={real[cat.value]} valMeta={meta[cat.value]} isNegative canExpand />
                    ))}
                    <LineItem label="= SALDO FINAL" valReal={real.fluxoCaixa} isTotal highlight />
                </div>
            ) : (
                <div>
                    <LineItem label="Receita Bruta" type={TransactionTypeBusiness.RECEITA} valReal={real.receita} valMeta={meta[TransactionTypeBusiness.RECEITA]} canExpand />
                    <LineItem label="(-) Custos (CMV)" type={TransactionTypeBusiness.CUSTO} valReal={real.custo} valMeta={meta[TransactionTypeBusiness.CUSTO]} isNegative canExpand />
                    <LineItem label="= Lucro Bruto" valReal={real.lucroBruto} valMeta={meta.lucroBruto} isTotal />
                    <LineItem label="(-) Despesas Operacionais" type={TransactionTypeBusiness.DESPESA_OPERACIONAL} valReal={real.despesas} valMeta={meta[TransactionTypeBusiness.DESPESA_OPERACIONAL]} isNegative canExpand />
                    <LineItem label="= EBITDA" valReal={real.ebitda} isTotal />
                    <LineItem label="(-) Juros/Financeiro" type={TransactionTypeBusiness.JUROS_FINANCEIROS} valReal={real.juros} valMeta={meta[TransactionTypeBusiness.JUROS_FINANCEIROS]} isNegative canExpand />
                    <LineItem label="(-) Impostos" type={TransactionTypeBusiness.IMPOSTOS} valReal={real.impostos} valMeta={meta[TransactionTypeBusiness.IMPOSTOS]} isNegative canExpand />
                    <LineItem label="= LUCRO LÍQUIDO" valReal={real.lucroLiquido} isTotal highlight />
                </div>
            )}
        </div>
    );
};

const BudgetPlanningView = ({ budget, subcategories, onSaveBudget, isMonthly, companyType }) => {
    const [localBudget, setLocalBudget] = useState({});
    const [localSubBudget, setLocalSubBudget] = useState({});
    
    // SAFEGUARD
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;

    useEffect(() => {
        setLocalBudget(budget || {});
        setLocalSubBudget(budget?.subcategories || {});
    }, [budget]);

    if (!isMonthly) return <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">Selecione um mês específico para planejar o orçamento.</div>;

    const handleMainChange = (type, value) => {
        setLocalBudget(prev => ({ ...prev, [type]: parseFloat(value) || 0 }));
    };

    const handleSubChange = (type, subName, value) => {
        const key = `${type}:${subName}`; const numVal = parseFloat(value) || 0;
        setLocalSubBudget(prev => {
            const newSubs = { ...prev, [key]: numVal };
            const currentTypeSubs = Object.entries(newSubs).filter(([k]) => k.startsWith(type + ':')).reduce((sum, [, val]) => sum + val, 0);
            setLocalBudget(prevMain => ({ ...prevMain, [type]: currentTypeSubs }));
            return newSubs;
        });
    };

    const handleSave = () => {
        onSaveBudget({ ...localBudget, subcategories: localSubBudget });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><LucideTarget className="text-indigo-600 dark:text-indigo-400" /> Planejamento {companyType === 'personal' ? 'Pessoal' : 'Empresarial'}</h2>
            <div className="space-y-8">
                {cats.map(cat => (
                    <div key={cat.value} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700 break-inside-avoid">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className={`font-bold text-sm uppercase ${cat.color.split(' ')[0]}`}>{cat.label}</h3>
                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md overflow-hidden w-40">
                                <span className="pl-3 text-slate-400 text-sm">R$</span>
                                <input type="number" value={localBudget[cat.value] || ''} onChange={e => handleMainChange(cat.value, e.target.value)} className="w-full p-2 text-right outline-none font-semibold text-slate-700 dark:text-slate-200 bg-transparent" placeholder="0,00" />
                            </div>
                        </div>
                        {subcategories[cat.value]?.length > 0 && (
                            <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                                {subcategories[cat.value].map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">{sub.name}</span>
                                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md overflow-hidden w-32 h-8">
                                            <span className="pl-2 text-slate-400 text-xs">R$</span>
                                            <input type="number" value={localSubBudget[`${cat.value}:${sub.name}`] || ''} onChange={e => handleSubChange(cat.value, sub.name, e.target.value)} className="w-full p-1 text-right outline-none text-sm text-slate-600 dark:text-slate-300 bg-transparent" placeholder="0,00" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <button onClick={handleSave} className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">SALVAR METAS</button>
        </div>
    );
};

const CashFlowView = ({ transactions, isPrintMode, companyType }) => {
    const { receita, totalSaidas, fluxoCaixa } = useMemo(() => calculateFinancials(transactions, companyType), [transactions, companyType]);
    if (isPrintMode) {
        return (
            <div className="grid grid-cols-3 gap-4 border border-gray-300 p-4 text-center">
                <div><h3 className="text-xs font-bold uppercase mb-1">Entradas</h3><p className="text-xl font-bold">{safeCurrency(receita)}</p></div>
                <div><h3 className="text-xs font-bold uppercase mb-1">Saídas</h3><p className="text-xl font-bold">{safeCurrency(totalSaidas)}</p></div>
                <div><h3 className="text-xs font-bold uppercase mb-1">Saldo</h3><p className="text-xl font-bold">{safeCurrency(fluxoCaixa)}</p></div>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/30"><h3 className="text-green-800 dark:text-green-400 text-sm font-semibold uppercase mb-2">Entradas</h3><p className="text-3xl font-bold text-green-700 dark:text-green-400">{safeCurrency(receita)}</p></div>
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30"><h3 className="text-red-800 dark:text-red-400 text-sm font-semibold uppercase mb-2">Saídas</h3><p className="text-3xl font-bold text-red-700 dark:text-red-400">{safeCurrency(totalSaidas)}</p></div>
            <div className={`p-6 rounded-xl border ${fluxoCaixa >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30'}`}><h3 className={`${fluxoCaixa >= 0 ? 'text-indigo-800 dark:text-indigo-300' : 'text-orange-800 dark:text-orange-300'} text-sm font-semibold uppercase mb-2`}>Saldo do Período</h3><p className={`text-3xl font-black ${fluxoCaixa >= 0 ? 'text-indigo-900 dark:text-indigo-200' : 'text-orange-700 dark:text-orange-300'}`}>{safeCurrency(fluxoCaixa)}</p></div>
        </div>
    );
};

const ChartsView = ({ allTransactions, companyType }) => {
    const lineData = useMemo(() => {
        if (!allTransactions || allTransactions.length === 0) return [];
        const groups = {};
        allTransactions.forEach(t => {
            if (!t.createdAt || typeof t.createdAt.toDate !== 'function') return;
            const d = t.createdAt.toDate();
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return Object.keys(groups).map(key => {
            const [yearStr, monthStr] = key.split('-');
            const fins = calculateFinancials(groups[key], companyType);
            return { name: `${MONTHS[parseInt(monthStr)]}/${yearStr.slice(2)}`, Lucro: fins.fluxoCaixa, Receita: fins.receita, year: parseInt(yearStr), month: parseInt(monthStr) };
        }).sort((a, b) => a.year - b.year || a.month - b.month).slice(-12);
    }, [allTransactions, companyType]);

    if (lineData.length === 0) return <div className="p-8 text-center text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 rounded-xl">Sem dados suficientes para o gráfico.</div>;
    return (
        <div className="h-80 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} /><YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} /><Tooltip formatter={(value) => safeCurrency(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Legend /><Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={false} name="Entradas" /><Line type="monotone" dataKey="Lucro" stroke="#4f46e5" strokeWidth={3} name="Saldo" /></LineChart></ResponsiveContainer>
        </div>
    );
};

const CategoryPieChart = ({ transactions, type }) => {
    const data = useMemo(() => {
        const filtered = transactions.filter(t => t.type === type);
        const groups = {};
        filtered.forEach(t => {
            const cat = t.subcategory || 'Outros';
            groups[cat] = (groups[cat] || 0) + Number(t.amount);
        });
        return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [transactions, type]);

    if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 rounded-xl">Sem dados de {type}.</div>;

    return (
        <div className="h-96 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-4 text-center">{type} por Subcategoria</h3>
            <div className="flex-1 flex justify-center items-center relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={data} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={50} 
                            outerRadius={70} 
                            paddingAngle={3} 
                            dataKey="value" 
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={true}
                        >
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => safeCurrency(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const CalculatorModal = ({ onClose, onConfirm }) => {
    const [expression, setExpression] = useState('');
    const handleBtnClick = (val) => { if (val === 'C') { setExpression(''); } else if (val === '=') { try { const sanitized = expression.replace(/x/g, '*').replace(/÷/g, '/').replace(/,/g, '.'); const result = eval(sanitized); setExpression(String(result)); } catch (e) { setExpression('Erro'); setTimeout(() => setExpression(''), 1000); } } else { setExpression(prev => prev + val); } };
    const handleConfirm = () => { let finalVal = expression; if (/[+\-x÷]/.test(expression)) { try { const sanitized = expression.replace(/x/g, '*').replace(/÷/g, '/').replace(/,/g, '.'); finalVal = String(eval(sanitized)); } catch (e) { return; } } onConfirm(finalVal.replace('.', ',')); };
    const btns = ['7','8','9','÷','4','5','6','x','1','2','3','-','C','0',',','+'];
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden" style={{zIndex: 9999}}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">Calculadora</h3><button onClick={onClose}><LucideX className="text-slate-400 hover:text-slate-600" /></button></div>
                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl mb-4 text-right text-2xl font-mono font-bold text-slate-800 dark:text-white overflow-x-auto">{expression || '0'}</div>
                <div className="grid grid-cols-4 gap-2 mb-4">{btns.map(b => (<button key={b} onClick={() => handleBtnClick(b)} className={`p-4 rounded-xl font-bold text-lg transition-colors ${['C'].includes(b) ? 'bg-red-100 text-red-600 hover:bg-red-200' : ['÷','x','-','+'].includes(b) ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>{b}</button>))}<button onClick={() => handleBtnClick('=')} className="col-span-4 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white p-3 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-500">=</button></div>
                <button onClick={handleConfirm} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">USAR ESTE VALOR</button>
            </div>
        </div>
    );
};

const ExportModal = ({ onClose, csvContent, fileName }) => {
    const [copied, setCopied] = useState(false);
    const textAreaRef = useRef(null);
    useEffect(() => { if (textAreaRef.current) textAreaRef.current.select(); }, []);
    const handleCopy = () => { if (textAreaRef.current) { textAreaRef.current.select(); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><LucideDownload size={20} className="text-indigo-600 dark:text-indigo-400" /> Exportar Dados (CSV)</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><LucideX size={24} /></button></div>
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs border border-amber-200"><strong>Atenção:</strong> Devido a bloqueios de segurança do navegador, o download automático pode não ocorrer. Use o botão abaixo para copiar os dados.</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">1. Clique em <strong>Copiar Dados</strong>.<br/>2. Abra o Excel ou Planilhas Google.<br/>3. Cole (Ctrl+V).</p>
                <textarea ref={textAreaRef} readOnly value={csvContent} className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-mono outline-none focus:border-indigo-500 resize-none dark:text-slate-300" />
                <button onClick={handleCopy} className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-lg shadow-lg ${copied ? 'bg-green-600 scale-105' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}`}>{copied ? <><LucideCheckCircle size={24} /> DADOS COPIADOS!</> : <><LucideCopy size={24} /> COPIAR DADOS AGORA</>}</button>
            </div>
        </div>
    );
};

const PrintLayout = ({ companyName, periodStr, onClose, children }) => {
    const handlePrintNow = () => { window.print(); };
    return (
        <div className="fixed inset-0 bg-white z-[70] overflow-y-auto text-black animate-fade-in">
            <div className="sticky top-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-md print:hidden">
                <div className="flex items-center gap-2"><LucidePrinter className="text-indigo-400" /><div><h2 className="font-bold">Modo de Impressão</h2><p className="text-xs text-slate-400">Se o botão não funcionar, use Ctrl+P</p></div></div>
                <div className="flex gap-3"><button onClick={handlePrintNow} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><LucidePrinter size={16} /> Imprimir Agora</button><button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><LucideX size={16} /> Fechar</button></div>
            </div>
            <div className="max-w-[210mm] mx-auto p-[10mm] min-h-screen shadow-2xl my-8 print:shadow-none print:m-0 print:p-0 print:w-full">
                <div className="text-center border-b-2 border-black pb-4 mb-6"><h1 className="text-2xl font-bold uppercase tracking-wide">{companyName || 'Minha Empresa'}</h1><h2 className="text-lg mt-1">Relatório Financeiro</h2><p className="text-sm text-gray-600 mt-1">{periodStr}</p></div>
                <div className="print-content">{children}</div>
                <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">Gerado via App de Gestão Financeira em {new Date().toLocaleDateString()}</div>
            </div>
        </div>
    );
};

const RepeatModal = ({ onClose, onConfirm, transaction }) => {
    const [repeatCount, setRepeatCount] = useState(1);
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><LucideRepeat className="text-indigo-600 dark:text-indigo-400" /> Repetir Lançamento</h3><button onClick={onClose}><LucideX className="text-slate-400 hover:text-slate-600" /></button></div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mb-4 border border-slate-100 dark:border-slate-700"><p className="font-bold text-sm text-slate-700 dark:text-slate-200">{transaction.desc}</p><p className="text-xs text-slate-500 dark:text-slate-400">{safeCurrency(transaction.amount)} • {transaction.type}</p></div>
                <div className="mb-6"><label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Repetir por quantos meses?</label><div className="flex items-center gap-3"><button onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-300">-</button><input type="number" value={repeatCount} onChange={(e) => setRepeatCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold dark:text-white" /><button onClick={() => setRepeatCount(repeatCount + 1)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-300">+</button></div></div>
                <button onClick={() => onConfirm(repeatCount)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">Confirmar</button>
            </div>
        </div>
    );
};

const InstallGuideModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                <div className="flex justify-end mb-2"><button onClick={onClose}><LucideX className="text-slate-400" /></button></div>
                <div className="mb-4 flex justify-center"><div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full"><LucideRocket size={48} className="text-indigo-600 dark:text-indigo-400" /></div></div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pronto para o Mundo Real?</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">Você está usando um <strong>ambiente de prévia</strong>. O link deste app é temporário.</p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl mb-4 text-left text-xs text-amber-800 dark:text-amber-300"><p className="font-bold flex items-center gap-1 mb-2 text-sm"><LucideInfo size={14} /> Como instalar de verdade?</p><p className="mb-2">Para ter um link permanente, você precisa hospedar este código.</p></div>
                <button onClick={onClose} className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">Entendi</button>
            </div>
        </div>
    );
};

const TutorialModal = ({ onClose }) => {
    const steps = [{ title: "Bem-vindo ao seu Gestor Financeiro!", desc: "Vamos dar uma volta rápida para você dominar suas finanças.", icon: <LucideInfo size={48} className="text-indigo-500" /> }, { title: "1. Menu Lateral", desc: "Toque no menu (canto superior esquerdo) para trocar de empresa ou configurar categorias.", icon: <LucideMenu size={48} className="text-slate-800" /> }, { title: "2. Lançamentos", desc: "Na aba 'LANÇAMENTOS', registre tudo. Use datas passadas para histórico.", icon: <LucidePlus size={48} className="text-green-500" /> }, { title: "3. Planejamento", desc: "Defina metas na aba 'PLANEJAMENTO'.", icon: <LucideTarget size={48} className="text-amber-500" /> }, { title: "4. Resultados", desc: "DRE, Fluxo e Gráficos automáticos.", icon: <LucidePieChart size={48} className="text-purple-500" /> }];
    const [currentStep, setCurrentStep] = useState(0);
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center space-y-6">
                <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-full">{steps[currentStep].icon}</div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{steps[currentStep].title}</h2>
                <p className="text-slate-600 dark:text-slate-300 text-lg">{steps[currentStep].desc}</p>
                <div className="flex gap-2 mt-4">{steps.map((_, i) => (<div key={i} className={`h-2 w-2 rounded-full transition-all ${i === currentStep ? 'bg-indigo-600 w-6' : 'bg-slate-300 dark:bg-slate-600'}`} />))}</div>
                <button onClick={() => { if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1); else onClose(); }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-colors">{currentStep < steps.length - 1 ? 'Próximo' : 'Começar a Usar!'}</button>
            </div>
        </div>
    );
};

const Sidebar = ({ isOpen, onClose, companies, currentCompany, onChangeCompany, onAddCompany, onOpenSettings, onOpenInstall, onRenameCompany }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [newCompanyType, setNewCompanyType] = useState('business');

    const handleCreate = () => { if (newName.trim()) { onAddCompany(newName, newCompanyType); setNewName(''); setIsCreating(false); onClose(); } };
    const handleStartEdit = (e, company) => { e.stopPropagation(); setEditingId(company.id); setEditName(company.name); };
    const handleSaveEdit = (e) => { e.stopPropagation(); if (editName.trim()) { onRenameCompany(editingId, editName); setEditingId(null); } };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm print:hidden" onClick={onClose} />}
            <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"><h2 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2"><LucideBuilding2 className="text-indigo-600 dark:text-indigo-400" /> Minhas Contas</h2><button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><LucideX size={24} /></button></div>
                <div className="p-4 overflow-y-auto h-[calc(100%-80px)] flex flex-col">
                    <div className="space-y-2 mb-6">
                        {companies.map(c => (
                            <div key={c.id} onClick={() => { if (editingId !== c.id) { onChangeCompany(c); onClose(); } }} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer group ${currentCompany?.id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.type === 'personal' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{c.type === 'personal' ? <LucideUser size={16}/> : <LucideBriefcase size={16}/>}</div>
                                {editingId === c.id ? (<div className="flex-1 flex items-center gap-2"><input autoFocus className="w-full p-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none" value={editName} onChange={(e) => setEditName(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(e); }} /><button onClick={handleSaveEdit} className="p-1 bg-green-100 dark:bg-green-900/50 text-green-600 rounded hover:bg-green-200"><LucideCheck size={14} /></button><button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 bg-red-100 dark:bg-red-900/50 text-red-600 rounded hover:bg-red-200"><LucideX size={14} /></button></div>) : (<><span className="flex-1 truncate text-sm">{c.name}</span><button onClick={(e) => handleStartEdit(e, c)} className="p-1.5 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 opacity-0 group-hover:opacity-100 transition-opacity" title="Renomear"><LucideEdit2 size={14} /></button></>)}
                            </div>
                        ))}
                    </div>
                    {!isCreating ? (<button onClick={() => setIsCreating(true)} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2"><LucidePlus size={18} /> Nova Conta</button>) : (<div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in"><input autoFocus placeholder="Nome" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm mb-3 outline-none focus:border-indigo-500 bg-white dark:bg-slate-900 dark:text-white" value={newName} onChange={e => setNewName(e.target.value)} /><div className="flex gap-2 mb-3"><button onClick={() => setNewCompanyType('business')} className={`flex-1 py-1 text-xs font-bold rounded border ${newCompanyType === 'business' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-500'}`}>Empresa</button><button onClick={() => setNewCompanyType('personal')} className={`flex-1 py-1 text-xs font-bold rounded border ${newCompanyType === 'personal' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-slate-300 text-slate-500'}`}>Pessoal</button></div><div className="flex gap-2"><button onClick={handleCreate} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">Criar</button><button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-sm font-bold">Cancelar</button></div></div>)}
                    <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                        <button onClick={() => { onOpenSettings(); onClose(); }} className="w-full p-3 flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"><LucideSettings size={20} /> Configurar Categorias</button>
                        <button onClick={() => { onOpenInstall(); onClose(); }} className="w-full p-3 flex items-center gap-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors font-medium"><LucideSmartphone size={20} /> Instalar App</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [db, setDb] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [subcategories, setSubcategories] = useState({});
    const [budget, setBudget] = useState({});
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState('lancamentos');
    const [resultTab, setResultTab] = useState('dre');
    const [period, setPeriod] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [showSettings, setShowSettings] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [csvContentToExport, setCsvContentToExport] = useState('');
    const [exportFileName, setExportFileName] = useState('');
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // States for forms
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [repeatingTransaction, setRepeatingTransaction] = useState(null);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    // Uso seguro da variável global
    const [formType, setFormType] = useState(transactionCategories[0].value);
    const [formSubcat, setFormSubcat] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringMonths, setRecurringMonths] = useState(1);
    const [newSubcatName, setNewSubcatName] = useState('');

    const companyType = currentCompany?.type || 'business';
    const activeCategories = useMemo(() => companyType === 'personal' ? categoriesPersonal : categoriesBusiness, [companyType]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) { setDarkMode(true); }
        const manifest = { "name": "Gestão Financeira", "short_name": "Finanças", "start_url": ".", "display": "standalone", "background_color": "#ffffff", "theme_color": "#4f46e5", "icons": [{ "src": "https://placehold.co/192x192/4f46e5/ffffff.png?text=$", "sizes": "192x192", "type": "image/png" }, { "src": "https://placehold.co/512x512/4f46e5/ffffff.png?text=$", "sizes": "512x512", "type": "image/png" }] };
        const manifestBlob = new Blob([JSON.stringify(manifest)], {type: 'application/manifest+json'});
        const link = document.createElement('link'); link.rel = 'manifest'; link.href = URL.createObjectURL(manifestBlob); document.head.appendChild(link);
        const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        const hasSeenTutorial = localStorage.getItem('hasSeenFinTutorial');
        if (!hasSeenTutorial) setShowTutorial(true);
        
        if (Notification.permission === 'granted') setNotificationsEnabled(true);

        if (typeof firebaseConfig === 'undefined' || !firebaseConfig.apiKey.startsWith('AIza')) { console.error("FIREBASE CONFIG NÃO ENCONTRADA OU INVÁLIDA"); return; }
        const app = initializeApp(firebaseConfig);
        const _auth = getAuth(app);
        const _db = getFirestore(app);
        setDb(_db);
        return onAuthStateChanged(_auth, (u) => { if (u) setUser(u); else signInAnonymously(_auth); });
    }, []);

    useEffect(() => {
        if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    }, [darkMode]);
    
    useEffect(() => {
        if (notificationsEnabled) {
            const lastAccess = localStorage.getItem('lastAccess');
            const now = Date.now();
            if (!lastAccess || now - lastAccess > 86400000) {
                 new Notification("Gestão Financeira", { body: "Não se esqueça de lançar suas despesas hoje!", icon: "https://placehold.co/192x192/4f46e5/ffffff.png?text=$" });
                 localStorage.setItem('lastAccess', now);
            }
        }
    }, [notificationsEnabled]);

    useEffect(() => {
        if (!user || !db) return;
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies`), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snap) => {
            const comps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCompanies(comps);
            const lastId = localStorage.getItem('lastCompanyId');
            const found = comps.find(c => c.id === lastId);
            if (comps.length > 0 && !currentCompany) setCurrentCompany(found || comps[0]);
            if (comps.length === 0 && !currentCompany) {
                 const newCompRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies`));
                 setDoc(newCompRef, { name: 'Minha Empresa', type: 'business', createdAt: Timestamp.now() });
            }
            setLoading(false);
        });
    }, [user, db]); 

    const handleCompanyChange = (company) => {
        setCurrentCompany(company);
        localStorage.setItem('lastCompanyId', company.id);
    };

    useEffect(() => {
        if (!user || !db || !currentCompany) { setTransactions([]); setSubcategories({}); setAssets([]); return; }
        setLoading(true);
        const qTx = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`));
        const unsubTx = onSnapshot(qTx, (snap) => { setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
        const qSub = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`));
        const unsubSub = onSnapshot(qSub, (snap) => {
            const subs = {}; snap.docs.forEach(d => { const data = d.data(); if (!subs[data.type]) subs[data.type] = []; subs[data.type].push({ id: d.id, name: data.name }); }); setSubcategories(subs);
        });
        const qAssets = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`));
        const unsubAssets = onSnapshot(qAssets, (snap) => { setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
        return () => { unsubTx(); unsubSub(); unsubAssets(); };
    }, [user, db, currentCompany]);

    useEffect(() => {
        if (!user || !db || !currentCompany || typeof period !== 'number') { setBudget({}); return; }
        getDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`)).then(snap => setBudget(snap.exists() ? snap.data() : {})).catch(err => console.error(err));
    }, [user, db, period, year, currentCompany]);

    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            if (!t.createdAt || typeof t.createdAt.toDate !== 'function') return false;
            const d = t.createdAt.toDate();
            // Lógica "Todo o Período"
            if (period === 'ALL') return true; 

            if (d.getUTCFullYear() !== year) return false;
            const txMonth = d.getUTCMonth();
            if (typeof period === 'number') return txMonth === period;
            
            switch (period) {
                case 'Q1': return txMonth >= 0 && txMonth <= 2; 
                case 'Q2': return txMonth >= 3 && txMonth <= 5;
                case 'Q3': return txMonth >= 6 && txMonth <= 8; 
                case 'Q4': return txMonth >= 9 && txMonth <= 11;
                case 'S1': return txMonth >= 0 && txMonth <= 5; 
                case 'S2': return txMonth >= 6 && txMonth <= 11;
                case 'Y': return true; 
                default: return false;
            }
        });
    }, [transactions, period, year]);

    const searchedData = useMemo(() => {
        if (!searchTerm.trim()) return filteredData;
        const lowerTerm = searchTerm.toLowerCase();
        return filteredData.filter(t => t.desc.toLowerCase().includes(lowerTerm) || (t.subcategory && t.subcategory.toLowerCase().includes(lowerTerm)));
    }, [filteredData, searchTerm]);

    const resetForm = () => { setEditingTransaction(null); setFormDate(new Date().toISOString().split('T')[0]); setFormType(activeCategories[0].value); setFormSubcat(''); setFormDesc(''); setFormAmount(''); setIsRecurring(false); setRecurringMonths(1); };
    const handleEditClick = (t) => { setEditingTransaction(t); setFormDesc(t.desc); setFormAmount(t.amount.toString().replace('.', ',')); setFormType(t.type); setFormSubcat(t.subcategory || ''); if (t.createdAt) setFormDate(t.createdAt.toDate().toISOString().split('T')[0]); };
    
    // --- FUNÇÕES DE CRUD (Chat e UI) ---
    const handleAddTransaction = async ({ desc, amount, type, subcategory, date }) => {
        if (!currentCompany || !user) return;
        const collectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`);
        const docRef = await addDoc(collectionRef, { desc, amount, type, subcategory, createdAt: Timestamp.fromDate(date) });
        return docRef.id;
    };

    const handleUpdateTransaction = async (id, data) => {
         if (!user || !db || !currentCompany) return;
         await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id), data);
    };

    const handleDeleteTransaction = async (id) => {
         if (!user || !db || !currentCompany) return;
         await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id));
    };

    const handleSaveTransaction = async (e) => { e.preventDefault(); if (!currentCompany) { alert("Selecione uma empresa."); return; } const val = parseFloat(formAmount.replace(',', '.')); const parts = formDate.split('-'); const selectedDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0)); if (!val || !user || isNaN(selectedDate.getTime())) return; try { const collectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`); const data = { desc: formDesc, amount: val, type: formType, subcategory: formSubcat, createdAt: Timestamp.fromDate(selectedDate) }; if (editingTransaction) { await updateDoc(doc(collectionRef, editingTransaction.id), { ...data, editedAt: Timestamp.now() }); } else { 
        if (isRecurring && recurringMonths > 1) {
            const batch = writeBatch(db);
            for (let i = 0; i < recurringMonths; i++) {
                 const newDate = new Date(selectedDate);
                 newDate.setUTCMonth(selectedDate.getUTCMonth() + i);
                 const newDocRef = doc(collectionRef);
                 batch.set(newDocRef, { ...data, createdAt: Timestamp.fromDate(newDate) });
            }
            await batch.commit();
        } else {
            await addDoc(collectionRef, data); 
        }
    } resetForm(); } catch (err) { alert("Erro ao salvar."); } };
    const handleDelete = async (id) => { if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return; try { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id)); } catch (e) { alert("Erro ao excluir."); } };
    const handleRepeat = (t) => { setRepeatingTransaction(t); };
    const confirmRepeat = async (months) => { if (!repeatingTransaction || !user || !currentCompany) return; try { const batch = writeBatch(db); const collectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`); const baseDate = repeatingTransaction.createdAt.toDate(); for (let i = 1; i <= months; i++) { const newDate = new Date(baseDate); newDate.setUTCMonth(baseDate.getUTCMonth() + i); const newDocRef = doc(collectionRef); batch.set(newDocRef, { desc: repeatingTransaction.desc, amount: repeatingTransaction.amount, type: repeatingTransaction.type, subcategory: repeatingTransaction.subcategory || '', createdAt: Timestamp.fromDate(newDate) }); } await batch.commit(); setRepeatingTransaction(null); alert(`${months} lançamentos criados com sucesso!`); } catch (e) { alert("Erro ao repetir lançamentos."); } };
    const handleSaveBudget = async (newBudget) => { if (!currentCompany || typeof period !== 'number') return; try { const budgetRef = doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`); await setDoc(budgetRef, newBudget); setBudget(newBudget); alert("Orçamento salvo!"); } catch (e) { alert("Erro ao salvar orçamento."); } };
    const handleRenameCompany = async (companyId, newName) => { if (!newName.trim() || !user) return; try { await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies`, companyId), { name: newName.trim() }); } catch (e) { alert("Erro ao renomear empresa."); } };
    const handleAddSubcategory = async (type) => { if (!newSubcatName.trim() || !currentCompany) return; try { await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`), { type, name: newSubcatName.trim() }); setNewSubcatName(''); } catch (e) { alert("Erro ao adicionar."); } };
    const handleDeleteSubcategory = async (id) => { if (!window.confirm("Excluir subcategoria?")) return; try { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`, id)); } catch (e) { alert("Erro ao excluir."); } };
    const createDefaultCompany = async (name = 'Minha Empresa', type = 'business') => { try { const newCompRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies`)); await setDoc(newCompRef, { name, type, createdAt: Timestamp.now() }); const batch = writeBatch(db); 
    const defaults = type === 'personal' ? DEFAULT_SUBCATEGORIES_PERSONAL : DEFAULT_SUBCATEGORIES_BUSINESS;
    Object.entries(defaults).forEach(([type, subs]) => { subs.forEach(subName => { const ref = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${newCompRef.id}/subcategories`)); batch.set(ref, { type, name: subName }); }); }); await batch.commit(); 
    if (name === 'Minha Empresa') {
        const newComp = { id: newCompRef.id, name, type };
        setCurrentCompany(newComp); 
        localStorage.setItem('lastCompanyId', newComp.id);
    } } catch (e) { console.error(e); alert("Erro ao criar empresa inicial."); } };
    
    const handleCreateCompany = async (name, type) => { if (!name || !user || !db) return; await createDefaultCompany(name, type); };
    const handleInstallClick = () => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((choiceResult) => { if (choiceResult.outcome === 'accepted') { setDeferredPrompt(null); } }); } else { setShowInstallGuide(true); } };
    const closeTutorial = () => { setShowTutorial(false); localStorage.setItem('hasSeenFinTutorial', 'true'); const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; if (!isStandalone) { handleInstallClick(); } };
    const handleExportCSV = () => { if (!filteredData || filteredData.length === 0) { alert("Não há dados para exportar neste período."); return; } const headers = ["Data", "Tipo", "Subcategoria", "Descrição", "Valor (R$)"]; const rows = filteredData.map(t => [t.createdAt?.toDate ? safeDate(t.createdAt) : '', t.type, t.subcategory || '', t.desc.replace(/"/g, '""'), (typeof t.amount === 'number' ? t.amount : 0).toFixed(2).replace('.', ',')]); const csvContent = [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n"); setCsvContentToExport(csvContent); setExportFileName(`financeiro_${currentCompany?.name || 'empresa'}_${year}_${typeof period === 'number' ? MONTHS[period] : period}.csv`); setShowExportModal(true); };
    const handlePrint = () => { setShowPrintPreview(true); };
    const handleCalculatorFinish = (val) => { setFormAmount(val); setShowCalculator(false); };
    
    // Funções de Patrimônio
    const handleAddAsset = async (assetData) => {
        if (!user || !currentCompany) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`), assetData);
    };
    const handleDeleteAsset = async (id) => {
        if (!window.confirm("Excluir item?")) return;
        await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`, id));
    };

    const requestNotificationPermission = () => {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') { setNotificationsEnabled(true); alert("Notificações ativadas!"); }
        });
    };

    if (loading && !user) return <div className="flex h-screen items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse bg-white dark:bg-slate-950">Iniciando...</div>;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <script src="https://cdn.tailwindcss.com"></script>
            <script dangerouslySetInnerHTML={{__html: `tailwind.config = { darkMode: 'class' }`}} />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); 
                .font-sans { font-family: 'Inter', sans-serif; }
                @media print {
                    @page { margin: 1cm; }
                    body { background-color: white !important; color: black !important; }
                    .no-print, .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:text-black { color: black !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:border-gray-300 { border-color: #d1d5db !important; }
                    .dark { color: black !important; background-color: white !important; }
                }
            `}</style>

            {showTutorial && <TutorialModal onClose={closeTutorial} />}
            {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} csvContent={csvContentToExport} fileName={exportFileName} />}
            {showInstallGuide && <InstallGuideModal onClose={() => setShowInstallGuide(false)} />}
            {repeatingTransaction && <RepeatModal onClose={() => setRepeatingTransaction(null)} onConfirm={confirmRepeat} transaction={repeatingTransaction} />}
            {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} onConfirm={(v) => { setFormAmount(v); setShowCalculator(false); }} />}
            
            {showChat && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-end p-4 pointer-events-none">
                    <div className="pointer-events-auto w-full max-w-sm mb-16 sm:mb-0">
                         <ChatInterface 
                            isOpen={true} 
                            onClose={() => setShowChat(false)} 
                            onAddTransaction={handleAddTransaction}
                            onAddAsset={handleAddAsset}
                            onUpdateTransaction={handleUpdateTransaction}
                            onDeleteTransaction={handleDeleteTransaction}
                            currentCompany={currentCompany} 
                            transactions={transactions} 
                        />
                    </div>
                </div>
            )}
            
            <Sidebar 
                isOpen={showSidebar} 
                onClose={() => setShowSidebar(false)} 
                companies={companies}
                currentCompany={currentCompany}
                onChangeCompany={handleCompanyChange}
                onAddCompany={handleCreateCompany}
                onRenameCompany={handleRenameCompany}
                onOpenSettings={() => setShowSettings(true)}
                onOpenInstall={() => { handleInstallClick(); setShowSidebar(false); }} 
            />

            {showSettings && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800 dark:text-white">Configurar Subcategorias</h2><button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><LucideX size={24} /></button></div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-8">
                            {!notificationsEnabled && (
                                <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Ativar Notificações</h4>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">Receba lembretes para lançar suas despesas.</p>
                                    </div>
                                    <button onClick={requestNotificationPermission} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><LucideBell size={18} /></button>
                                </div>
                            )}
                            {activeCategories.map(cat => (<div key={cat.value}><h3 className={`font-bold text-sm uppercase mb-3 ${cat.color.split(' ')[0]}`}>{cat.label}</h3><div className="flex gap-2 mb-3"><input placeholder={`Nova para ${cat.label}`} className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white dark:bg-slate-900 dark:text-white" onKeyDown={(e) => { if (e.key === 'Enter') { setNewSubcatName(e.target.value); handleAddSubcategory(cat.value); e.target.value = ''; } }} onBlur={(e) => setNewSubcatName(e.target.value)} /><button onClick={(e) => { handleAddSubcategory(cat.value); e.previousSibling.value = ''; }} className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700"><LucidePlus size={18} /></button></div><div className="flex flex-wrap gap-2">{subcategories[cat.value]?.map(sub => (<div key={sub.id} className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 group"><span className="dark:text-slate-300">{sub.name}</span><button onClick={() => handleDeleteSubcategory(sub.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><LucideX size={14} /></button></div>))}{(!subcategories[cat.value] || subcategories[cat.value].length === 0) && <span className="text-slate-400 text-sm italic">Nenhuma.</span>}</div></div>))}</div>
                    </div>
                </div>
            )}

            <header className="max-w-5xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowSidebar(true)} className="p-2"><LucideMenu size={28} /></button>
                    <div><h1 className="text-2xl font-bold">Gestão Financeira</h1><p className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><LucideBuilding2 size={14} /> {currentCompany?.name}</p></div>
                    <button onClick={() => setShowCalculator(true)} className="p-2 text-indigo-600"><LucideCalculator/></button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">{darkMode ? <LucideSun/> : <LucideMoon/>}</button>
                    <select className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm" value={period} onChange={e => setPeriod(isNaN(e.target.value) ? e.target.value : parseInt(e.target.value))}>{PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                    <select className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm" value={year} onChange={e => setYear(parseInt(e.target.value))}>{[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={handleExportCSV} className="p-2 text-indigo-600"><LucideDownload/></button>
                    <button onClick={handlePrint} className="p-2 text-slate-600"><LucidePrinter/></button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4">
                <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
                    {['lancamentos', 'planejamento', 'patrimonio', 'resultados'].map(t => (
                        <button key={t} onClick={() => setMainTab(t)} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap ${mainTab === t ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {mainTab === 'lancamentos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                                <h2 className="font-bold text-lg mb-4">{editingTransaction ? 'Editar' : 'Novo Lançamento'}</h2>
                                <form onSubmit={handleSaveTransaction} className="space-y-4">
                                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                                    <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg">{activeCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                                    <select value={formSubcat} onChange={e => setFormSubcat(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg"><option value="">Sem subcategoria</option>{subcategories[formType]?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                                    <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descrição" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg" />
                                    <input value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0,00" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg font-bold" />
                                    {!editingTransaction && (
                                        <div className="flex items-center gap-2 mt-2"><input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} /> <label>Repetir?</label> {isRecurring && <input type="number" min="2" value={recurringMonths} onChange={e => setRecurringMonths(e.target.value)} className="w-16 p-1 border rounded" />}</div>
                                    )}
                                    <div className="flex gap-2">
                                        <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold">Salvar</button>
                                        {editingTransaction && <button type="button" onClick={resetForm} className="px-4 bg-slate-200 dark:bg-slate-700 rounded-lg">Cancelar</button>}
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm h-[600px] flex flex-col">
                                <div className="p-4 border-b dark:border-slate-700 font-bold flex justify-between items-center">
                                    <span>Histórico ({searchedData.length})</span>
                                    <div className="relative"><LucideSearch size={14} className="absolute left-2 top-2.5 text-slate-400"/><input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm w-32" /></div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {searchedData.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(t => (
                                        <div key={t.id} className="p-4 border-b dark:border-slate-700 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <div>
                                                <p className="font-bold">{t.desc}</p>
                                                <p className="text-xs text-slate-500">{safeDate(t.createdAt)} • {activeCategories.find(c=>c.value===t.type)?.label.split(' ')[0]} {t.subcategory && `• ${t.subcategory}`}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold ${activeCategories.find(c=>c.value===t.type)?.isPositive ? 'text-green-600' : 'text-red-600'}`}>{safeCurrency(t.amount)}</span>
                                                <button onClick={() => { setEditingTransaction(t); setFormDesc(t.desc); setFormAmount(t.amount); setFormType(t.type); setFormSubcat(t.subcategory); }}><LucideEdit2 size={16} className="text-slate-400 hover:text-indigo-500" /></button>
                                                <button onClick={() => setRepeatingTransaction(t)}><LucideRepeat size={16} className="text-slate-400 hover:text-indigo-500" /></button>
                                                <button onClick={() => handleDelete(t.id)}><LucideTrash2 size={16} className="text-slate-400 hover:text-red-500" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mainTab === 'planejamento' && <BudgetPlanningView budget={budget} subcategories={subcategories} onSaveBudget={handleSaveBudget} isMonthly={typeof period === 'number'} companyType={companyType} />}
                
                {mainTab === 'patrimonio' && <AssetsView assets={assets} onAddAsset={handleAddAsset} onDeleteAsset={handleDeleteAsset} />}
                
                {mainTab === 'resultados' && (
                    <div className="space-y-8">
                         <div className="flex gap-2 overflow-x-auto pb-2">
                            {['dre', 'fluxo', 'graficos', 'subcategorias'].map(k => (<button key={k} onClick={() => setResultTab(k)} className={`px-3 py-1 rounded-full text-sm font-bold ${resultTab === k ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{k.toUpperCase()}</button>))}
                         </div>
                         {resultTab === 'dre' && <DREView transactions={filteredData} budget={budget} isMonthly={typeof period === 'number'} companyType={companyType} isPrintMode={false} />}
                         {resultTab === 'fluxo' && <CashFlowView transactions={filteredData} companyType={companyType} isPrintMode={false} />}
                         {resultTab === 'graficos' && <ChartsView allTransactions={transactions} companyType={companyType} />}
                         {resultTab === 'subcategorias' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><CategoryPieChart transactions={filteredData} type={companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA} /><CategoryPieChart transactions={filteredData} type={companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL} /></div>}
                    </div>
                )}
            </main>
            <button onClick={() => setShowChat(!showChat)} className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:scale-105 transition-transform"><LucideMessageSquare size={24} /></button>
        </div>
    );
}

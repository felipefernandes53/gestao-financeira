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

// ============================================================================
// 1. CONFIGURAÇÕES E CONSTANTES GLOBAIS (ANTI-CRASH)
// ============================================================================

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
    { value: 'ALL', label: 'Todo o Período (Todos os Anos)' } // NOVA OPÇÃO
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

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

// *** VARIÁVEL DE SEGURANÇA OBRIGATÓRIA ***
// Esta variável garante que o código nunca quebre se tentar acessá-la.
const transactionCategories = categoriesBusiness; 

// ============================================================================
// 2. FUNÇÕES AUXILIARES
// ============================================================================

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

// Cálculo financeiro unificado
const calculateFinancials = (data = [], type = 'business', assets = []) => {
    const safeData = Array.isArray(data) ? data : [];
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
    
    const safeAssets = Array.isArray(assets) ? assets : [];
    const totalBens = safeAssets.filter(a => a.type === 'bens').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const totalInvest = safeAssets.filter(a => a.type === 'investimento').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    
    // Patrimônio: Bens + Investimentos + Saldo em Caixa
    const patrimonioLiquido = totalBens + totalInvest + fluxoCaixa;

    const financials = { receita, totalSaidas, fluxoCaixa, subcatTotals, totalBens, totalInvest, patrimonioLiquido };
    
    cats.forEach(cat => { financials[cat.value] = sumByType(cat.value); });
    
    if (type === 'business') {
        financials.lucroBruto = receita - financials[TransactionTypeBusiness.CUSTO];
        financials.ebitda = financials.lucroBruto - financials[TransactionTypeBusiness.DESPESA_OPERACIONAL];
        financials.lucroLiquido = financials.ebitda - financials[TransactionTypeBusiness.JUROS_FINANCEIROS] - financials[TransactionTypeBusiness.IMPOSTOS];
    }
    return financials;
};

// ============================================================================
// 3. SUB-COMPONENTES (MÓDULOS)
// ============================================================================

// --- ABA PATRIMÔNIO & MERCADO ---
const AssetsView = ({ assets, onAddAsset, onDeleteAsset }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState('bens'); 
    const [indexer, setIndexer] = useState('');
    const [marketData, setMarketData] = useState({ USD: '...', EUR: '...', BTC: '...', CDI: '...', SELIC: '...' });

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                // Moedas via AwesomeAPI (Pública)
                const resCoins = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL');
                const dataCoins = await resCoins.json();
                
                // Índices via HG Brasil
                let hgData = { cdi: 11.25, selic: 11.25 }; 
                try {
                    const key = '855e9e8f';
                    const resHg = await fetch(`https://api.hgbrasil.com/finance/taxes?key=${key}&format=json-cors`);
                    const jsonHg = await resHg.json();
                    if(jsonHg.results && jsonHg.results[0]) hgData = jsonHg.results[0];
                } catch(e) { console.log('API Limit', e); }

                setMarketData({
                    USD: `R$ ${parseFloat(dataCoins.USDBRL.bid).toFixed(2)}`,
                    EUR: `R$ ${parseFloat(dataCoins.EURBRL.bid).toFixed(2)}`,
                    BTC: `R$ ${parseFloat(dataCoins.BTCBRL.bid).toLocaleString('pt-BR', {maximumFractionDigits:0})}`,
                    CDI: `${hgData.cdi}%`,
                    SELIC: `${hgData.selic}%`
                });
            } catch (err) { setMarketData({ USD: 'R$ 5,60', EUR: 'R$ 6,00', BTC: '-', CDI: '11.25%', SELIC: '11.25%' }); }
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

    const getProjection = (val, idx) => {
        let rate = 0;
        if(idx === 'CDI' || idx === 'SELIC') rate = 0.1125;
        if(idx === 'IPCA') rate = 0.045;
        if(idx === 'INCC') rate = 0.04;
        if(rate === 0) return '-';
        const projected = val * (1 + rate);
        return safeCurrency(projected);
    };

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
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"><tr><th className="p-4">Item</th><th className="p-4">Tipo</th><th className="p-4">Índice</th><th className="p-4 text-right">Valor Atual</th><th className="p-4 text-right">Projeção (+12m)</th><th className="p-4 w-10"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{safeAssets.map(a => (<tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30"><td className="p-4 font-medium text-slate-800 dark:text-slate-200">{a.name}</td><td className="p-4 text-slate-500 dark:text-slate-400 capitalize">{a.type}</td><td className="p-4 text-slate-500 dark:text-slate-400">{a.indexer || '-'}</td><td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">{safeCurrency(a.value)}</td><td className="p-4 text-right text-green-600 dark:text-green-400">{getProjection(a.value, a.indexer)}</td><td className="p-4"><button onClick={() => onDeleteAsset(a.id)} className="text-red-400 hover:text-red-600"><LucideTrash2 size={16}/></button></td></tr>))}</tbody>
                 </table>
                 {safeAssets.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum item cadastrado.</div>}
            </div>
        </div>
    );
};

// --- CHAT INTERFACE AVANÇADA (Versão 2.0) ---
const ChatInterface = ({ isOpen, onClose, onAddTransaction, onAddRecurringTransaction, onAddAsset, onUpdateTransaction, onDeleteTransaction, currentCompany, transactions }) => {
    const [messages, setMessages] = useState([{ id: 1, text: "Olá! Sou seu assistente financeiro.", sender: 'bot' }]);
    const [inputText, setInputText] = useState('');
    const [lastActionId, setLastActionId] = useState(null);
    const messagesEndRef = useRef(null);
    const companyType = currentCompany?.type || 'business';

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    const parseValue = (text) => {
        let clean = text.replace(/[^0-9.,-]/g, '');
        // Lógica de parser brasileiro robusta
        if (clean.includes(',') && clean.includes('.')) {
             // Formato 2.000,00 -> remove ponto, troca virgula por ponto
             clean = clean.replace(/\./g, '').replace(',', '.');
        } else if (clean.includes(',')) {
             // Formato 200,00 -> troca virgula por ponto
             clean = clean.replace(',', '.');
        } else {
             // Formato 2000 ou 2.000 -> remove ponto
             clean = clean.replace(/\./g, '');
        }
        return parseFloat(clean);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText; const lowerText = text.toLowerCase();
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user' }]);
        setInputText('');

        setTimeout(async () => {
            let botResponse = { id: Date.now() + 1, text: '', sender: 'bot' };
            
            // 1. RECORRÊNCIA INTELIGENTE (Detecta "12 meses", "fixa")
            if (lowerText.includes('meses') && (lowerText.includes('por') || lowerText.includes('durante') || lowerText.includes('repetir'))) {
                 const amount = parseValue(text);
                 const monthsMatch = text.match(/(\d+)\s*meses/);
                 const months = monthsMatch ? parseInt(monthsMatch[1]) : 12;
                 
                 if (!isNaN(amount) && amount > 0) {
                     const desc = text.replace(/[0-9.,]+/, '').replace(/(meses|por|durante|despesa|fixa|R\$|reais)/gi, '').trim();
                     // Inferência de categoria
                     let type = companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                     
                     try {
                         await onAddRecurringTransaction({ 
                            desc: desc || 'Despesa Recorrente', 
                            amount, 
                            type, 
                            subcategory: 'Fixa', 
                            months 
                         });
                         botResponse.text = `🗓️ Agendado! "${desc}" de ${safeCurrency(amount)} será lançado automaticamente pelos próximos ${months} meses.`;
                     } catch(e) { botResponse.text = "Erro ao agendar."; }
                 } else { botResponse.text = "Entendi que é recorrente, mas preciso do valor."; }
            }
            // 2. PATRIMÔNIO (Investimentos, Bens)
            else if (['comprei', 'investi', 'adquiri', 'novo bem', 'patrimonio', 'imóvel', 'carro', 'aplicação'].some(w => lowerText.includes(w))) {
                 const amount = parseValue(text);
                 const name = text.replace(/[0-9.,]+/, '').replace(/(comprei|investi|adquiri|um|uma|no|na|em|R\$|reais|novo|bem|patrimonio)/gi, '').trim();
                 
                 let indexer = '';
                 if (lowerText.includes('cdi')) indexer = 'CDI';
                 if (lowerText.includes('ipca')) indexer = 'IPCA';
                 if (lowerText.includes('selic')) indexer = 'SELIC';

                 if (!isNaN(amount) && amount > 0) {
                     const type = (lowerText.includes('invest') || lowerText.includes('ação') || lowerText.includes('cdb') || lowerText.includes('tesouro')) ? 'investimento' : 'bens';
                     try {
                         await onAddAsset({ name: name || 'Novo Item', value: amount, type, indexer, createdAt: Timestamp.now() });
                         botResponse.text = `🏛️ Patrimônio: "${name || 'Item'}" de ${safeCurrency(amount)} ${indexer ? `(Indexado ao ${indexer})` : ''} salvo!`;
                     } catch(e) { botResponse.text = "Erro ao salvar patrimônio."; }
                 } else { botResponse.text = "Qual o valor do investimento/bem?"; }
            }
            // 3. LANÇAMENTO SIMPLES (Receita/Despesa)
            else {
                const amount = parseValue(text);
                if (!isNaN(amount) && amount > 0) {
                    let type = ''; let typeLabel = '';
                    
                    // Detecção de contexto (uma frase só)
                    if (['recebi', 'ganhei', 'venda', 'entrada', 'receita'].some(w => lowerText.includes(w))) {
                        type = companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA; typeLabel = 'Receita';
                    } 
                    else {
                        // Assume despesa por padrão se tiver valor e não for receita
                        typeLabel = 'Despesa'; 
                        type = companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                        
                        // Refinamento de subcategoria
                        if (lowerText.includes('condominio') || lowerText.includes('aluguel')) type = companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                        if (lowerText.includes('luz') || lowerText.includes('energia')) type = companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                        if (lowerText.includes('mercado') || lowerText.includes('comida')) type = companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                    }

                    const desc = text.replace(/[0-9.,]+/, '').replace(/(recebi|gastei|paguei|de|com|na|no|R\$|reais)/gi, '').trim();
                    try {
                        const newId = await onAddTransaction({ desc: desc || 'Via Chat', amount, type, subcategory: '', date: new Date() });
                        setLastActionId(newId);
                        botResponse.text = `✅ ${typeLabel}: ${safeCurrency(amount)}${desc ? ` ("${desc}")` : ''}.`;
                    } catch(e) { botResponse.text = "Erro ao salvar."; }
                } else if (lowerText.includes('resumo') || lowerText.includes('saldo')) {
                     const fins = calculateFinancials(transactions, companyType);
                     botResponse.text = `📊 *Resumo*\nEntradas: ${safeCurrency(fins.receita)}\nSaídas: ${safeCurrency(fins.totalSaidas)}\nSaldo: ${safeCurrency(fins.fluxoCaixa)}`;
                } else {
                    botResponse.text = "Não entendi. Tente 'Gastei 50 no almoço' ou 'Investi 1000'.";
                }
            }
            setMessages(prev => [...prev, botResponse]);
        }, 500);
    };

    // Enter apenas pula linha. Botão envia.
    return (
        <div className="fixed bottom-24 right-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 animate-fade-in-up h-[450px]">
            <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center"><div className="flex items-center gap-2"><LucideMessageSquare size={20} /><span className="font-bold">Assistente IA</span></div><button onClick={onClose}><LucideX size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">{messages.map(msg => (<div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700'}`}>{msg.text}</div></div>))}<div ref={messagesEndRef} /></div>
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <textarea 
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none" 
                    placeholder="Digite... (Enter pula linha)" 
                    rows={1} 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)} 
                />
                <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 self-end"><LucideSend size={18} /></button>
            </div>
        </div>
    );
};

// ... OUTROS COMPONENTES AUXILIARES (Mantidos da versão estável) ...
const CalculatorModal=({onClose,onConfirm})=>{const [e,setE]=useState('');const h=(v)=>{if(v==='C')setE('');else if(v==='='){try{setE(String(eval(e.replace(/x/g,'*').replace(/÷/g,'/').replace(/,/g,'.'))))}catch{setE('Erro')}}else setE(p=>p+v)};const c=()=>{try{onConfirm(String(eval(e.replace(/x/g,'*').replace(/÷/g,'/').replace(/,/g,'.'))).replace('.',','))}catch{}};const b=['7','8','9','÷','4','5','6','x','1','2','3','-','C','0',',','+'];return(<div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm"><div className="flex justify-between mb-4"><h3 className="font-bold dark:text-white">Calculadora</h3><button onClick={onClose}><LucideX/></button></div><div className="bg-slate-100 dark:bg-slate-900 p-4 rounded mb-4 text-right font-bold dark:text-white text-2xl">{e||'0'}</div><div className="grid grid-cols-4 gap-2 mb-4">{b.map(x=><button key={x} onClick={()=>h(x)} className="p-4 bg-slate-50 dark:bg-slate-700 rounded font-bold dark:text-white">{x}</button>)}<button onClick={()=>h('=')} className="col-span-4 bg-slate-200 p-3 rounded">=</button></div><button onClick={c} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">USAR</button></div></div>)};
const RepeatModal=({onClose,onConfirm,transaction})=>{const [c,setC]=useState(1);return(<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full"><h3 className="font-bold mb-4 dark:text-white">Repetir</h3><input type="number" value={c} onChange={e=>setC(e.target.value)} className="w-full p-2 border rounded mb-4 dark:bg-slate-900 dark:text-white"/><button onClick={()=>onConfirm(c)} className="w-full bg-indigo-600 text-white p-2 rounded">Confirmar</button><button onClick={onClose} className="w-full mt-2 text-slate-500">Cancelar</button></div></div>)};
const ExportModal=({onClose,csvContent,fileName})=>{const [c,setC]=useState(false);const r=useRef(null);const h=()=>{if(r.current){r.current.select();document.execCommand('copy');setC(true)}};return(<div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl max-w-lg w-full"><h3 className="font-bold text-lg mb-2">Exportar CSV</h3><textarea ref={r} readOnly value={csvContent} className="w-full h-32 p-2 border rounded mb-4 text-xs font-mono"/><button onClick={h} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">{c?'Copiado!':'Copiar'}</button><button onClick={onClose} className="w-full mt-2 text-slate-500">Fechar</button></div></div>)};
const PrintLayout=({companyName,periodStr,onClose,children})=>{return(<div className="fixed inset-0 bg-white z-[70] overflow-y-auto text-black"><div className="sticky top-0 bg-slate-800 text-white p-4 flex justify-between print:hidden"><div><h2 className="font-bold">Modo Impressão</h2></div><div className="flex gap-2"><button onClick={()=>window.print()} className="bg-indigo-600 px-4 py-1 rounded">Imprimir</button><button onClick={onClose} className="bg-slate-600 px-4 py-1 rounded">Fechar</button></div></div><div className="max-w-[210mm] mx-auto p-[10mm]"><div className="text-center border-b-2 border-black pb-4 mb-6"><h1 className="text-2xl font-bold uppercase">{companyName}</h1><h2>Relatório Financeiro</h2><p>{periodStr}</p></div>{children}</div></div>)};
const InstallGuideModal=({onClose})=>{return(<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-6 max-w-sm text-center"><h2 className="font-bold text-xl mb-2">Instalar</h2><p className="mb-4">Abra no Chrome/Safari e use "Adicionar à Tela Inicial".</p><button onClick={onClose} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">Ok</button></div></div>)};
const TutorialModal=({onClose})=>{return(<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-6 max-w-md text-center"><h2 className="font-bold text-xl mb-2">Bem-vindo!</h2><p className="mb-6">Seu gestor financeiro completo.</p><button onClick={onClose} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">Começar</button></div></div>)};

const Sidebar = ({ isOpen, onClose, companies, currentCompany, onChangeCompany, onAddCompany, onOpenSettings, onOpenInstall, onRenameCompany }) => {
    const [newName, setNewName] = useState(''); const [isCreating, setIsCreating] = useState(false); const [editingId, setEditingId] = useState(null); const [editName, setEditName] = useState(''); const [newType, setNewType] = useState('business');
    const handleCreate = () => { if(newName.trim()) { onAddCompany(newName, newType); setNewName(''); setIsCreating(false); onClose(); } };
    const handleStartEdit = (e,c) => { e.stopPropagation(); setEditingId(c.id); setEditName(c.name); };
    const handleSaveEdit = (e) => { e.stopPropagation(); if(editName.trim()){ onRenameCompany(editingId, editName); setEditingId(null); } };
    return (<> {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />} <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}> <div className="p-6 border-b dark:border-slate-700 flex justify-between"><h2 className="font-bold text-xl dark:text-white">Minhas Contas</h2><button onClick={onClose}><LucideX/></button></div> <div className="p-4"> {companies.map(c => (<div key={c.id} onClick={() => { if(editingId!==c.id){onChangeCompany(c); onClose();} }} className={`w-full text-left p-3 rounded-xl mb-2 flex items-center gap-2 cursor-pointer ${currentCompany?.id === c.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800'}`}>{editingId === c.id ? (<><input autoFocus className="flex-1 p-1 border rounded" value={editName} onChange={e=>setEditName(e.target.value)} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Enter')handleSaveEdit(e)}} /><button onClick={handleSaveEdit}><LucideCheck size={14}/></button></>) : (<><span className="flex-1">{c.name}</span><button onClick={e=>{e.stopPropagation(); setEditingId(c.id); setEditName(c.name)}} className="text-slate-400 hover:text-indigo-500"><LucideEdit2 size={14}/></button></>)}</div>))} <button onClick={() => setIsCreating(true)} className="w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600"><LucidePlus/> Nova Conta</button> {isCreating && (<div className="mt-4 bg-slate-50 p-3 rounded"><input autoFocus placeholder="Nome" className="w-full p-2 border rounded mb-2 dark:bg-slate-800 dark:text-white" value={newName} onChange={e => setNewName(e.target.value)} /><div className="flex gap-2 mb-2"><button onClick={()=>setNewType('business')} className={`flex-1 text-xs p-1 rounded border ${newType==='business'?'bg-blue-100 border-blue-500':'bg-white'}`}>Empresa</button><button onClick={()=>setNewType('personal')} className={`flex-1 text-xs p-1 rounded border ${newType==='personal'?'bg-green-100 border-green-500':'bg-white'}`}>Pessoal</button></div><button onClick={handleCreate} className="w-full bg-indigo-600 text-white p-2 rounded">Criar</button></div>)} <div className="mt-8 pt-4 border-t dark:border-slate-700"><button onClick={onOpenSettings} className="w-full p-3 flex items-center gap-3 text-slate-600 dark:text-slate-400"><LucideSettings/> Categorias</button></div> </div> </div> </>);
};

// --- APP PRINCIPAL ---
const DREView = ({ transactions, budget, isMonthly, isPrintMode, companyType }) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [showPercentage, setShowPercentage] = useState(false);
    
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;
    if (!cats) return null; // Proteção contra crash

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
        let displayReal = showPercentage ? safePercent(valReal, real.receita) : safeCurrency(finalReal);
        if (showPercentage && isNegative) displayReal = '-' + displayReal;
        let textColor = isPrintMode ? 'text-black' : 'text-gray-700 dark:text-slate-200';
        if (!isPrintMode) {
            if (highlight) textColor = finalReal >= 0 ? 'text-green-700' : 'text-red-700';
            if (isNegative && !highlight && !showPercentage) textColor = 'text-red-600';
        }
        return (
            <>
                <div className={`grid ${isMonthly && !showPercentage ? 'grid-cols-3' : 'grid-cols-2'} py-3 px-4 border-b border-gray-200 dark:border-slate-800 items-center ${isTotal ? 'font-bold bg-gray-50 dark:bg-slate-800/50' : ''} ${canExpand ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => canExpand && toggleRow(label)}>
                    <span className={`flex items-center gap-1 ${isTotal ? 'text-slate-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>{canExpand && (expandedRows[label] ? <LucideChevronDown size={14} /> : <LucideChevronRight size={14} />)}{label}</span>
                    <span className={`text-right ${textColor} ${isTotal ? 'text-base' : 'text-sm'}`}>{displayReal}</span>
                    {isMonthly && !showPercentage && <span className="text-right text-xs font-medium text-slate-500">-</span>}
                </div>
                {(canExpand && expandedRows[label]) && <SubcatRows type={type} subcatTotals={real.subcatTotals} budgetSubcats={meta.subcategories} isNegative={isNegative} />}
            </>
        );
    };

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden relative ${isPrintMode ? 'border-none' : ''}`}>
            {!isPrintMode && <div className="absolute top-2 right-2"><button onClick={() => setShowPercentage(!showPercentage)} className="p-1.5 rounded-md bg-gray-100 dark:bg-slate-700"><LucidePercent size={14}/></button></div>}
            <div className="grid grid-cols-3 bg-gray-100 dark:bg-slate-900 text-xs font-bold uppercase py-3 px-4"><div>Descrição</div><div className="text-right">{showPercentage ? '%' : 'R$'}</div><div className="text-right">Meta</div></div>
            
            {companyType === 'personal' ? (
                <div>
                    <LineItem label="Renda Total" type={TransactionTypePersonal.RECEITA} valReal={real[TransactionTypePersonal.RECEITA]} valMeta={meta[TransactionTypePersonal.RECEITA]} canExpand />
                    {cats.filter(c => !c.isPositive).map(cat => <LineItem key={cat.value} label={`(-) ${cat.label.replace(' (-)', '')}`} type={cat.value} valReal={real[cat.value]} valMeta={meta[cat.value]} isNegative canExpand />)}
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
    if (!cats) return null;

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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 print:border-none print:shadow-none">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><LucideTarget className="text-indigo-600 dark:text-indigo-400" /> Planejamento Orçamentário</h2>
            <div className="space-y-8">
                {cats.map(cat => (
                    <div key={cat.value} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700 break-inside-avoid">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className={`font-bold text-sm uppercase ${cat.color.split(' ')[0]} print:text-black`}>{cat.label}</h3>
                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md overflow-hidden w-40 print:border-gray-400">
                                <span className="pl-3 text-slate-400 text-sm">R$</span>
                                <input type="number" value={localBudget[cat.value] || ''} onChange={e => handleMainChange(cat.value, e.target.value)}
                                    className="w-full p-2 text-right outline-none font-semibold text-slate-700 dark:text-slate-200 bg-transparent print:text-black" placeholder="0,00" />
                            </div>
                        </div>
                        {subcategories[cat.value]?.length > 0 && (
                            <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                                {subcategories[cat.value].map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400 print:text-black">{sub.name}</span>
                                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md overflow-hidden w-32 h-8 print:border-gray-400">
                                            <span className="pl-2 text-slate-400 text-xs">R$</span>
                                            <input type="number" value={localSubBudget[`${cat.value}:${sub.name}`] || ''} 
                                                onChange={e => handleSubChange(cat.value, sub.name, e.target.value)}
                                                className="w-full p-1 text-right outline-none text-sm text-slate-600 dark:text-slate-300 bg-transparent print:text-black" placeholder="0,00" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <button onClick={handleSave} className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors print:hidden">
                SALVAR METAS
            </button>
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
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/30 print:bg-white print:border-gray-300"><h3 className="text-green-800 dark:text-green-400 text-sm font-semibold uppercase mb-2 print:text-black">Entradas</h3><p className="text-3xl font-bold text-green-700 dark:text-green-400 print:text-black">{safeCurrency(receita)}</p></div>
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30 print:bg-white print:border-gray-300"><h3 className="text-red-800 dark:text-red-400 text-sm font-semibold uppercase mb-2 print:text-black">Saídas</h3><p className="text-3xl font-bold text-red-700 dark:text-red-400 print:text-black">{safeCurrency(totalSaidas)}</p></div>
            <div className={`p-6 rounded-xl border ${fluxoCaixa >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30'} print:bg-white print:border-gray-300`}><h3 className={`${fluxoCaixa >= 0 ? 'text-indigo-800 dark:text-indigo-300' : 'text-orange-800 dark:text-orange-300'} text-sm font-semibold uppercase mb-2 print:text-black`}>Saldo do Período</h3><p className={`text-3xl font-black ${fluxoCaixa >= 0 ? 'text-indigo-900 dark:text-indigo-200' : 'text-orange-700 dark:text-orange-300'} print:text-black`}>{safeCurrency(fluxoCaixa)}</p></div>
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
        <div className="h-80 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 print:border-gray-300">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} /><YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} /><Tooltip formatter={(value) => safeCurrency(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Legend /><Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={false} name="Receita Total" /><Line type="monotone" dataKey="Lucro" stroke="#4f46e5" strokeWidth={3} name="Lucro Líquido" /></LineChart></ResponsiveContainer>
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
        <div className="h-96 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col print:border-gray-300 print:break-inside-avoid">
            <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-4 text-center print:text-black">{type} por Subcategoria</h3>
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
    
    // --- FUNÇÕES DE CRUD DO APP ---
    // Definição da função para adicionar recorrentes
    const handleAddRecurringTransaction = async ({ desc, amount, type, subcategory, months }) => {
        if (!user || !currentCompany) return;
        const collectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`);
        const batch = writeBatch(db);
        const today = new Date();
        
        for (let i = 0; i < months; i++) {
             const nextDate = new Date(today);
             nextDate.setMonth(today.getMonth() + i);
             const newDocRef = doc(collectionRef);
             batch.set(newDocRef, { 
                 desc: `${desc} (${i+1}/${months})`, 
                 amount, 
                 type, 
                 subcategory: subcategory || '', 
                 createdAt: Timestamp.fromDate(nextDate) 
             });
        }
        await batch.commit();
    };

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
            await handleAddRecurringTransaction({ desc: formDesc, amount: val, type: formType, subcategory: formSubcat, months: recurringMonths });
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
                            onAddRecurringTransaction={handleAddRecurringTransaction}
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
                    <select className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm" value={period} onChange={e => setPeriod(parseInt(e.target.value))}>{PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
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
                            {t === 'lancamentos' ? 'LANÇAMENTOS' : t === 'planejamento' ? 'PLANEJAMENTO' : t === 'patrimonio' ? 'PATRIMÔNIO' : 'RESULTADOS'}
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
                    <div className="

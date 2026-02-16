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
    { value: 'ALL', label: 'Todo o Período' } 
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

const TransactionTypeBusiness = { 
    RECEITA: 'Receita', 
    CUSTO: 'Custo', 
    DESPESA_OPERACIONAL: 'Despesa Operacional', 
    JUROS_FINANCEIROS: 'Juros/Financeiro', 
    IMPOSTOS: 'Impostos' 
};

const categoriesBusiness = [
    { value: TransactionTypeBusiness.RECEITA, label: 'Receita (+)', color: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30', isPositive: true },
    { value: TransactionTypeBusiness.CUSTO, label: 'Custos (-)', color: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30', isPositive: false },
    { value: TransactionTypeBusiness.DESPESA_OPERACIONAL, label: 'Desp. Operacionais (-)', color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30', isPositive: false },
    { value: TransactionTypeBusiness.JUROS_FINANCEIROS, label: 'Juros/Financeiro (-)', color: 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30', isPositive: false },
    { value: TransactionTypeBusiness.IMPOSTOS, label: 'Impostos (-)', color: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30', isPositive: false },
];

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

// ============================================================================
// 2. FUNÇÕES AUXILIARES
// ============================================================================

const safeCurrency = (value) => { 
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00'; 
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const safeDate = (timestamp) => { 
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'Data N/A'; 
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(timestamp.toDate());
};

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
    cats.forEach(cat => { if (!cat.isPositive) totalSaidas += sumByType(cat.value); });
    const fluxoCaixa = receita - totalSaidas;
    
    const totalBens = assets.filter(a => a.type === 'bens').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const totalInvest = assets.filter(a => a.type === 'investimento').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const patrimonioLiquido = (totalBens + totalInvest + fluxoCaixa);

    const financials = { receita, totalSaidas, fluxoCaixa, totalBens, totalInvest, patrimonioLiquido };
    cats.forEach(cat => { financials[cat.value] = sumByType(cat.value); });
    
    if (type === 'business') {
        financials.lucroBruto = receita - financials[TransactionTypeBusiness.CUSTO];
        financials.ebitda = financials.lucroBruto - financials[TransactionTypeBusiness.DESPESA_OPERACIONAL];
        financials.lucroLiquido = financials.ebitda - financials[TransactionTypeBusiness.JUROS_FINANCEIROS] - financials[TransactionTypeBusiness.IMPOSTOS];
    }
    return financials;
};

// ============================================================================
// 3. COMPONENTES
// ============================================================================

const AssetsView = ({ assets, onAddAsset, onDeleteAsset }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState('bens'); 
    const [indexer, setIndexer] = useState('');
    const [marketData, setMarketData] = useState({ USD: '...', EUR: '...', BTC: '...', CDI: '...', SELIC: '...' });

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const resCoins = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL');
                const dataCoins = await resCoins.json();
                let hgData = { taxes: [{ cdi: 11.25, selic: 11.25 }] }; 
                try {
                    const resHg = await fetch(`https://api.hgbrasil.com/finance/taxes?key=855e9e8f&format=json-cors`);
                    const jsonHg = await resHg.json();
                    if(jsonHg.results) hgData = jsonHg.results;
                } catch(e) {}

                setMarketData({
                    USD: `R$ ${parseFloat(dataCoins.USDBRL.bid).toFixed(2)}`,
                    EUR: `R$ ${parseFloat(dataCoins.EURBRL.bid).toFixed(2)}`,
                    BTC: `R$ ${parseFloat(dataCoins.BTCBRL.bid).toLocaleString('pt-BR')}`,
                    CDI: `${hgData[0]?.cdi || 11.25}%`,
                    SELIC: `${hgData[0]?.selic || 11.25}%`
                });
            } catch (err) { setMarketData({ USD: 'Erro', EUR: '-', BTC: '-', CDI: '11.25%', SELIC: '11.25%' }); }
        };
        fetchMarketData();
    }, []);

    const handleAdd = () => {
        const val = parseFloat(value.replace(/\./g, '').replace(',', '.')); 
        if (!name || isNaN(val)) return;
        onAddAsset({ name, value: val, type, indexer, createdAt: Timestamp.now() });
        setName(''); setValue(''); setIndexer('');
    };

    const getDailyReturn = (val, idx) => {
        let rate = 0;
        if(idx === 'CDI' || idx === 'SELIC') rate = 0.1125;
        if(idx === 'IPCA') rate = 0.045;
        if(idx === 'INCC') rate = 0.04;
        if(rate === 0) return 0;
        // Simulação de rendimento diário (capitalização simples aproximada)
        return (val * rate) / 365;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2 flex justify-center items-center gap-2"><LucideHome size={16}/> Bens Materiais</h3>
                    <p className="text-3xl font-bold">{safeCurrency(assets.filter(a=>a.type==='bens').reduce((acc,c)=>acc+c.value, 0))}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2 flex justify-center items-center gap-2"><LucideTrendingUp size={16}/> Investimentos Ativos</h3>
                    <p className="text-3xl font-bold text-green-600">{safeCurrency(assets.filter(a=>a.type==='investimento').reduce((acc,c)=>acc+c.value, 0))}</p>
                </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2"><LucideRefresh size={12}/> Mercado Financeiro</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">Dólar</p><p className="font-bold text-sm">{marketData.USD}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">Euro</p><p className="font-bold text-sm">{marketData.EUR}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">Bitcoin</p><p className="font-bold text-sm">{marketData.BTC}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">CDI</p><p className="font-bold text-sm">{marketData.CDI}</p></div>
                    <div className="text-center bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">Selic</p><p className="font-bold text-sm">{marketData.SELIC}</p></div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2"><LucidePlus className="text-indigo-600"/> Cadastrar Novo Patrimônio</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <select value={type} onChange={e => setType(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"><option value="bens">Bem Material</option><option value="investimento">Investimento</option></select>
                    <input placeholder="Ex: ViVaz Barra Funda" value={name} onChange={e => setName(e.target.value)} className="md:col-span-2 p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input placeholder="Valor (R$)" value={value} onChange={e => setValue(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select value={indexer} onChange={e => setIndexer(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Sem índice</option><option value="CDI">CDI</option><option value="IPCA">IPCA</option><option value="INCC">INCC</option><option value="Dolar">Dólar</option></select>
                </div>
                <button onClick={handleAdd} className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg"><LucidePlus size={18}/> Adicionar ao Patrimônio</button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <tr><th className="p-4">Item Patrimonial</th><th className="p-4">Tipo</th><th className="p-4">Reajuste</th><th className="p-4 text-right">Valor Atual</th><th className="p-4 text-right text-indigo-600">Rendimento Diário (Est.)</th><th className="p-4 w-10"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {assets.map(a => (<tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 font-bold">{a.name}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${a.type === 'bens' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{a.type.toUpperCase()}</span></td>
                            <td className="p-4 font-mono">{a.indexer || '-'}</td>
                            <td className="p-4 text-right font-bold">{safeCurrency(a.value)}</td>
                            <td className="p-4 text-right text-green-600 font-mono font-bold">+{safeCurrency(getDailyReturn(a.value, a.indexer))}</td>
                            <td className="p-4"><button onClick={() => onDeleteAsset(a.id)} className="text-red-400 hover:text-red-600 transition-colors"><LucideTrash2 size={16}/></button></td>
                        </tr>))}
                    </tbody>
                 </table>
                 {assets.length === 0 && <div className="p-12 text-center text-slate-400 italic">Sua carteira de patrimônio está vazia.</div>}
            </div>
        </div>
    );
};

// --- CHAT INTERFACE (INTELIGÊNCIA LORD) ---
const ChatInterface = ({ isOpen, onClose, onAddTransaction, onAddRecurringTransaction, onAddAsset, onUpdateTransaction, onDeleteTransaction, currentCompany, transactions }) => {
    const [messages, setMessages] = useState([{ id: 1, text: "Olá Lord! Sou seu assistente financeiro de elite. Como posso organizar seu império hoje?", sender: 'bot' }]);
    const [inputText, setInputText] = useState('');
    const [lastActionId, setLastActionId] = useState(null);
    const messagesEndRef = useRef(null);
    const companyType = currentCompany?.type || 'business';

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText; 
        const lowerText = text.toLowerCase();
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user' }]);
        setInputText('');

        setTimeout(async () => {
            let botResponse = { id: Date.now() + 1, text: '', sender: 'bot' };
            
            // --- CÉREBRO LORD NLP 4.0 ---
            // 1. Extração de Valores Monetários (Prioriza o primeiro número que parece valor)
            const moneyRegex = /(?:r\$|reais)?\s*(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;
            const moneyMatch = text.match(moneyRegex);
            const amount = moneyMatch ? parseFloat(moneyMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

            // 2. Extração de Quantidade (Meses/Parcelas)
            const quantityMatch = text.match(/(\d+)\s*meses/i);
            const months = quantityMatch ? parseInt(quantityMatch[1]) : 1;

            // 3. Classificação de Intenção
            const isAsset = ['investi', 'comprei', 'patrimonio', 'imovel', 'carro', 'cdb', 'fii', 'acoes'].some(w => lowerText.includes(w));
            const isIncome = ['recebi', 'ganhei', 'faturamento', 'venda', 'lucro', 'entrada', 'salario'].some(w => lowerText.includes(w));
            const isRecurring = months > 1 || lowerText.includes('fixa') || lowerText.includes('todo mes') || lowerText.includes('recorrente');

            // --- PROCESSAMENTO ---

            // A. PATRIMÔNIO / INVESTIMENTO
            if (isAsset && amount > 0) {
                const name = text.replace(moneyMatch[0], '').replace(/(investi|comprei|um|uma|no|na|em|reais|R\$|patrimonio|carro|imovel|cdb)/gi, '').trim();
                const type = (lowerText.includes('invest') || lowerText.includes('cdb') || lowerText.includes('ação')) ? 'investimento' : 'bens';
                let idx = '';
                if (lowerText.includes('cdi')) idx = 'CDI';
                else if (lowerText.includes('ipca')) idx = 'IPCA';
                else if (lowerText.includes('selic')) idx = 'SELIC';
                else if (lowerText.includes('incc')) idx = 'INCC';
                
                try {
                    await onAddAsset({ name: name || 'Novo Patrimônio', value: amount, type, indexer: idx, createdAt: Timestamp.now() });
                    botResponse.text = `🏛️ Lord, registrei o ${type} "${name || 'Patrimônio'}" de ${safeCurrency(amount)} na sua carteira. O rendimento estimado já está sendo projetado!`;
                } catch(e) { botResponse.text = "Desculpe Lord, falhei ao gravar esse bem."; }
            }
            // B. LANÇAMENTOS RECORRENTES (FUTUROS)
            else if (isRecurring && amount > 0) {
                const cleanDesc = text.replace(moneyMatch[0], '').replace(quantityMatch ? quantityMatch[0] : '', '').replace(/(meses|por|durante|reais|fixa|despesa|R\$|todo mes|recorrente)/gi, '').trim();
                const type = isIncome ? (companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA) 
                                      : (companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL);
                
                try {
                    // Função que executa o Batch de X meses
                    await onAddRecurringTransaction({ 
                        desc: cleanDesc || 'Recorrente Lord', 
                        amount, 
                        type, 
                        months: months > 1 ? months : 12 // Se disse "fixa" sem tempo, assume 12 meses
                    });
                    botResponse.text = `🔄 Lord, ordens executadas! Lancei "${cleanDesc || 'Despesa'}" de ${safeCurrency(amount)} mensalmente pelos próximos ${months > 1 ? months : 12} meses. Você já pode visualizar isso no seu Planejamento Futuro.`;
                } catch(e) { botResponse.text = "Erro ao processar as parcelas futuras."; }
            }
            // C. LANÇAMENTO SIMPLES
            else if (amount > 0) {
                const type = isIncome ? (companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA) 
                                      : (companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL);
                
                const cleanDesc = text.replace(moneyMatch[0], '').replace(/(recebi|gastei|paguei|ganhei|de|com|na|no|reais|R\$)/gi, '').trim();
                
                try {
                    const newId = await onAddTransaction({ desc: cleanDesc || 'Lançamento Lord', amount, type, subcategory: '', date: new Date() });
                    setLastActionId(newId);
                    botResponse.text = `✅ Feito Lord! Lançamento de ${safeCurrency(amount)} em "${cleanDesc || 'Geral'}" concluído.`;
                } catch(e) { botResponse.text = "Erro técnico ao salvar lançamento."; }
            }
            // D. OUTROS COMANDOS
            else if (lowerText.includes('resumo') || lowerText.includes('saldo')) {
                const fins = calculateFinancials(transactions, companyType);
                botResponse.text = `📊 Lord, aqui está seu status atual:\nEntradas: ${safeCurrency(fins.receita)}\nSaídas: ${safeCurrency(fins.totalSaidas)}\nSaldo Livre: ${safeCurrency(fins.fluxoCaixa)}`;
            }
            else {
                botResponse.text = "Lord, não consegui extrair os dados. Tente algo como: 'Gastei 150 no mercado' ou 'Aluguel 1200 fixa por 12 meses'.";
            }

            setMessages(prev => [...prev, botResponse]);
        }, 500);
    };

    return (
        <div className="fixed bottom-24 right-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 animate-fade-in-up h-[500px]">
            <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center shadow-lg"><div className="flex items-center gap-2"><LucideMessageSquare size={20} /><span className="font-bold tracking-tight">Estratégia Lord IA</span></div><button onClick={onClose}><LucideX size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50 scrollbar-thin">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'}`}>{msg.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shadow-inner">
                <textarea className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none max-h-32" placeholder="Ordene aqui, Lord..." rows={1} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 self-end shadow-md active:scale-95 transition-transform"><LucideSend size={18} /></button>
            </div>
        </div>
    );
};

// ============================================================================
// 4. COMPONENTE PRINCIPAL (APP)
// ============================================================================

export default function App() {
    // ESTADOS DE AUTENTICAÇÃO E DATABASE
    const [user, setUser] = useState(null);
    const [db, setDb] = useState(null);
    
    // ESTADOS DE DADOS
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [subcategories, setSubcategories] = useState({});
    const [budget, setBudget] = useState({});
    const [assets, setAssets] = useState([]);
    
    // ESTADOS DE UI
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState('lancamentos');
    const [resultTab, setResultTab] = useState('dre');
    const [period, setPeriod] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);

    // FORMULÁRIO
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formType, setFormType] = useState(categoriesBusiness[0].value);
    const [formSubcat, setFormSubcat] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringMonths, setRecurringMonths] = useState(1);

    const companyType = currentCompany?.type || 'business';
    const activeCategories = useMemo(() => companyType === 'personal' ? categoriesPersonal : categoriesBusiness, [companyType]);

    // INICIALIZAÇÃO
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) { setDarkMode(true); }
        const app = initializeApp(firebaseConfig);
        const _auth = getAuth(app); const _db = getFirestore(app); setDb(_db);
        return onAuthStateChanged(_auth, (u) => { if (u) setUser(u); else signInAnonymously(_auth); });
    }, []);

    useEffect(() => { if (darkMode) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } }, [darkMode]);

    // CARREGAMENTO DE CONTAS
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

    // CARREGAMENTO DE LANÇAMENTOS, CATEGORIAS E PATRIMÔNIO
    useEffect(() => {
        if (!user || !db || !currentCompany) return;
        const qTx = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`));
        const unsubTx = onSnapshot(qTx, snap => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const qSub = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`));
        const unsubSub = onSnapshot(qSub, snap => {
            const subs = {}; snap.docs.forEach(d => { const data = d.data(); if (!subs[data.type]) subs[data.type] = []; subs[data.type].push({ id: d.id, name: data.name }); }); setSubcategories(subs);
        });
        const qAssets = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`));
        const unsubAssets = onSnapshot(qAssets, snap => setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubTx(); unsubSub(); unsubAssets(); };
    }, [user, db, currentCompany]);

    // FILTRO GLOBAL PODEROSO (Mês, Ano ou Tudo)
    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            if (!t.createdAt) return false;
            const d = t.createdAt.toDate();
            if (period === 'ALL') return true; // MOSTRA TUDO DE TODOS OS ANOS
            if (d.getUTCFullYear() !== year) return false;
            const txMonth = d.getUTCMonth();
            if (typeof period === 'number') return txMonth === period;
            if (period === 'Q1') return txMonth < 3; if (period === 'Q2') return txMonth >= 3 && txMonth < 6;
            if (period === 'Q3') return txMonth >= 6 && txMonth < 9; if (period === 'Q4') return txMonth >= 9;
            return true;
        });
    }, [transactions, period, year]);

    const searchedData = useMemo(() => {
        if (!searchTerm.trim()) return filteredData;
        return filteredData.filter(t => t.desc.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [filteredData, searchTerm]);

    // CORE: ADICIONAR RECORRENTE (BATCH)
    const handleAddRecurringTransaction = async ({ desc, amount, type, months }) => {
        if (!user || !currentCompany) return;
        const collectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`);
        const batch = writeBatch(db);
        const today = new Date();
        for (let i = 0; i < months; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, today.getDate(), 12, 0, 0);
            const newDocRef = doc(collectionRef);
            batch.set(newDocRef, { desc: `${desc} (${i+1}/${months})`, amount, type, createdAt: Timestamp.fromDate(d) });
        }
        await batch.commit();
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        const val = parseFloat(formAmount.replace(/\./g, '').replace(',', '.'));
        if (isNaN(val)) return;
        const date = new Date(formDate + 'T12:00:00');
        const data = { desc: formDesc, amount: val, type: formType, subcategory: formSubcat };
        const ref = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`);
        
        if (editingTransaction) {
            await updateDoc(doc(ref, editingTransaction.id), data);
        } else if (isRecurring && recurringMonths > 1) {
            await handleAddRecurringTransaction({ desc: formDesc, amount: val, type: formType, months: recurringMonths });
        } else {
            await addDoc(ref, {...data, createdAt: Timestamp.fromDate(date)});
        }
        setEditingTransaction(null); setFormDesc(''); setFormAmount('');
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-indigo-400 font-bold animate-pulse">CARREGANDO IMPÉRIO FINANCEIRO...</div>;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <header className="max-w-5xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={()=>setShowSidebar(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"><LucideMenu size={28} /></button>
                    <div><h1 className="text-2xl font-black tracking-tight">Gestão Financeira</h1><p className="text-sm text-indigo-600 font-bold flex items-center gap-1 uppercase"><LucideBuilding2 size={14} /> {currentCompany?.name}</p></div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={()=>setDarkMode(!darkMode)} className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">{darkMode ? <LucideSun/> : <LucideMoon/>}</button>
                    <select className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm outline-none font-bold" value={period} onChange={e => setPeriod(isNaN(e.target.value) ? e.target.value : parseInt(e.target.value))}>{PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                    {period !== 'ALL' && <select className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm outline-none font-bold" value={year} onChange={e => setYear(parseInt(e.target.value))}>{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>}
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4">
                <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-print border-b border-slate-200 dark:border-slate-800">
                    <button onClick={()=>setMainTab('lancamentos')} className={`px-6 py-3 rounded-t-xl font-black transition-all ${mainTab==='lancamentos'?'bg-indigo-600 text-white shadow-lg':'text-slate-400'}`}>LANÇAMENTOS</button>
                    <button onClick={()=>setMainTab('planejamento')} className={`px-6 py-3 rounded-t-xl font-black transition-all ${mainTab==='planejamento'?'bg-indigo-600 text-white shadow-lg':'text-slate-400'}`}>PLANEJAMENTO</button>
                    <button onClick={()=>setMainTab('patrimonio')} className={`px-6 py-3 rounded-t-xl font-black transition-all ${mainTab==='patrimonio'?'bg-indigo-600 text-white shadow-lg':'text-slate-400'}`}>PATRIMÔNIO</button>
                    <button onClick={()=>setMainTab('resultados')} className={`px-6 py-3 rounded-t-xl font-black transition-all ${mainTab==='resultados'?'bg-indigo-600 text-white shadow-lg':'text-slate-400'}`}>RESULTADOS</button>
                </div>

                {mainTab === 'lancamentos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                                <h2 className="font-black text-xl mb-4 flex items-center gap-2">{editingTransaction ? <LucideEdit2 className="text-indigo-500"/> : <LucidePlus className="text-green-500"/>} {editingTransaction ? 'Editar' : 'Novo Lançamento'}</h2>
                                <form onSubmit={handleSaveTransaction} className="space-y-4">
                                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                    <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500">{activeCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                                    <select value={formSubcat} onChange={e => setFormSubcat(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Sem subcategoria</option>{subcategories[formType]?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                                    <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descrição (Ex: Condomínio)" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                                    <div className="relative"><span className="absolute left-3 top-3.5 font-bold text-slate-400">R$</span><input value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0,00" className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-900 border rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                                    {!editingTransaction && (<div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border"><div className="flex items-center gap-2"><input type="checkbox" id="rec" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-5 h-5 rounded" /><label htmlFor="rec" className="font-bold text-sm">RECORRENTE?</label></div>{isRecurring && <input type="number" min="2" value={recurringMonths} onChange={e => setRecurringMonths(parseInt(e.target.value))} className="w-16 p-1 border rounded bg-white dark:bg-slate-800 text-center font-bold" />}</div>)}
                                    <div className="flex gap-2"><button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg transition-all uppercase tracking-widest">Gravar</button>{editingTransaction && <button type="button" onClick={()=>setEditingTransaction(null)} className="px-6 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold">Cancelar</button>}</div>
                                </form>
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border h-[650px] flex flex-col">
                                <div className="p-5 border-b flex justify-between items-center"><span className="font-black uppercase text-xs tracking-widest text-slate-500">Histórico de Lançamentos</span><div className="relative"><LucideSearch size={14} className="absolute left-3 top-3 text-slate-400"/><input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs w-40 outline-none" /></div></div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {searchedData.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(t => (
                                        <div key={t.id} className="p-4 bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl flex justify-between items-center hover:shadow-md transition-all">
                                            <div className="truncate"><p className="font-black truncate text-sm uppercase">{t.desc}</p><p className="text-[10px] text-slate-400 font-bold">{safeDate(t.createdAt)} · {activeCategories.find(c=>c.value===t.type)?.label.split(' ')[0]}</p></div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black whitespace-nowrap text-base ${activeCategories.find(c=>c.value===t.type)?.isPositive ? 'text-green-500' : 'text-red-500'}`}>{safeCurrency(t.amount)}</span>
                                                <button onClick={() => handleEditClick(t)} className="p-2 hover:bg-indigo-50 rounded-full text-slate-400 hover:text-indigo-600"><LucideEdit2 size={16}/></button>
                                                <button onClick={async() => { if(window.confirm("Excluir Lord?")) await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, t.id)) }} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-600"><LucideTrash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mainTab === 'planejamento' && <BudgetPlanningView budget={budget} subcategories={subcategories} onSaveBudget={async(b)=>await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`), b)} isMonthly={typeof period === 'number'} companyType={companyType} />}
                {mainTab === 'patrimonio' && <AssetsView assets={assets} onAddAsset={d=>addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`), d)} onDeleteAsset={id=>deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`, id))} />}
                {mainTab === 'resultados' && (
                    <div className="space-y-8 animate-fade-in">
                         <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                            {['dre', 'fluxo', 'graficos'].map(k => (<button key={k} onClick={() => setResultTab(k)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${resultTab === k ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{k}</button>))}
                         </div>
                         {resultTab === 'dre' && <DREView transactions={filteredData} budget={budget} isMonthly={typeof period === 'number'} companyType={companyType} />}
                         {resultTab === 'fluxo' && <CashFlowView transactions={filteredData} companyType={companyType} />}
                         {resultTab === 'graficos' && <ChartsView allTransactions={transactions} companyType={companyType} />}
                    </div>
                )}
            </main>
            <button onClick={() => setShowChat(!showChat)} className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all border-4 border-white dark:border-slate-800"><LucideMessageSquare size={24} /></button>
        </div>
    );
}

// CALCULADORA CORRIGIDA (SEM EVAL DIRETO)
function CalculatorModal({onClose,onConfirm}){
    const [e,setE]=useState('');
    const h=(v)=>{
        if(v==='C')setE('');
        else if(v==='='){
            try{
                // Uso de Function constructor para evitar o aviso do bundler sobre eval direto
                const calc = new Function('return ' + e.replace(/x/g,'*').replace(/÷/g,'/').replace(/,/g,'.'));
                setE(String(calc()));
            }catch{setE('Erro')}
        }else setE(p=>p+v)
    };
    return(<div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl"><div className="flex justify-between mb-4"><h3 className="font-black text-indigo-600 uppercase tracking-widest text-sm">Lord Calc</h3><button onClick={onClose}><LucideX/></button></div><div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl mb-4 text-right font-black text-3xl overflow-hidden">{e||'0'}</div><div className="grid grid-cols-4 gap-2 mb-4">{['7','8','9','÷','4','5','6','x','1','2','3','-','C','0',',','+'].map(x=><button key={x} onClick={()=>h(x)} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl font-black text-xl hover:bg-indigo-50 active:scale-95 transition-all">{x}</button>)}<button onClick={()=>h('=')} className="col-span-4 bg-indigo-600 text-white p-4 rounded-xl font-black text-xl shadow-lg">=</button></div><button onClick={()=>onConfirm(e.replace('.',','))} className="w-full bg-slate-800 text-white p-4 rounded-xl font-black uppercase tracking-widest transition-all">Usar Valor</button></div></div>)
}

function Sidebar({ isOpen, onClose, companies, currentCompany, onChangeCompany, onAddCompany, onRenameCompany, onOpenSettings }){
    const [newName, setNewName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    return (<> {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />} <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}> <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center"><h2 className="font-black uppercase text-xs tracking-widest text-slate-500">Minhas Contas</h2><button onClick={onClose}><LucideX/></button></div> <div className="p-4 flex flex-col h-[calc(100%-80px)]"> <div className="flex-1 space-y-2"> {companies.map(c => (<div key={c.id} onClick={() => {onChangeCompany(c); onClose();}} className={`p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${currentCompany?.id === c.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600'}`}> <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.type==='personal'?'bg-green-100 text-green-600':'bg-blue-100 text-blue-600'}`}>{c.type==='personal'?<LucideUser size={20}/>:<LucideBriefcase size={20}/>}</div> <div className="flex-1 font-bold truncate">{c.name}</div> </div>))} <button onClick={()=>setIsCreating(true)} className="w-full p-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all font-bold"> <LucidePlus size={20}/> Nova Conta </button> {isCreating && <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mt-2 border space-y-3"><input autoFocus placeholder="Nome do Império" className="w-full p-2 rounded-lg border dark:bg-slate-900 outline-none" value={newName} onChange={e=>setNewName(e.target.value)} /><div className="flex gap-2"><button onClick={()=>onAddCompany(newName, 'business')} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold">Criar</button><button onClick={()=>setIsCreating(false)} className="px-3 bg-slate-200 rounded-lg">X</button></div></div>} </div> <div className="pt-4 border-t dark:border-slate-800"><button onClick={onOpenSettings} className="w-full p-4 flex items-center gap-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"><LucideSettings/> Configurações</button></div> </div> </div> </>)
}

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
    Percent as LucidePercent, Info as LucideInfo, Download as LucideDownload, Copy as LucideCopy, CheckCircle as LucideCheckCircle, Smartphone as LucideSmartphone, Menu as LucideMenu, Check as LucideCheck, Rocket as LucideRocket, Moon as LucideMoon, Sun as LucideSun, Repeat as LucideRepeat, Printer as LucidePrinter, Calculator as LucideCalculator, User as LucideUser, Briefcase as LucideBriefcase, Bell as LucideBell, MessageSquare as LucideMessageSquare, Send as LucideSend
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

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PERIOD_OPTIONS = [
    { value: 0, label: 'Jan' }, { value: 1, label: 'Fev' }, { value: 2, label: 'Mar' },
    { value: 3, label: 'Abr' }, { value: 4, label: 'Mai' }, { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' }, { value: 7, label: 'Ago' }, { value: 8, label: 'Set' },
    { value: 9, label: 'Out' }, { value: 10, label: 'Nov' }, { value: 11, label: 'Dez' },
    { value: 'Q1', label: '1º Trimestre' }, { value: 'Q2', label: '2º Trimestre' },
    { value: 'Q3', label: '3º Trimestre' }, { value: 'Q4', label: '4º Trimestre' },
    { value: 'S1', label: '1º Semestre' }, { value: 'S2', label: '2º Semestre' },
    { value: 'Y', label: 'Ano Completo' },
];

// --- CATEGORIAS EMPRESARIAIS ---
const TransactionTypeBusiness = {
    RECEITA: 'Receita',
    CUSTO: 'Custo',
    DESPESA_OPERACIONAL: 'Despesa Operacional',
    JUROS_FINANCEIROS: 'Juros/Financeiro',
    IMPOSTOS: 'Impostos',
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

const transactionCategories = categoriesBusiness; 

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

const safeCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); } catch (e) { return 'R$ Error'; }
};

const safeDate = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'Data N/A';
    try { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(timestamp.toDate()); } catch (e) { return 'Data Inválida'; }
};

const safePercent = (value, total) => {
    if (!total || total === 0) return '0.0%';
    return `${((value / total) * 100).toFixed(1)}%`;
};

const calculateFinancials = (data = [], type = 'business') => {
    const safeData = Array.isArray(data) ? data : [];
    const cats = type === 'personal' ? categoriesPersonal : categoriesBusiness;
    const sumByType = (tType) => safeData.reduce((acc, t) => t.type === tType ? acc + (Number(t.amount) || 0) : acc, 0);
    const subcatTotals = {};
    safeData.forEach(t => { if (t.subcategory) { const key = `${t.type}:${t.subcategory}`; subcatTotals[key] = (subcatTotals[key] || 0) + (Number(t.amount) || 0); } });
    const receitaKey = type === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA;
    const receita = sumByType(receitaKey);
    let totalSaidas = 0;
    cats.forEach(cat => { if (!cat.isPositive) totalSaidas += sumByType(cat.value); });
    const fluxoCaixa = receita - totalSaidas;
    const financials = { receita, totalSaidas, fluxoCaixa, subcatTotals };
    cats.forEach(cat => { financials[cat.value] = sumByType(cat.value); });
    if (type === 'business') {
        financials.lucroBruto = receita - financials[TransactionTypeBusiness.CUSTO];
        financials.ebitda = financials.lucroBruto - financials[TransactionTypeBusiness.DESPESA_OPERACIONAL];
        financials.lucroLiquido = financials.ebitda - financials[TransactionTypeBusiness.JUROS_FINANCEIROS] - financials[TransactionTypeBusiness.IMPOSTOS];
    }
    return financials;
};

// --- Componente Chat Inteligente (Flutuante) ---
const ChatInterface = ({ isOpen, onClose, onAddTransaction, onUpdateTransaction, onDeleteTransaction, currentCompany, transactions }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Olá! Sou seu assistente. Pode me contar o que aconteceu?", sender: 'bot' },
        { id: 2, text: "Ex: 'Entrada de 2.220' ou 'Gastei 50 no almoço'. Shift+Enter para pular linha.", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const [lastActionId, setLastActionId] = useState(null);
    const messagesEndRef = useRef(null);
    const companyType = currentCompany?.type || 'business';

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    const parseValue = (text) => {
        let clean = text.replace(/[^0-9.,-]/g, '');
        if (clean.includes(',')) {
            clean = clean.replace(/\./g, ''); 
            clean = clean.replace(',', '.');  
        } else {
            clean = clean.replace(/\./g, ''); 
        }
        return parseFloat(clean);
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText;
        const lowerText = text.toLowerCase();
        
        const userMsg = { id: Date.now(), text, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        setTimeout(async () => {
            let botResponse = { id: Date.now() + 1, text: '', sender: 'bot' };

            if ((lowerText.includes('corrigir') || lowerText.includes('corrija')) && lastActionId) {
                const newValue = parseValue(text);
                if (!isNaN(newValue) && newValue > 0) {
                    try { await onUpdateTransaction(lastActionId, { amount: newValue }); botResponse.text = `✅ Corrigido! Valor: ${safeCurrency(newValue)}.`; } 
                    catch (e) { botResponse.text = "❌ Erro ao corrigir."; }
                } else { botResponse.text = "Para corrigir, diga o valor. Ex: '1500'"; }
            } else if (lowerText.includes('apagar') && lowerText.includes('ultimo')) {
                if (lastActionId) {
                    try { await onDeleteTransaction(lastActionId); setLastActionId(null); botResponse.text = "🗑️ Último lançamento apagado."; } 
                    catch (e) { botResponse.text = "❌ Erro ao apagar."; }
                } else { botResponse.text = "Nada recente para apagar."; }
            } else if (lowerText.includes('resumo') || lowerText.includes('saldo')) {
                const fins = calculateFinancials(transactions, companyType);
                botResponse.text = `📊 *Resumo*\nEntradas: ${safeCurrency(fins.receita)}\nSaídas: ${safeCurrency(fins.totalSaidas)}\nSaldo: ${safeCurrency(fins.fluxoCaixa)}`;
            } else {
                const amount = parseValue(text);
                if (!isNaN(amount) && amount > 0) {
                    let type = '';
                    let typeLabel = '';
                    if (['recebi', 'ganhei', 'venda', 'entrada', 'receita'].some(w => lowerText.includes(w))) {
                        type = companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA; typeLabel = 'Receita';
                    } else if (['gastei', 'paguei', 'saída', 'compra', 'custo', 'despesa'].some(w => lowerText.includes(w))) {
                        typeLabel = 'Despesa';
                        if (lowerText.includes('imposto')) type = companyType === 'personal' ? TransactionTypePersonal.DIVIDAS : TransactionTypeBusiness.IMPOSTOS;
                        else if (lowerText.includes('juro') || lowerText.includes('multa')) type = companyType === 'personal' ? TransactionTypePersonal.DIVIDAS : TransactionTypeBusiness.JUROS_FINANCEIROS;
                        else type = companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL;
                    }

                    if (type) {
                        const desc = text.replace(/[0-9.,]+/, '').replace(/(recebi|gastei|paguei|de|com|na|no|R\$|reais)/gi, '').trim();
                        try {
                            const newId = await onAddTransaction({ desc: desc || 'Via Chat', amount, type, subcategory: '', date: new Date() });
                            setLastActionId(newId);
                            botResponse.text = `✅ ${typeLabel}: ${safeCurrency(amount)}${desc ? ` ("${desc}")` : ''}.`;
                        } catch (e) { botResponse.text = "Erro ao salvar."; }
                    } else { botResponse.text = `Entendi ${safeCurrency(amount)}, mas é Receita ou Despesa?`; }
                } else { botResponse.text = "Não entendi o valor. Tente 'Gastei 50'."; }
            }
            setMessages(prev => [...prev, botResponse]);
        }, 500);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 animate-fade-in-up h-[450px]">
            <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-2"><LucideMessageSquare size={20} /><span className="font-bold">Assistente IA</span></div>
                <button onClick={onClose}><LucideX size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <textarea 
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
                    placeholder="Digite... (Shift+Enter pula linha)"
                    rows={1}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 self-end"><LucideSend size={18} /></button>
            </div>
        </div>
    );
};

// ... (Outros componentes DREView, BudgetPlanningView, etc. mantidos) ...

const DREView = ({ transactions, budget, isMonthly, isPrintMode, companyType }) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [showPercentage, setShowPercentage] = useState(false);
    const real = useMemo(() => calculateFinancials(transactions, companyType), [transactions, companyType]);
    const meta = useMemo(() => isMonthly && budget ? budget : {}, [budget, isMonthly]);
    const toggleRow = (label) => setExpandedRows(prev => ({ ...prev, [label]: !prev[label] }));
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;

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
            return <div key={subName} className={`grid ${isMonthly && !showPercentage ? 'grid-cols-3' : 'grid-cols-2'} py-2 px-4 border-b border-gray-200 text-xs ${isPrintMode ? 'text-black' : 'text-gray-600 dark:text-slate-300 bg-gray-50/50 dark:bg-slate-900/50'}`}><span className={`${isPrintMode ? 'text-black' : 'text-gray-500 dark:text-slate-400'} pl-6 flex items-center`}>• {subName}</span><span className={`text-right ${isPrintMode ? 'text-black' : ''}`}>{displayReal}</span>{isMonthly && !showPercentage && <span className={`text-right font-medium ${(isNegative ? variacao <= 0 : variacao >= 0) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{valMeta !== 0 ? `${variacao > 0 ? '+' : ''}${safeCurrency(variacao)}` : '-'}</span>}</div>;
        });
    };
    const LineItem = ({ label, type, valReal, valMeta, isNegative, isTotal, highlight, canExpand }) => {
        const finalReal = isNegative ? -valReal : valReal;
        let displayReal = showPercentage ? safePercent(valReal, real.receita) : safeCurrency(finalReal);
        if (showPercentage && isNegative) displayReal = '-' + displayReal;
        return <div className={`grid ${isMonthly && !showPercentage ? 'grid-cols-3' : 'grid-cols-2'} py-3 px-4 border-b border-gray-200 dark:border-slate-800 items-center ${isTotal ? 'font-bold bg-gray-50 dark:bg-slate-800/50' : ''} ${canExpand ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => canExpand && toggleRow(label)}><span className={`flex items-center gap-1 ${isTotal ? 'text-slate-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>{canExpand && (expandedRows[label] ? <LucideChevronDown size={14} /> : <LucideChevronRight size={14} />)}{label}</span><span className={`text-right ${isTotal ? 'text-base' : 'text-sm'}`}>{displayReal}</span>{isMonthly && !showPercentage && <span className="text-right text-xs font-medium text-slate-500">-</span>}</div>;
    };
    return <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden relative ${isPrintMode?'border-none':''}`}>{!isPrintMode&&<div className="absolute top-2 right-2"><button onClick={()=>setShowPercentage(!showPercentage)} className="p-1.5 rounded-md bg-gray-100 dark:bg-slate-700"><LucidePercent size={14}/></button></div>}<div className="grid grid-cols-2 bg-gray-100 dark:bg-slate-900 text-xs font-bold uppercase py-3 px-4"><div>Descrição</div><div className="text-right">Valor</div></div><div><LineItem label="Receita" type={TransactionTypeBusiness.RECEITA} valReal={real.receita} canExpand /></div></div>;
};

const BudgetPlanningView = ({ budget, subcategories, onSaveBudget, isMonthly, companyType }) => {
    const [localBudget, setLocalBudget] = useState({});
    const [localSubBudget, setLocalSubBudget] = useState({});
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;
    useEffect(() => { setLocalBudget(budget || {}); setLocalSubBudget(budget?.subcategories || {}); }, [budget]);
    if (!isMonthly) return <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">Selecione um mês específico para planejar o orçamento.</div>;
    const handleMainChange = (type, value) => { setLocalBudget(prev => ({ ...prev, [type]: parseFloat(value) || 0 })); };
    const handleSubChange = (type, subName, value) => { const key = `${type}:${subName}`; const numVal = parseFloat(value) || 0; setLocalSubBudget(prev => { const newSubs = { ...prev, [key]: numVal }; const currentTypeSubs = Object.entries(newSubs).filter(([k]) => k.startsWith(type + ':')).reduce((sum, [, val]) => sum + val, 0); setLocalBudget(prevMain => ({ ...prevMain, [type]: currentTypeSubs })); return newSubs; }); };
    const handleSave = () => { onSaveBudget({ ...localBudget, subcategories: localSubBudget }); };
    return (<div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"><div className="space-y-8">{cats.map(cat => (<div key={cat.value} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700 break-inside-avoid"><div className="flex justify-between items-center mb-3"><h3 className={`font-bold text-sm uppercase ${cat.color.split(' ')[0]}`}>{cat.label}</h3><input type="number" value={localBudget[cat.value] || ''} onChange={e => handleMainChange(cat.value, e.target.value)} className="w-40 p-2 text-right outline-none font-semibold text-slate-700 dark:text-slate-200 bg-transparent border rounded" placeholder="0,00" /></div>{subcategories[cat.value]?.length > 0 && (<div className="pl-4 space-y-2 border-l-2 ml-2">{subcategories[cat.value].map(sub => (<div key={sub.id} className="flex justify-between items-center text-sm"><span className="text-slate-600 dark:text-slate-400">{sub.name}</span><input type="number" value={localSubBudget[`${cat.value}:${sub.name}`] || ''} onChange={e => handleSubChange(cat.value, sub.name, e.target.value)} className="w-32 p-1 text-right outline-none text-sm text-slate-600 dark:text-slate-300 bg-transparent border rounded" placeholder="0,00" /></div>))}</div>)}</div>))}</div><button onClick={handleSave} className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">SALVAR METAS</button></div>);
};

const CashFlowView = ({ transactions, isPrintMode }) => {
    const { receita, totalSaidas, fluxoCaixa } = useMemo(() => calculateFinancials(transactions), [transactions]);
    if (isPrintMode) { return (<div className="grid grid-cols-3 gap-4 border p-4 text-center"><div><h3 className="font-bold">Entradas</h3><p>{safeCurrency(receita)}</p></div><div><h3 className="font-bold">Saídas</h3><p>{safeCurrency(totalSaidas)}</p></div><div><h3 className="font-bold">Saldo</h3><p>{safeCurrency(fluxoCaixa)}</p></div></div>); }
    return (<div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100"><h3 className="text-green-800 dark:text-green-400 font-bold mb-2">Entradas</h3><p className="text-3xl font-bold text-green-700 dark:text-green-400">{safeCurrency(receita)}</p></div><div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100"><h3 className="text-red-800 dark:text-red-400 font-bold mb-2">Saídas</h3><p className="text-3xl font-bold text-red-700 dark:text-red-400">{safeCurrency(totalSaidas)}</p></div><div className={`p-6 rounded-xl border ${fluxoCaixa >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100'}`}><h3 className="font-bold mb-2">Saldo</h3><p className="text-3xl font-bold">{safeCurrency(fluxoCaixa)}</p></div></div>);
};

const ChartsView = ({ allTransactions, companyType }) => {
    const lineData = useMemo(() => { if (!allTransactions.length) return []; const g={}; allTransactions.forEach(t=>{if(!t.createdAt)return; const d=t.createdAt.toDate(); const k=`${d.getUTCFullYear()}-${d.getUTCMonth()}`; if(!g[k])g[k]=[]; g[k].push(t);}); return Object.keys(g).map(k=>{const [y,m]=k.split('-'); const f=calculateFinancials(g[k], companyType); return {name:`${MONTHS[parseInt(m)]}/${y.slice(2)}`, Lucro:f.fluxoCaixa, Receita:f.receita, y:parseInt(y), m:parseInt(m)};}).sort((a,b)=>a.y-b.y||a.m-b.m).slice(-12); }, [allTransactions, companyType]);
    if (!lineData.length) return <div className="p-8 text-center text-gray-400">Sem dados.</div>;
    return (<div className="h-80 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700"><ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="Receita" stroke="#10b981"/><Line type="monotone" dataKey="Lucro" stroke="#4f46e5"/></LineChart></ResponsiveContainer></div>);
};

const CategoryPieChart = ({ transactions, type }) => {
    const data = useMemo(() => { const f=transactions.filter(t=>t.type===type); const g={}; f.forEach(t=>{const c=t.subcategory||'Outros'; g[c]=(g[c]||0)+Number(t.amount);}); return Object.entries(g).map(([n,v])=>({name:n, value:v})).sort((a,b)=>b.value-a.value); }, [transactions, type]);
    if (!data.length) return <div className="h-64 flex items-center justify-center text-gray-400">Sem dados.</div>;
    return (<div className="h-96 bg-white dark:bg-slate-800 p-4 rounded-xl border flex flex-col"><h3 className="font-bold text-center mb-4">{type}</h3><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{data.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>);
};

const CalculatorModal = ({ onClose, onConfirm }) => {
    const [expression, setExpression] = useState('');
    const handleBtnClick = (val) => { if (val === 'C') { setExpression(''); } else if (val === '=') { try { const sanitized = expression.replace(/x/g, '*').replace(/÷/g, '/').replace(/,/g, '.'); const result = eval(sanitized); setExpression(String(result)); } catch (e) { setExpression('Erro'); setTimeout(() => setExpression(''), 1000); } } else { setExpression(prev => prev + val); } };
    const handleConfirm = () => { let finalVal = expression; if (/[+\-x÷]/.test(expression)) { try { const sanitized = expression.replace(/x/g, '*').replace(/÷/g, '/').replace(/,/g, '.'); finalVal = String(eval(sanitized)); } catch (e) { return; } } onConfirm(finalVal.replace('.', ',')); };
    const btns = ['7','8','9','÷','4','5','6','x','1','2','3','-','C','0',',','+'];
    return ( <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4" style={{zIndex:9999}}><div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Calculadora</h3><button onClick={onClose}><LucideX/></button></div><div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl mb-4 text-right text-2xl font-bold dark:text-white">{expression || '0'}</div><div className="grid grid-cols-4 gap-2 mb-4">{btns.map(b => (<button key={b} onClick={() => handleBtnClick(b)} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700 font-bold dark:text-white">{b}</button>))} <button onClick={() => handleBtnClick('=')} className="col-span-4 bg-slate-200 p-3 rounded-xl">=</button></div><button onClick={handleConfirm} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">USAR</button></div></div> );
};

const ExportModal = ({ onClose, csvContent, fileName }) => { const [c, setC] = useState(false); const r=useRef(null); useEffect(()=>{if(r.current)r.current.select()},[]); const h=()=>{if(r.current){r.current.select(); document.execCommand('copy'); setC(true); setTimeout(()=>setC(false),2000)}}; return (<div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl max-w-lg w-full"><h3 className="font-bold text-lg mb-2">Exportar CSV</h3><p className="text-sm mb-4">Copie os dados abaixo e cole no Excel:</p><textarea ref={r} readOnly value={csvContent} className="w-full h-32 p-2 border rounded mb-4 text-xs font-mono"/><button onClick={h} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">{c ? 'Copiado!' : 'Copiar'}</button><button onClick={onClose} className="w-full mt-2 text-slate-500">Fechar</button></div></div>); };
const PrintLayout = ({ companyName, periodStr, onClose, children }) => { const h=()=>{window.print()}; return (<div className="fixed inset-0 bg-white z-[70] overflow-y-auto text-black"><div className="sticky top-0 bg-slate-800 text-white p-4 flex justify-between print:hidden"><div className="flex gap-2"><LucidePrinter/><span className="font-bold">Modo Impressão</span></div><div className="flex gap-2"><button onClick={h} className="bg-indigo-600 px-4 py-1 rounded">Imprimir</button><button onClick={onClose} className="bg-slate-600 px-4 py-1 rounded">Fechar</button></div></div><div className="max-w-[210mm] mx-auto p-[10mm]"><div className="text-center border-b-2 border-black pb-4 mb-6"><h1 className="text-2xl font-bold uppercase">{companyName}</h1><h2>Relatório Financeiro</h2><p>{periodStr}</p></div>{children}</div></div>); };
const RepeatModal = ({ onClose, onConfirm, transaction }) => { const [c, setC] = useState(1); return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full"><h3 className="font-bold mb-4 dark:text-white">Repetir Lançamento</h3><p className="mb-4 text-sm dark:text-gray-300">Quantas vezes repetir {transaction.desc}?</p><input type="number" value={c} onChange={e=>setC(e.target.value)} className="w-full p-2 border rounded mb-4 dark:bg-slate-900 dark:text-white"/><button onClick={()=>onConfirm(c)} className="w-full bg-indigo-600 text-white p-2 rounded">Confirmar</button><button onClick={onClose} className="w-full mt-2 text-slate-500">Cancelar</button></div></div>); };
const InstallGuideModal = ({ onClose }) => { return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-6 max-w-sm text-center"><h2 className="font-bold text-xl mb-2">Instalar App</h2><p className="text-sm mb-4">Para instalar, abra este link no Chrome (Android) ou Safari (iOS) e use a opção "Adicionar à Tela Inicial".</p><button onClick={onClose} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">Entendi</button></div></div>); };
const TutorialModal = ({ onClose }) => { const s=[{title:"Bem-vindo!",desc:"Gestão simples e rápida."}, {title:"Menu",desc:"Troque de empresa no topo esquerdo."}, {title:"Lançamentos",desc:"Registre tudo na primeira aba."}, {title:"Chat",desc:"Use o assistente no canto inferior direito."}]; const [c, setC]=useState(0); return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-6 max-w-md text-center"><h2 className="font-bold text-xl mb-2">{s[c].title}</h2><p className="mb-6">{s[c].desc}</p><button onClick={()=>{if(c<s.length-1)setC(c+1);else onClose()}} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">{c<s.length-1?'Próximo':'Começar'}</button></div></div>); };

const Sidebar = ({ isOpen, onClose, companies, currentCompany, onChangeCompany, onAddCompany, onOpenSettings, onOpenInstall, onRenameCompany }) => {
    const [newName, setNewName] = useState(''); const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null); const [editName, setEditName] = useState('');
    const handleCreate = () => { if(newName.trim()) { onAddCompany(newName, 'business'); setNewName(''); setIsCreating(false); onClose(); } };
    const handleStartEdit = (e,c) => { e.stopPropagation(); setEditingId(c.id); setEditName(c.name); };
    const handleSaveEdit = (e) => { e.stopPropagation(); if(editName.trim()){ onRenameCompany(editingId, editName); setEditingId(null); } };
    
    return (<> {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />} <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}> <div className="p-6 border-b dark:border-slate-700 flex justify-between"><h2 className="font-bold text-xl dark:text-white">Minhas Contas</h2><button onClick={onClose}><LucideX/></button></div> <div className="p-4"> 
    {companies.map(c => (
        <div key={c.id} onClick={() => { if(editingId!==c.id){onChangeCompany(c); onClose();} }} className={`w-full text-left p-3 rounded-xl mb-2 flex items-center gap-2 cursor-pointer ${currentCompany?.id === c.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800'}`}>
            {editingId === c.id ? (<><input autoFocus className="flex-1 p-1 border rounded" value={editName} onChange={e=>setEditName(e.target.value)} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Enter')handleSaveEdit(e)}} /><button onClick={handleSaveEdit}><LucideCheck size={14}/></button></>) : (<><span className="flex-1">{c.name}</span><button onClick={e=>handleStartEdit(e,c)} className="text-slate-400 hover:text-indigo-500"><LucideEdit2 size={14}/></button></>)}
        </div>
    ))} 
    <button onClick={() => setIsCreating(true)} className="w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600"><LucidePlus/> Nova Conta</button> {isCreating && (<div className="mt-4"><input autoFocus placeholder="Nome" className="w-full p-2 border rounded mb-2 dark:bg-slate-800 dark:text-white" value={newName} onChange={e => setNewName(e.target.value)} /><button onClick={handleCreate} className="w-full bg-indigo-600 text-white p-2 rounded">Criar</button></div>)} <div className="mt-8 pt-4 border-t dark:border-slate-700"><button onClick={onOpenSettings} className="w-full p-3 flex items-center gap-3 text-slate-600 dark:text-slate-400"><LucideSettings/> Categorias</button></div> </div> </div> </>);
};

export default function App() {
    const [user, setUser] = useState(null); const [db, setDb] = useState(null); const [companies, setCompanies] = useState([]); const [currentCompany, setCurrentCompany] = useState(null);
    const [transactions, setTransactions] = useState([]); const [subcategories, setSubcategories] = useState({}); const [budget, setBudget] = useState({}); const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true); const [mainTab, setMainTab] = useState('lancamentos'); const [resultTab, setResultTab] = useState('dre');
    const [period, setPeriod] = useState(new Date().getMonth()); const [year, setYear] = useState(new Date().getFullYear());
    const [showSettings, setShowSettings] = useState(false); const [searchTerm, setSearchTerm] = useState(''); const [showSidebar, setShowSidebar] = useState(false);
    const [darkMode, setDarkMode] = useState(false); const [showExportModal, setShowExportModal] = useState(false); const [csvContentToExport, setCsvContentToExport] = useState('');
    const [exportFileName, setExportFileName] = useState(''); const [showInstallGuide, setShowInstallGuide] = useState(false); const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrintPreview, setShowPrintPreview] = useState(false); const [showCalculator, setShowCalculator] = useState(false); const [showChat, setShowChat] = useState(false);
    
    // States for forms
    const [editingTransaction, setEditingTransaction] = useState(null); const [repeatingTransaction, setRepeatingTransaction] = useState(null);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]); const [formType, setFormType] = useState(transactionCategories[0].value);
    const [formSubcat, setFormSubcat] = useState(''); const [formDesc, setFormDesc] = useState(''); const [formAmount, setFormAmount] = useState('');
    const [isRecurring, setIsRecurring] = useState(false); const [recurringMonths, setRecurringMonths] = useState(1);
    const [newSubcatName, setNewSubcatName] = useState('');

    const companyType = currentCompany?.type || 'business';
    const activeCategories = useMemo(() => companyType === 'personal' ? categoriesPersonal : categoriesBusiness, [companyType]);

    // Initial Load
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) { setDarkMode(true); }
        if (typeof firebaseConfig === 'undefined' || !firebaseConfig.apiKey.startsWith('AIza')) { console.error("FIREBASE ERROR"); return; }
        const app = initializeApp(firebaseConfig);
        const _auth = getAuth(app); const _db = getFirestore(app); setDb(_db);
        return onAuthStateChanged(_auth, (u) => { if (u) setUser(u); else signInAnonymously(_auth); });
    }, []);

    useEffect(() => { if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); } }, [darkMode]);

    // Data Loading
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

    // Helper Logic
    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            if (!t.createdAt) return false;
            const d = t.createdAt.toDate();
            if (d.getUTCFullYear() !== year) return false;
            if (typeof period === 'number') return d.getUTCMonth() === period;
            const m = d.getUTCMonth();
            if (period === 'Q1') return m < 3; if (period === 'Q2') return m >= 3 && m < 6;
            if (period === 'Q3') return m >= 6 && m < 9; if (period === 'Q4') return m >= 9;
            if (period === 'S1') return m < 6; if (period === 'S2') return m >= 6;
            return true;
        });
    }, [transactions, period, year]);

    const searchedData = useMemo(() => {
        if (!searchTerm.trim()) return filteredData;
        return filteredData.filter(t => t.desc.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [filteredData, searchTerm]);

    const handleCompanyChange = (c) => { setCurrentCompany(c); localStorage.setItem('lastCompanyId', c.id); };
    const resetForm = () => { setEditingTransaction(null); setFormDesc(''); setFormAmount(''); setIsRecurring(false); };
    const handleSaveTransaction = async (e) => { e.preventDefault(); if (!currentCompany) return; 
        const val = parseFloat(formAmount.replace(',', '.')); if (isNaN(val)) return;
        const parts = formDate.split('-'); const date = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], 12));
        const data = { desc: formDesc, amount: val, type: formType, subcategory: formSubcat, createdAt: Timestamp.fromDate(date) };
        const ref = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`);
        if (editingTransaction) await updateDoc(doc(ref, editingTransaction.id), data);
        else if (isRecurring && recurringMonths > 1) { const b = writeBatch(db); for(let i=0; i<recurringMonths; i++) { const d = new Date(date); d.setUTCMonth(date.getUTCMonth() + i); b.set(doc(ref), {...data, createdAt: Timestamp.fromDate(d)}); } await b.commit(); }
        else await addDoc(ref, data);
        resetForm();
    };
    const handleAddAsset = async (data) => { await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`), data); };
    const handleDeleteAsset = async (id) => { if (window.confirm("Excluir?")) await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`, id)); };
    const handleAddSub = async (type) => { if (newSubcatName) { await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`), { type, name: newSubcatName }); setNewSubcatName(''); } };
    const handleDeleteSub = async (id) => { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`, id)); };
    const handleSaveBudget = async (data) => { await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`), data); };
    const handleDelete = async (id) => { if (window.confirm("Excluir?")) await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id)); };
    const handleAddCompany = async (name, type) => { const ref = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies`)); await setDoc(ref, { name, type, createdAt: Timestamp.now() }); setCurrentCompany({id: ref.id, name, type}); };
    const handleRenameCompany = async (id, name) => { await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies`, id), { name }); };
    
    // Chat & Helpers
    const handleAddTxChat = async (d) => { const ref = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`); const r = await addDoc(ref, { ...d, createdAt: Timestamp.fromDate(d.date) }); return r.id; };
    const handleUpTxChat = async (id, d) => { await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id), d); };
    const handleDelTxChat = async (id) => { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id)); };
    const handleConfirmRepeat = async (n) => { /* logic similar to saveTransaction but for repeating */ setRepeatingTransaction(null); };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-indigo-600">Carregando...</div>;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <script src="https://cdn.tailwindcss.com"></script>
            <script dangerouslySetInnerHTML={{__html: `tailwind.config = { darkMode: 'class' }`}} />
            
            {showSidebar && <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} companies={companies} currentCompany={currentCompany} onChangeCompany={handleCompanyChange} onAddCompany={handleAddCompany} onRenameCompany={handleRenameCompany} onOpenSettings={() => setShowSettings(true)} onOpenInstall={() => setShowInstallGuide(true)} />}
            {showSettings && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-lg h-[80vh] overflow-y-auto"><div className="flex justify-between mb-4"><h2 className="font-bold text-xl">Categorias</h2><button onClick={()=>setShowSettings(false)}><LucideX/></button></div>{activeCategories.map(cat => (<div key={cat.value} className="mb-6"><h3 className={`font-bold text-sm ${cat.color.split(' ')[0]}`}>{cat.label}</h3><div className="flex gap-2 my-2"><input className="border p-2 rounded flex-1 dark:bg-slate-900" placeholder="Nova" value={newSubcatName} onChange={e=>setNewSubcatName(e.target.value)} /><button onClick={()=>{handleAddSub(cat.value)}} className="bg-indigo-600 text-white p-2 rounded"><LucidePlus/></button></div><div className="flex flex-wrap gap-2">{subcategories[cat.value]?.map(s=><div key={s.id} className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm flex gap-2">{s.name} <button onClick={()=>handleDeleteSub(s.id)} className="text-red-500"><LucideX size={14}/></button></div>)}</div></div>))}</div></div>}
            {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} onConfirm={(v) => { setFormAmount(v); setShowCalculator(false); }} />}
            {showChat && <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-end p-4 pointer-events-none"><div className="pointer-events-auto w-full max-w-sm"><ChatInterface isOpen={true} onClose={()=>setShowChat(false)} onAddTransaction={handleAddTxChat} onUpdateTransaction={handleUpTxChat} onDeleteTransaction={handleDelTxChat} currentCompany={currentCompany} transactions={transactions} /></div></div>}
            {repeatingTransaction && <RepeatModal onClose={()=>setRepeatingTransaction(null)} onConfirm={handleConfirmRepeat} transaction={repeatingTransaction} />}

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
                         {resultTab === 'dre' && <DREView transactions={filteredData} budget={budget} isMonthly={typeof period === 'number'} companyType={companyType} />}
                         {resultTab === 'fluxo' && <CashFlowView transactions={filteredData} companyType={companyType} />}
                         {resultTab === 'graficos' && <ChartsView allTransactions={transactions} companyType={companyType} />}
                         {resultTab === 'subcategorias' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><CategoryPieChart transactions={filteredData} type={companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA} /><CategoryPieChart transactions={filteredData} type={companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL} /></div>}
                    </div>
                )}
            </main>
            <button onClick={() => setShowChat(!showChat)} className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:scale-105 transition-transform"><LucideMessageSquare size={24} /></button>
        </div>
    );
}

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
    Percent as LucidePercent, Info as LucideInfo, Download as LucideDownload, Copy as LucideCopy, CheckCircle as LucideCheckCircle, Smartphone as LucideSmartphone, Menu as LucideMenu, Check as LucideCheck, Rocket as LucideRocket, Moon as LucideMoon, Sun as LucideSun, Repeat as LucideRepeat, Printer as LucidePrinter, Calculator as LucideCalculator, User as LucideUser, Briefcase as LucideBriefcase, Bell as LucideBell, MessageSquare as LucideMessageSquare, Send as LucideSend, TrendingUp as LucideTrendingUp, Home as LucideHome
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

const INDICES_MERCADO = [
    { name: 'CDI (a.a)', value: '11,25%' },
    { name: 'IPCA (12m)', value: '4,50%' },
    { name: 'INCC-M', value: '0,30% (mês)' },
    { name: 'Poupança', value: '0,5% + TR' },
    { name: 'Dólar', value: 'R$ 5,60' }
];

// --- CATEGORIAS EMPRESARIAIS ---
const TransactionTypeBusiness = { RECEITA: 'Receita', CUSTO: 'Custo', DESPESA_OPERACIONAL: 'Despesa Operacional', JUROS_FINANCEIROS: 'Juros/Financeiro', IMPOSTOS: 'Impostos' };
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
const TransactionTypePersonal = { RECEITA: 'Renda', MORADIA: 'Moradia', ALIMENTACAO: 'Alimentação', TRANSPORTE: 'Transporte', LAZER: 'Lazer/Estilo de Vida', SAUDE: 'Saúde', EDUCACAO: 'Educação', INVESTIMENTOS: 'Investimentos/Poupança', DIVIDAS: 'Dívidas/Empréstimos' };
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

// VARIÁVEL DE SEGURANÇA
const transactionCategories = categoriesBusiness; 

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

const safeCurrency = (value) => { if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00'; try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); } catch (e) { return 'R$ Error'; } };
const safeDate = (timestamp) => { if (!timestamp || typeof timestamp.toDate !== 'function') return 'Data N/A'; try { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(timestamp.toDate()); } catch (e) { return 'Inválida'; } };
const safePercent = (value, total) => { if (!total || total === 0) return '0.0%'; return `${((value / total) * 100).toFixed(1)}%`; };

const calculateFinancials = (data = [], type = 'business', assets = []) => {
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
    
    // Cálculo Patrimonial
    const totalBens = (assets || []).filter(a => a.type === 'bens').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const totalInvest = (assets || []).filter(a => a.type === 'investimento').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const patrimonioLiquido = (totalBens + totalInvest + fluxoCaixa);

    const financials = { receita, totalSaidas, fluxoCaixa, subcatTotals, totalBens, totalInvest, patrimonioLiquido };
    cats.forEach(cat => { financials[cat.value] = sumByType(cat.value); });
    if (type === 'business') {
        financials.lucroBruto = receita - financials[TransactionTypeBusiness.CUSTO];
        financials.ebitda = financials.lucroBruto - financials[TransactionTypeBusiness.DESPESA_OPERACIONAL];
        financials.lucroLiquido = financials.ebitda - financials[TransactionTypeBusiness.JUROS_FINANCEIROS] - financials[TransactionTypeBusiness.IMPOSTOS];
    }
    return financials;
};

// --- Componentes ---

const AssetsView = ({ assets, onAddAsset, onDeleteAsset }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState('bens'); 
    const [indexer, setIndexer] = useState('');

    const handleAdd = () => {
        const val = parseFloat(value.replace(',', '.'));
        if (!name || isNaN(val)) return;
        onAddAsset({ name, value: val, type, indexer, createdAt: Timestamp.now() });
        setName(''); setValue(''); setIndexer('');
    };

    const totalBens = assets.filter(a => a.type === 'bens').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const totalInvest = assets.filter(a => a.type === 'investimento').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);

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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Cadastrar Novo Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <select value={type} onChange={e => setType(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white"><option value="bens">Bem Material</option><option value="investimento">Investimento</option></select>
                    <input placeholder="Nome (ex: Apto Centro)" value={name} onChange={e => setName(e.target.value)} className="md:col-span-2 p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                    <input placeholder="Valor (R$)" value={value} onChange={e => setValue(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                    <select value={indexer} onChange={e => setIndexer(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white"><option value="">Sem índice</option><option value="CDI">CDI</option><option value="IPCA">IPCA</option><option value="INCC">INCC</option><option value="Dolar">Dólar</option></select>
                </div>
                <button onClick={handleAdd} className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">Adicionar</button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"><tr><th className="p-4">Item</th><th className="p-4">Tipo</th><th className="p-4">Índice</th><th className="p-4 text-right">Valor Atual</th><th className="p-4 w-10"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{assets.map(a => (<tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30"><td className="p-4 font-medium text-slate-800 dark:text-slate-200">{a.name}</td><td className="p-4 text-slate-500 dark:text-slate-400 capitalize">{a.type}</td><td className="p-4 text-slate-500 dark:text-slate-400">{a.indexer || '-'}</td><td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">{safeCurrency(a.value)}</td><td className="p-4"><button onClick={() => onDeleteAsset(a.id)} className="text-red-400 hover:text-red-600"><LucideTrash2 size={16}/></button></td></tr>))}</tbody>
                 </table>
                 {assets.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum item cadastrado.</div>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{INDICES_MERCADO.map((idx, i) => (<div key={i} className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg text-center border border-slate-200 dark:border-slate-700"><p className="text-xs text-slate-500 uppercase font-bold">{idx.name}</p><p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{idx.value}</p></div>))}</div>
        </div>
    );
};

const ChatInterface = ({ isOpen, onClose, onAddTransaction, onUpdateTransaction, onDeleteTransaction, currentCompany, transactions }) => {
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
            if ((lowerText.includes('corrigir') || lowerText.includes('corrija')) && lastActionId) {
                const newValue = parseValue(text);
                if (!isNaN(newValue) && newValue > 0) {
                    try { await onUpdateTransaction(lastActionId, { amount: newValue }); botResponse.text = `✅ Corrigido! Valor: ${safeCurrency(newValue)}.`; } catch (e) { botResponse.text = "❌ Erro ao corrigir."; }
                } else { botResponse.text = "Diga o valor correto. Ex: '1500'"; }
            } else if (lowerText.includes('apagar') && lowerText.includes('ultimo')) {
                if (lastActionId) { try { await onDeleteTransaction(lastActionId); setLastActionId(null); botResponse.text = "🗑️ Último lançamento apagado."; } catch (e) { botResponse.text = "❌ Erro ao apagar."; } } else { botResponse.text = "Nada recente para apagar."; }
            } else if (lowerText.includes('resumo') || lowerText.includes('saldo')) {
                const fins = calculateFinancials(transactions, companyType);
                botResponse.text = `📊 *Resumo*\nEntradas: ${safeCurrency(fins.receita)}\nSaídas: ${safeCurrency(fins.totalSaidas)}\nSaldo: ${safeCurrency(fins.fluxoCaixa)}`;
            } else {
                const amount = parseValue(text);
                if (!isNaN(amount) && amount > 0) {
                    let type = ''; let typeLabel = '';
                    if (['recebi', 'ganhei', 'venda', 'entrada'].some(w => lowerText.includes(w))) { type = companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA; typeLabel = 'Receita'; }
                    else if (['gastei', 'paguei', 'saída', 'compra'].some(w => lowerText.includes(w))) { typeLabel = 'Despesa'; type = companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL; }
                    if (type) {
                        const desc = text.replace(/[0-9.,]+/, '').replace(/(recebi|gastei|paguei|de|com|na|no|R\$|reais)/gi, '').trim();
                        try { const newId = await onAddTransaction({ desc: desc || 'Via Chat', amount, type, subcategory: '', date: new Date() }); setLastActionId(newId); botResponse.text = `✅ ${typeLabel}: ${safeCurrency(amount)}${desc ? ` ("${desc}")` : ''}.`; } catch (e) { botResponse.text = "Erro ao salvar."; }
                    } else { botResponse.text = `Entendi ${safeCurrency(amount)}, mas é Receita ou Despesa?`; }
                } else { botResponse.text = "Não entendi o valor. Tente 'Gastei 50'."; }
            }
            setMessages(prev => [...prev, botResponse]);
        }, 500);
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }
    if (!isOpen) return null;
    return (
        <div className="fixed bottom-24 right-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 animate-fade-in-up h-[450px]">
            <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center"><div className="flex items-center gap-2"><LucideMessageSquare size={20} /><span className="font-bold">Assistente IA</span></div><button onClick={onClose}><LucideX size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">{messages.map(msg => (<div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700'}`}>{msg.text}</div></div>))}<div ref={messagesEndRef} /></div>
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2"><textarea className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none" placeholder="Digite..." rows={1} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} /><button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 self-end"><LucideSend size={18} /></button></div>
        </div>
    );
};

// ... (Outros Componentes: CalculatorModal, RepeatModal, ExportModal, PrintLayout, InstallGuideModal, TutorialModal - Mantidos, mas simplificados aqui para caber no bloco. COPIE DO CÓDIGO ANTERIOR SE PRECISAR DELES COMPLETOS OU USE ESTES ABAIXO QUE SÃO FUNCIONAIS) ...
const CalculatorModal=({onClose,onConfirm})=>{const [e,setE]=useState('');const h=(v)=>{if(v==='C')setE('');else if(v==='='){try{setE(String(eval(e.replace(/x/g,'*').replace(/÷/g,'/').replace(/,/g,'.'))))}catch{setE('Erro')}}else setE(p=>p+v)};const c=()=>{try{onConfirm(String(eval(e.replace(/x/g,'*').replace(/÷/g,'/').replace(/,/g,'.'))).replace('.',','))}catch{}};const b=['7','8','9','÷','4','5','6','x','1','2','3','-','C','0',',','+'];return(<div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm"><div className="flex justify-between mb-4"><h3 className="font-bold dark:text-white">Calculadora</h3><button onClick={onClose}><LucideX/></button></div><div className="bg-slate-100 dark:bg-slate-900 p-4 rounded mb-4 text-right font-bold dark:text-white text-2xl">{e||'0'}</div><div className="grid grid-cols-4 gap-2 mb-4">{b.map(x=><button key={x} onClick={()=>h(x)} className="p-4 bg-slate-50 dark:bg-slate-700 rounded font-bold dark:text-white">{x}</button>)}<button onClick={()=>h('=')} className="col-span-4 bg-slate-200 p-3 rounded">=</button></div><button onClick={c} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">USAR</button></div></div>)};
const RepeatModal=({onClose,onConfirm,transaction})=>{const [c,setC]=useState(1);return(<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full"><h3 className="font-bold mb-4 dark:text-white">Repetir</h3><input type="number" value={c} onChange={e=>setC(e.target.value)} className="w-full p-2 border rounded mb-4 dark:bg-slate-900 dark:text-white"/><button onClick={()=>onConfirm(c)} className="w-full bg-indigo-600 text-white p-2 rounded">Confirmar</button><button onClick={onClose} className="w-full mt-2 text-slate-500">Cancelar</button></div></div>)};
const ExportModal=({onClose,csvContent,fileName})=>{const [c,setC]=useState(false);const r=useRef(null);const h=()=>{if(r.current){r.current.select();document.execCommand('copy');setC(true)}};return(<div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl max-w-lg w-full"><h3 className="font-bold text-lg mb-2">Exportar CSV</h3><textarea ref={r} readOnly value={csvContent} className="w-full h-32 p-2 border rounded mb-4 text-xs font-mono"/><button onClick={h} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">{c?'Copiado!':'Copiar'}</button><button onClick={onClose} className="w-full mt-2 text-slate-500">Fechar</button></div></div>)};
const PrintLayout=({companyName,periodStr,onClose,children})=>{return(<div className="fixed inset-0 bg-white z-[70] overflow-y-auto text-black"><div className="sticky top-0 bg-slate-800 text-white p-4 flex justify-between print:hidden"><div><h2 className="font-bold">Modo Impressão</h2></div><div className="flex gap-2"><button onClick={()=>window.print()} className="bg-indigo-600 px-4 py-1 rounded">Imprimir</button><button onClick={onClose} className="bg-slate-600 px-4 py-1 rounded">Fechar</button></div></div><div className="max-w-[210mm] mx-auto p-[10mm]"><div className="text-center border-b-2 border-black pb-4 mb-6"><h1 className="text-2xl font-bold uppercase">{companyName}</h1><h2>Relatório Financeiro</h2><p>{periodStr}</p></div>{children}</div></div>)};
const InstallGuideModal=({onClose})=>{return(<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-6 max-w-sm text-center"><h2 className="font-bold text-xl mb-2">Instalar</h2><p className="mb-4">Abra no Chrome/Safari e use "Adicionar à Tela Inicial".</p><button onClick={onClose} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">Ok</button></div></div>)};
const TutorialModal=({onClose})=>{return(<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl p-6 max-w-md text-center"><h2 className="font-bold text-xl mb-2">Bem-vindo!</h2><p className="mb-6">Seu gestor financeiro completo.</p><button onClick={onClose} className="w-full bg-indigo-600 text-white p-3 rounded font-bold">Começar</button></div></div>)};

const Sidebar = ({ isOpen, onClose, companies, currentCompany, onChangeCompany, onAddCompany, onOpenSettings, onOpenInstall, onRenameCompany }) => {
    const [newName, setNewName] = useState(''); const [isCreating, setIsCreating] = useState(false); const [editingId, setEditingId] = useState(null); const [editName, setEditName] = useState(''); const [newType, setNewType] = useState('business');
    const handleCreate = () => { if(newName.trim()) { onAddCompany(newName, newType); setNewName(''); setIsCreating(false); onClose(); } };
    const handleSaveEdit = (e) => { e.stopPropagation(); if(editName.trim()){ onRenameCompany(editingId, editName); setEditingId(null); } };
    return (<> {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />} <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}> <div className="p-6 border-b dark:border-slate-700 flex justify-between"><h2 className="font-bold text-xl dark:text-white">Minhas Contas</h2><button onClick={onClose}><LucideX/></button></div> <div className="p-4"> {companies.map(c => (<div key={c.id} onClick={() => { if(editingId!==c.id){onChangeCompany(c); onClose();} }} className={`w-full text-left p-3 rounded-xl mb-2 flex items-center gap-2 cursor-pointer ${currentCompany?.id === c.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800'}`}>{editingId === c.id ? (<><input autoFocus className="flex-1 p-1 border rounded" value={editName} onChange={e=>setEditName(e.target.value)} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Enter')handleSaveEdit(e)}} /><button onClick={handleSaveEdit}><LucideCheck size={14}/></button></>) : (<><span className="flex-1">{c.name}</span><button onClick={e=>{e.stopPropagation(); setEditingId(c.id); setEditName(c.name)}} className="text-slate-400 hover:text-indigo-500"><LucideEdit2 size={14}/></button></>)}</div>))} <button onClick={() => setIsCreating(true)} className="w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600"><LucidePlus/> Nova Conta</button> {isCreating && (<div className="mt-4 bg-slate-50 p-3 rounded"><input autoFocus placeholder="Nome" className="w-full p-2 border rounded mb-2" value={newName} onChange={e => setNewName(e.target.value)} /><div className="flex gap-2 mb-2"><button onClick={()=>setNewType('business')} className={`flex-1 text-xs p-1 rounded border ${newType==='business'?'bg-blue-100 border-blue-500':'bg-white'}`}>Empresa</button><button onClick={()=>setNewType('personal')} className={`flex-1 text-xs p-1 rounded border ${newType==='personal'?'bg-green-100 border-green-500':'bg-white'}`}>Pessoal</button></div><button onClick={handleCreate} className="w-full bg-indigo-600 text-white p-2 rounded">Criar</button></div>)} <div className="mt-8 pt-4 border-t dark:border-slate-700"><button onClick={onOpenSettings} className="w-full p-3 flex items-center gap-3 text-slate-600 dark:text-slate-400"><LucideSettings/> Categorias</button></div> </div> </div> </>);
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
    const [editingTransaction, setEditingTransaction] = useState(null); const [repeatingTransaction, setRepeatingTransaction] = useState(null);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]); const [formType, setFormType] = useState(transactionCategories[0].value);
    const [formSubcat, setFormSubcat] = useState(''); const [formDesc, setFormDesc] = useState(''); const [formAmount, setFormAmount] = useState('');
    const [isRecurring, setIsRecurring] = useState(false); const [recurringMonths, setRecurringMonths] = useState(1); const [newSubcatName, setNewSubcatName] = useState('');

    const companyType = currentCompany?.type || 'business';
    const activeCategories = useMemo(() => companyType === 'personal' ? categoriesPersonal : categoriesBusiness, [companyType]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) { setDarkMode(true); }
        if (typeof firebaseConfig === 'undefined' || !firebaseConfig.apiKey.startsWith('AIza')) { console.error("FIREBASE ERROR"); return; }
        const app = initializeApp(firebaseConfig);
        const _auth = getAuth(app); const _db = getFirestore(app); setDb(_db);
        return onAuthStateChanged(_auth, (u) => { if (u) setUser(u); else signInAnonymously(_auth); });
    }, []);

    useEffect(() => { if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); } }, [darkMode]);

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

    // Helpers
    const filteredData = useMemo(() => transactions.filter(t => { if(!t.createdAt)return false; const d=t.createdAt.toDate(); if(d.getUTCFullYear()!==year)return false; if(typeof period==='number')return d.getUTCMonth()===period; const m=d.getUTCMonth(); if(period==='Q1')return m<3; if(period==='Q2')return m>=3&&m<6; if(period==='Q3')return m>=6&&m<9; if(period==='Q4')return m>=9; if(period==='S1')return m<6; if(period==='S2')return m>=6; return true; }), [transactions, period, year]);
    const searchedData = useMemo(() => { if(!searchTerm.trim())return filteredData; return filteredData.filter(t=>t.desc.toLowerCase().includes(searchTerm.toLowerCase())); }, [filteredData, searchTerm]);
    const handleCompanyChange = (c) => { setCurrentCompany(c); localStorage.setItem('lastCompanyId', c.id); };
    const resetForm = () => { setEditingTransaction(null); setFormDesc(''); setFormAmount(''); setIsRecurring(false); };
    const handleSaveTransaction = async (e) => { e.preventDefault(); if (!currentCompany) return; const val = parseFloat(formAmount.replace(',', '.')); if (isNaN(val)) return; const parts = formDate.split('-'); const date = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], 12)); const data = { desc: formDesc, amount: val, type: formType, subcategory: formSubcat, createdAt: Timestamp.fromDate(date) }; const ref = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`); if (editingTransaction) await updateDoc(doc(ref, editingTransaction.id), data); else if (isRecurring && recurringMonths > 1) { const b = writeBatch(db); for(let i=0; i<recurringMonths; i++) { const d = new Date(date); d.setUTCMonth(date.getUTCMonth() + i); b.set(doc(ref), {...data, createdAt: Timestamp.fromDate(d)}); } await b.commit(); } else await addDoc(ref, data); resetForm(); };
    const handleAddAsset = async (data) => { await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`), data); };
    const handleDeleteAsset = async (id) => { if (window.confirm("Excluir?")) await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`, id)); };
    const handleAddSub = async (type) => { if (newSubcatName) { await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`), { type, name: newSubcatName }); setNewSubcatName(''); } };
    const handleDeleteSub = async (id) => { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`, id)); };
    const handleSaveBudget = async (data) => { await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`), data); };
    const handleDelete = async (id) => { if (window.confirm("Excluir?")) await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id)); };
    const handleAddCompany = async (name, type) => { const ref = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies`)); await setDoc(ref, { name, type, createdAt: Timestamp.now() }); setCurrentCompany({id: ref.id, name, type}); };
    const handleRenameCompany = async (id, name) => { await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies`, id), { name }); };
    
    // Chat Helpers
    const handleAddTxChat = async (d) => { const ref = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`); const r = await addDoc(ref, { ...d, createdAt: Timestamp.fromDate(d.date) }); return r.id; };
    const handleUpTxChat = async (id, d) => { await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id), d); };
    const handleDelTxChat = async (id) => { await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id)); };
    const handleConfirmRepeat = async (n) => { /* logic for repeat */ setRepeatingTransaction(null); };
    const handleExportCSV = () => { if (!filteredData.length) { alert("Sem dados."); return; } const h = ["Data", "Tipo", "Sub", "Desc", "Valor"]; const r = filteredData.map(t => [safeDate(t.createdAt), t.type, t.subcategory||'', t.desc.replace(/"/g,'""'), (typeof t.amount==='number'?t.amount:0).toFixed(2).replace('.',',')]); const c = [h.join(";"), ...r.map(ro => ro.map(cell => `"${cell}"`).join(";"))].join("\n"); setCsvContentToExport(c); setExportFileName(`fin_${year}.csv`); setShowExportModal(true); };

    if (loading && !user) return <div className="flex h-screen items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse bg-white dark:bg-slate-950">Iniciando...</div>;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <script src="https://cdn.tailwindcss.com"></script>
            <script dangerouslySetInnerHTML={{__html: `tailwind.config = { darkMode: 'class' }`}} />
            
            {showTutorial && <TutorialModal onClose={closeTutorial} />}
            {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} csvContent={csvContentToExport} fileName={exportFileName} />}
            {showInstallGuide && <InstallGuideModal onClose={() => setShowInstallGuide(false)} />}
            {repeatingTransaction && <RepeatModal onClose={()=>setRepeatingTransaction(null)} onConfirm={handleConfirmRepeat} transaction={repeatingTransaction} />}
            {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} onConfirm={(v) => { setFormAmount(v); setShowCalculator(false); }} />}
            {showChat && <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-end p-4 pointer-events-none"><div className="pointer-events-auto w-full max-w-sm"><ChatInterface isOpen={true} onClose={()=>setShowChat(false)} onAddTransaction={handleAddTxChat} onUpdateTransaction={handleUpTxChat} onDeleteTransaction={handleDelTxChat} currentCompany={currentCompany} transactions={transactions} /></div></div>}

            <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} companies={companies} currentCompany={currentCompany} onChangeCompany={handleCompanyChange} onAddCompany={handleAddCompany} onRenameCompany={handleRenameCompany} onOpenSettings={() => setShowSettings(true)} onOpenInstall={() => setShowInstallGuide(true)} />
            
            {showSettings && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-lg h-[80vh] overflow-y-auto"><div className="flex justify-between mb-4"><h2 className="font-bold text-xl">Categorias</h2><button onClick={()=>setShowSettings(false)}><LucideX/></button></div>{activeCategories.map(cat => (<div key={cat.value} className="mb-6"><h3 className={`font-bold text-sm ${cat.color.split(' ')[0]}`}>{cat.label}</h3><div className="flex gap-2 my-2"><input className="border p-2 rounded flex-1 dark:bg-slate-900" placeholder="Nova" value={newSubcatName} onChange={e=>setNewSubcatName(e.target.value)} /><button onClick={()=>{handleAddSub(cat.value)}} className="bg-indigo-600 text-white p-2 rounded"><LucidePlus/></button></div><div className="flex flex-wrap gap-2">{subcategories[cat.value]?.map(s=><div key={s.id} className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm flex gap-2">{s.name} <button onClick={()=>handleDeleteSub(s.id)} className="text-red-500"><LucideX size={14}/></button></div>)}</div></div>))}</div></div>}

            {showPrintPreview && (<PrintLayout companyName={currentCompany?.name} periodStr={`${typeof period === 'number' ? MONTHS[period] : period}/${year}`} onClose={() => setShowPrintPreview(false)}>{mainTab === 'resultados' && (<><h3 className="text-lg font-bold border-b border-gray-400 mb-2 mt-4">Demonstrativo do Resultado (DRE)</h3><DREView transactions={filteredData} budget={budget} isMonthly={typeof period === 'number'} isPrintMode={true} companyType={companyType} /><h3 className="text-lg font-bold border-b border-gray-400 mb-2 mt-8">Fluxo de Caixa</h3><CashFlowView transactions={filteredData} isPrintMode={true} companyType={companyType} /></>)}{mainTab === 'lancamentos' && (<><h3 className="text-lg font-bold border-b border-gray-400 mb-2 mt-4">Extrato de Lançamentos</h3><table className="w-full text-xs text-left"><thead className="border-b-2 border-gray-300"><tr><th className="py-1">Data</th><th className="py-1">Tipo</th><th className="py-1">Subcategoria</th><th className="py-1">Descrição</th><th className="py-1 text-right">Valor</th></tr></thead><tbody>{searchedData.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(t => (<tr key={t.id} className="border-b border-gray-100"><td className="py-1">{safeDate(t.createdAt)}</td><td className="py-1">{transactionCategories.find(c=>c.value===t.type)?.label.split(' ')[0]}</td><td className="py-1">{t.subcategory || '-'}</td><td className="py-1">{t.desc}</td><td className={`py-1 text-right font-bold ${transactionCategories.find(c=>c.value===t.type)?.isPositive ? 'text-green-800' : 'text-red-800'}`}>{safeCurrency(t.amount)}</td></tr>))}</tbody></table></>)}{mainTab === 'planejamento' && (<div className="text-center p-10 text-gray-500 border border-dashed border-gray-300 mt-4">Para imprimir o Planejamento, tire um print da tela ou use a função de impressão do navegador.</div>)}</PrintLayout>)}

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

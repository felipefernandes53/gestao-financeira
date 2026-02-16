import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, doc, collection, onSnapshot, query, addDoc, Timestamp,
    getDoc, deleteDoc, updateDoc, orderBy, setDoc, writeBatch, where, getDocs
} from 'firebase/firestore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
    Trash2 as LucideTrash2, Building2 as LucideBuilding2, Plus as LucidePlus, Edit2 as LucideEdit2, X as LucideX, Settings as LucideSettings, 
    Target as LucideTarget, Search as LucideSearch, Home as LucideHome, RefreshCw as LucideRefresh, AlertCircle as LucideAlertCircle, 
    UserCircle as LucideUserCircle, Rocket as LucideRocket, Moon as LucideMoon, Sun as LucideSun, Calculator as LucideCalculator, 
    Menu as LucideMenu, MessageSquare as LucideMessageSquare, Send as LucideSend, TrendingUp as LucideTrendingUp, Briefcase as LucideBriefcase, User as LucideUser,
    ArrowUpRight as LucideArrowUpRight
} from 'lucide-react';

// ============================================================================
// 1. CONFIGURAÇÕES E CONSTANTES GLOBAIS
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

const TransactionTypeBusiness = { 
    RECEITA: 'Receita', CUSTO: 'Custo', DESPESA_OPERACIONAL: 'Despesa Operacional', JUROS_FINANCEIROS: 'Juros/Financeiro', IMPOSTOS: 'Impostos' 
};

const categoriesBusiness = [
    { value: TransactionTypeBusiness.RECEITA, label: 'Receita (+)', color: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30', isPositive: true },
    { value: TransactionTypeBusiness.CUSTO, label: 'Custos (-)', color: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30', isPositive: false },
    { value: TransactionTypeBusiness.DESPESA_OPERACIONAL, label: 'Desp. Operacionais (-)', color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30', isPositive: false },
    { value: TransactionTypeBusiness.JUROS_FINANCEIROS, label: 'Juros/Financeiro (-)', color: 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30', isPositive: false },
    { value: TransactionTypeBusiness.IMPOSTOS, label: 'Impostos (-)', color: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30', isPositive: false },
];

const TransactionTypePersonal = { 
    RECEITA: 'Renda', MORADIA: 'Moradia', ALIMENTACAO: 'Alimentação', TRANSPORTE: 'Transporte', LAZER: 'Lazer/Estilo de Vida', SAUDE: 'Saúde', EDUCACAO: 'Educação', INVESTIMENTOS: 'Investimentos/Poupança', DIVIDAS: 'Dívidas/Empréstimos' 
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

const defaultSubcategoriesBusiness = {
    [TransactionTypeBusiness.RECEITA]: ['Vendas de Produtos', 'Prestação de Serviços', 'Rendimentos'],
    [TransactionTypeBusiness.CUSTO]: ['Mercadoria (CMV)', 'Matéria-Prima', 'Fretes'],
    [TransactionTypeBusiness.DESPESA_OPERACIONAL]: ['Salários', 'Aluguel', 'Marketing', 'Energia/Água'],
    [TransactionTypeBusiness.JUROS_FINANCEIROS]: ['Tarifas Bancárias', 'Juros Empréstimos'],
    [TransactionTypeBusiness.IMPOSTOS]: ['Simples Nacional', 'ICMS', 'ISS']
};

const defaultSubcategoriesPersonal = {
    [TransactionTypePersonal.RECEITA]: ['Salário', 'Freelance', 'Dividendos'],
    [TransactionTypePersonal.MORADIA]: ['Aluguel/Condomínio', 'Luz', 'Água', 'Internet'],
    [TransactionTypePersonal.ALIMENTACAO]: ['Supermercado', 'Restaurantes'],
    [TransactionTypePersonal.TRANSPORTE]: ['Combustível', 'Uber/99'],
    [TransactionTypePersonal.LAZER]: ['Viagens', 'Streaming'],
    [TransactionTypePersonal.SAUDE]: ['Farmácia', 'Plano de Saúde'],
    [TransactionTypePersonal.EDUCACAO]: ['Cursos', 'Livros'],
    [TransactionTypePersonal.INVESTIMENTOS]: ['Ações', 'CDB'],
    [TransactionTypePersonal.DIVIDAS]: ['Cartão de Crédito', 'Empréstimo']
};

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
    
    const receitaKey = type === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA;
    const receita = sumByType(receitaKey);
    let totalSaidas = 0;
    cats.forEach(cat => { if (!cat.isPositive) totalSaidas += sumByType(cat.value); });
    const fluxoCaixa = receita - totalSaidas;
    
    const totalBens = (assets || []).filter(a => a.type === 'bens').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
    const totalInvest = (assets || []).filter(a => a.type === 'investimento').reduce((acc, c) => acc + (parseFloat(c.value) || 0), 0);
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
// 3. COMPONENTES DE INTERFACE
// ============================================================================

const AssetsView = ({ assets, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState('bens'); 
    const [indexer, setIndexer] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [marketData, setMarketData] = useState({ CDI: '...', SELIC: '...' });

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                let hgData = { taxes: [{ cdi: 11.25, selic: 11.25 }] }; 
                try {
                    const resHg = await fetch(`https://api.hgbrasil.com/finance/taxes?key=855e9e8f&format=json-cors`);
                    const jsonHg = await resHg.json();
                    if(jsonHg.results) hgData = jsonHg.results;
                } catch(e) {}
                setMarketData({ CDI: `${hgData[0]?.cdi || 11.25}%`, SELIC: `${hgData[0]?.selic || 11.25}%` });
            } catch (err) { }
        };
        fetchMarketData();
    }, []);

    const handleSave = () => {
        const val = parseFloat(value.replace(/\./g, '').replace(',', '.')); 
        if (!name || isNaN(val)) return;
        
        const assetData = { name, value: val, type, indexer };
        
        if (editingId) {
            onUpdateAsset(editingId, assetData);
            setEditingId(null);
        } else {
            onAddAsset({ ...assetData, createdAt: Timestamp.now() });
        }
        
        setName(''); setValue(''); setIndexer(''); setType('bens');
    };

    const handleEdit = (asset) => {
        setName(asset.name);
        setValue(asset.value.toString().replace('.', ','));
        setType(asset.type);
        setIndexer(asset.indexer || '');
        setEditingId(asset.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null); setName(''); setValue(''); setIndexer(''); setType('bens');
    };

    const getDailyReturn = (val, idx) => {
        let rate = 0;
        if(idx === 'CDI' || idx === 'SELIC') rate = 0.1125;
        if(idx === 'IPCA') rate = 0.045;
        if(idx === 'INCC') rate = 0.04;
        if(rate === 0) return 0;
        return (val * rate) / 365;
    };

    const getCorrectedValue = (asset) => {
        const daily = getDailyReturn(asset.value, asset.indexer);
        if (daily === 0 || !asset.createdAt) return asset.value;
        
        const now = new Date();
        const created = asset.createdAt.toDate();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        return asset.value + (daily * diffDays);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2 flex justify-center items-center gap-2"><LucideHome size={16}/> Bens Materiais</h3>
                    <p className="text-3xl font-bold">{safeCurrency(assets.filter(a=>a.type==='bens').reduce((acc,c)=>acc+c.value, 0))}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-500 text-sm font-bold uppercase mb-2 flex justify-center items-center gap-2"><LucideTrendingUp size={16}/> Investimentos</h3>
                    <p className="text-3xl font-bold text-green-600">{safeCurrency(assets.filter(a=>a.type==='investimento').reduce((acc,c)=>acc+c.value, 0))}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    {editingId ? <LucideEdit2 className="text-indigo-600"/> : <LucidePlus className="text-indigo-600"/>} 
                    {editingId ? 'Editar Patrimônio' : 'Cadastrar Novo Patrimônio'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <select value={type} onChange={e => setType(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"><option value="bens">Bem Material</option><option value="investimento">Investimento</option></select>
                    <input placeholder="Ex: Veículo Corolla" value={name} onChange={e => setName(e.target.value)} className="md:col-span-2 p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input placeholder="Valor (R$)" value={value} onChange={e => setValue(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select value={indexer} onChange={e => setIndexer(e.target.value)} className="p-2 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Sem índice</option><option value="CDI">CDI</option><option value="IPCA">IPCA</option><option value="INCC">INCC</option><option value="Dolar">Dólar</option></select>
                </div>
                <div className="flex gap-2 mt-3">
                    <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700">
                        {editingId ? <LucideRefresh size={18}/> : <LucidePlus size={18}/>} 
                        {editingId ? 'Atualizar' : 'Adicionar ao Patrimônio'}
                    </button>
                    {editingId && (
                        <button onClick={handleCancelEdit} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-white rounded-lg font-bold transition-all">
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr><th className="p-4">Item Patrimonial</th><th className="p-4">Tipo</th><th className="p-4">Reajuste</th><th className="p-4 text-right">Valor Inicial</th><th className="p-4 text-right text-indigo-600">Valor Corrigido</th><th className="p-4 text-right">Rend. Diário</th><th className="p-4 w-24">Ações</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                        {assets.map(a => {
                            const corrected = getCorrectedValue(a);
                            return (
                            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                <td className="p-4 font-bold">{a.name}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${a.type === 'bens' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{a.type.toUpperCase()}</span></td>
                                <td className="p-4 font-mono">{a.indexer || '-'}</td>
                                <td className="p-4 text-right font-medium text-slate-500">{safeCurrency(a.value)}</td>
                                <td className="p-4 text-right text-indigo-600 font-black flex items-center justify-end gap-1">
                                    {a.indexer ? <LucideArrowUpRight size={14}/> : null}
                                    {safeCurrency(corrected)}
                                </td>
                                <td className="p-4 text-right text-green-600 font-mono font-bold text-xs">+{safeCurrency(getDailyReturn(a.value, a.indexer))}</td>
                                <td className="p-4 flex gap-2 justify-end">
                                    <button onClick={() => handleEdit(a)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"><LucideEdit2 size={16}/></button>
                                    <button onClick={() => onDeleteAsset(a.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><LucideTrash2 size={16}/></button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                 </table>
                 {assets.length === 0 && <div className="p-12 text-center text-slate-400 italic">Sua carteira de patrimônio está vazia.</div>}
            </div>
        </div>
    );
};

const ChatInterface = ({ isOpen, onClose, onAddTransaction, onAddRecurringTransaction, onAddAsset, currentCompany }) => {
    const [messages, setMessages] = useState([{ id: 1, text: "Olá! Sou o seu Assistente IA. Como posso ajudar na organização das suas finanças hoje?", sender: 'bot' }]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);
    const companyType = currentCompany?.type || 'business';

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    const detectCategory = (text, isIncome) => {
        const t = text.toLowerCase();
        
        // Dicionário de Palavras-Chave
        const keywords = {
            business: {
                [TransactionTypeBusiness.CUSTO]: ['fornecedor', 'mercadoria', 'estoque', 'frete', 'materia', 'peça', 'insumo'],
                [TransactionTypeBusiness.DESPESA_OPERACIONAL]: ['aluguel', 'luz', 'agua', 'internet', 'salario', 'funcionario', 'marketing', 'prolabore', 'limpeza', 'manutencao', 'contador', 'sistema'],
                [TransactionTypeBusiness.IMPOSTOS]: ['das', 'simples', 'icms', 'iss', 'darj', 'imposto', 'tributo', 'guia'],
                [TransactionTypeBusiness.JUROS_FINANCEIROS]: ['banco', 'taxa', 'juros', 'emprestimo', 'financiamento', 'tarifa'],
                [TransactionTypeBusiness.RECEITA]: ['venda', 'faturamento', 'pix', 'recebimento', 'serviço', 'cliente']
            },
            personal: {
                [TransactionTypePersonal.ALIMENTACAO]: ['mercado', 'ifood', 'restaurante', 'lanche', 'pizza', 'hamburguer', 'comida', 'almoco', 'jantar', 'padaria'],
                [TransactionTypePersonal.MORADIA]: ['aluguel', 'condominio', 'luz', 'agua', 'gas', 'energia', 'casa', 'apt'],
                [TransactionTypePersonal.TRANSPORTE]: ['uber', '99', 'gasolina', 'posto', 'onibus', 'metro', 'combustivel', 'taxi', 'carro', 'moto'],
                [TransactionTypePersonal.LAZER]: ['cinema', 'netflix', 'viagem', 'jogo', 'spotify', 'lazer', 'passeio', 'bar'],
                [TransactionTypePersonal.SAUDE]: ['farmacia', 'medico', 'remedio', 'plano', 'dentista', 'hospital', 'exame'],
                [TransactionTypePersonal.EDUCACAO]: ['curso', 'livro', 'faculdade', 'escola', 'aula', 'material'],
                [TransactionTypePersonal.INVESTIMENTOS]: ['aporte', 'corretora', 'investimento'],
                [TransactionTypePersonal.DIVIDAS]: ['cartao', 'fatura', 'divida', 'parcela'],
                [TransactionTypePersonal.RECEITA]: ['salario', 'pix', 'deposito', 'venda', 'freela']
            }
        };

        const currentDict = companyType === 'personal' ? keywords.personal : keywords.business;
        
        // 1. Tenta achar no dicionário
        for (const [category, words] of Object.entries(currentDict)) {
            if (words.some(word => t.includes(word))) return category;
        }

        // 2. Fallback inteligente se não achar palavra chave
        if (isIncome) {
            return companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA;
        } else {
            // Se for empresa, padrão é despesa operacional. Se pessoal, padrão é Alimentação (mas pode mudar para 'Outros' se tivesse)
            return companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.DESPESA_OPERACIONAL;
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText; 
        const lowerText = text.toLowerCase();
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user' }]);
        setInputText('');

        setTimeout(async () => {
            let botResponse = { id: Date.now() + 1, text: '', sender: 'bot' };
            
            const quantityMatch = text.match(/(\d+)\s*meses/i);
            const months = quantityMatch ? parseInt(quantityMatch[1]) : 1;
            let textToSearchMoney = text;
            if (quantityMatch) textToSearchMoney = text.replace(quantityMatch[0], '');

            const moneyRegex = /(?:r\$|reais)?\s*(\d+(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;
            const moneyMatch = textToSearchMoney.match(moneyRegex);
            const amount = moneyMatch ? parseFloat(moneyMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

            const isAsset = ['investi', 'comprei', 'patrimonio', 'imovel', 'carro', 'cdb', 'fii', 'acoes'].some(w => lowerText.includes(w));
            const isIncome = ['recebi', 'ganhei', 'faturamento', 'venda', 'lucro', 'entrada', 'salario', 'caiu'].some(w => lowerText.includes(w));
            const isRecurring = months > 1 || lowerText.includes('fixa') || lowerText.includes('todo mes');

            if (isAsset && amount > 0) {
                const name = text.replace(moneyMatch[0], '').replace(/(investi|comprei|um|uma|no|na|em|reais|R\$|patrimonio|carro|imovel|cdb)/gi, '').trim();
                const type = (lowerText.includes('invest') || lowerText.includes('cdb') || lowerText.includes('ação')) ? 'investimento' : 'bens';
                let idx = lowerText.includes('cdi') ? 'CDI' : lowerText.includes('ipca') ? 'IPCA' : lowerText.includes('incc') ? 'INCC' : '';
                try {
                    await onAddAsset({ name: name || 'Novo Patrimônio', value: amount, type, indexer: idx, createdAt: Timestamp.now() });
                    botResponse.text = `🏛️ Registrei o ${type} "${name || 'Patrimônio'}" no valor de ${safeCurrency(amount)} na sua aba de PATRIMÔNIO.`;
                } catch(e) { botResponse.text = "Desculpe, falhei ao gravar este bem."; }
            }
            else if (isRecurring && amount > 0) {
                const cleanDesc = text.replace(moneyMatch ? moneyMatch[0] : '', '').replace(quantityMatch ? quantityMatch[0] : '', '').replace(/(meses|por|durante|reais|fixa|despesa|R\$|todo mes|recorrente)/gi, '').trim();
                const type = detectCategory(lowerText, isIncome);
                
                try {
                    await onAddRecurringTransaction({ desc: cleanDesc || 'Recorrente', amount, type, months: months > 1 ? months : 12 });
                    botResponse.text = `🔄 Agendado! "${cleanDesc || 'Despesa'}" de ${safeCurrency(amount)} classificado como *${type}* mensalmente por ${months > 1 ? months : 12} meses.`;
                } catch(e) { botResponse.text = "Erro ao processar as parcelas futuras."; }
            }
            else if (amount > 0) {
                const type = detectCategory(lowerText, isIncome);
                const cleanDesc = text.replace(moneyMatch[0], '').replace(/(recebi|gastei|paguei|ganhei|de|com|na|no|reais|R\$)/gi, '').trim();
                try {
                    await onAddTransaction({ desc: cleanDesc || 'Lançamento IA', amount, type, subcategory: '', date: new Date() });
                    botResponse.text = `✅ Lançamento de ${safeCurrency(amount)} em "${cleanDesc || 'Geral'}" classificado como *${type}* concluído com sucesso.`;
                } catch(e) { botResponse.text = "Erro técnico ao guardar lançamento."; }
            }
            else {
                botResponse.text = "Não consegui extrair os dados. Tente algo como: 'Uber 35 reais' ou 'Recebi 1200 de aluguel'.";
            }
            setMessages(prev => [...prev, botResponse]);
        }, 500);
    };

    return (
        <div className="fixed bottom-24 right-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 h-[480px] animate-fade-in-up">
            <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center shadow-lg"><div className="flex items-center gap-2"><LucideMessageSquare size={20} /><span className="font-bold tracking-tight">Assistente IA</span></div><button onClick={onClose}><LucideX size={20} /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border rounded-bl-none shadow-sm border-slate-100 dark:border-slate-700'}`}>{msg.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shadow-inner">
                <textarea className="flex-1 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none max-h-32" placeholder="Dê a sua ordem..." rows={1} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 self-end shadow-md transition-all active:scale-95"><LucideSend size={18} /></button>
            </div>
        </div>
    );
};

const BudgetPlanningView = ({ budget, subcategories, onSaveBudget, isMonthly, companyType }) => {
    const [localBudget, setLocalBudget] = useState({});
    const [localSubBudget, setLocalSubBudget] = useState({});
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;

    useEffect(() => {
        if (budget) {
            setLocalBudget(budget || {});
            setLocalSubBudget(budget?.subcategories || {});
        } else {
            setLocalBudget({});
            setLocalSubBudget({});
        }
    }, [budget]);

    if (!isMonthly) return <div className="p-12 text-center text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed">Selecione um mês para planejar as metas financeiras.</div>;

    const handleMainChange = (type, value) => setLocalBudget(prev => ({ ...prev, [type]: parseFloat(value) || 0 }));
    const handleSubChange = (type, subName, value) => {
        const key = `${type}:${subName}`;
        const numVal = parseFloat(value) || 0;
        setLocalSubBudget(prev => {
            const newSubs = { ...prev, [key]: numVal };
            const currentTypeSubs = Object.entries(newSubs).filter(([k]) => k.startsWith(type + ':')).reduce((sum, [, val]) => sum + val, 0);
            setLocalBudget(prevMain => ({ ...prevMain, [type]: currentTypeSubs }));
            return newSubs;
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border shadow-sm animate-fade-in">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-800 dark:text-white uppercase tracking-tighter"><LucideTarget className="text-indigo-600" /> Planejamento Orçamentário</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {cats.map(cat => (
                    <div key={cat.value} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border dark:border-slate-700">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className={`font-black text-xs uppercase tracking-widest ${cat.color.split(' ')[0]}`}>{cat.label}</h3>
                            <div className="relative w-36"><span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">R$</span><input type="number" value={localBudget[cat.value] || ''} onChange={e => handleMainChange(cat.value, e.target.value)} className="w-full pl-8 p-2 text-right border rounded-lg bg-white dark:bg-slate-800 font-bold" /></div>
                        </div>
                        <div className="space-y-3">
                            {(subcategories[cat.value] || []).map(sub => (
                                <div key={sub.id} className="flex justify-between items-center text-sm group">
                                    <span className="text-slate-500 font-medium group-hover:text-slate-800 transition-colors">{sub.name}</span>
                                    <input type="number" value={localSubBudget[`${cat.value}:${sub.name}`] || ''} onChange={e => handleSubChange(cat.value, sub.name, e.target.value)} className="w-28 p-1.5 text-right border rounded-md bg-white dark:bg-slate-800 text-xs font-bold" placeholder="0,00" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => onSaveBudget({ ...localBudget, subcategories: localSubBudget })} className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest">GUARDAR PLANEJAMENTO</button>
        </div>
    );
};

const DREView = ({ transactions, companyType }) => {
    const real = useMemo(() => calculateFinancials(transactions, companyType), [transactions, companyType]);
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border dark:border-slate-800 animate-fade-in">
            <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-900/50 p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"><div>Descrição</div><div className="text-right">Realizado (R$)</div></div>
            <div className="divide-y dark:divide-slate-700">
                {cats.map(c => (
                    <div key={c.value} className="flex justify-between p-5 items-center hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                        <span className="font-bold text-sm text-slate-600 dark:text-slate-300 uppercase tracking-tight">{c.label}</span>
                        <span className={`font-black text-base ${c.isPositive ? 'text-green-600' : 'text-red-500'}`}>{c.isPositive ? '' : '-'}{safeCurrency(real[c.value] || 0)}</span>
                    </div>
                ))}
                <div className="flex justify-between p-8 items-center bg-indigo-50/50 dark:bg-indigo-900/10">
                    <span className="font-black text-indigo-950 dark:text-indigo-200 text-xl uppercase italic tracking-tighter">Saldo Total</span>
                    <span className={`font-black text-3xl ${real.fluxoCaixa >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{safeCurrency(real.fluxoCaixa)}</span>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 4. COMPONENTE PRINCIPAL (APP)
// ============================================================================

export default function App() {
    const [user, setUser] = useState(null);
    const [db, setDb] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [subcategories, setSubcategories] = useState({});
    const [assets, setAssets] = useState([]);
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
    const [showTutorial, setShowTutorial] = useState(false);
    const [showUpdateMessage, setShowUpdateMessage] = useState(false);
    const [showInitialChoice, setShowInitialChoice] = useState(false);
    const [deletingRecurring, setDeletingRecurring] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm }
    const [budget, setBudget] = useState({});

    // Assistente IA Draggable State
    const [chatPos, setChatPos] = useState({ x: 32, y: 32 });
    const [isDragging, setIsDragging] = useState(false);
    const chatBtnRef = useRef(null);

    // Form States
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

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') setDarkMode(true);
        const app = initializeApp(firebaseConfig);
        const _auth = getAuth(app); const _db = getFirestore(app); setDb(_db);
        
        const updateViews = parseInt(localStorage.getItem('upd_v48_final') || '0');
        if (updateViews < 2) { setShowUpdateMessage(true); localStorage.setItem('upd_v48_final', (updateViews + 1).toString()); }
        if (!localStorage.getItem('hasSeenFinTutorial_v48')) setShowTutorial(true);

        return onAuthStateChanged(_auth, (u) => { if (u) setUser(u); else signInAnonymously(_auth); });
    }, []);

    useEffect(() => { if (darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [darkMode]);

    useEffect(() => {
        if (!user || !db) return;
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies`), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snap) => {
            const comps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCompanies(comps);
            
            if (comps.length > 0) {
                if (!currentCompany || !comps.find(c => c.id === currentCompany.id)) {
                    const lastId = localStorage.getItem('lastCompanyId');
                    const found = comps.find(c => c.id === lastId);
                    setCurrentCompany(found || comps[0]);
                }
            } else {
                setCurrentCompany(null);
                setShowInitialChoice(true);
            }
            setLoading(false);
        });
    }, [user, db, currentCompany]);

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

    useEffect(() => {
        if (!user || !db || !currentCompany || typeof period !== 'number') return;
        getDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`)).then(snap => setBudget(snap.exists() ? snap.data() : {}));
    }, [user, db, period, year, currentCompany]);

    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            if (!t.createdAt) return false;
            const d = t.createdAt.toDate();
            if (period === 'ALL') return true; 
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

    const openConfirm = (title, message, onConfirm) => {
        setConfirmModal({ title, message, onConfirm });
    };

    const handleAddRecurringTransaction = async ({ desc, amount, type, months }) => {
        if (!user || !currentCompany) return;
        const collectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`);
        const batch = writeBatch(db);
        const seriesId = crypto.randomUUID();
        const today = new Date();
        for (let i = 0; i < months; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, today.getDate(), 12, 0, 0);
            batch.set(doc(collectionRef), { desc: `${desc} (${i+1}/${months})`, amount, type, recurringId: seriesId, createdAt: Timestamp.fromDate(d) });
        }
        await batch.commit();
    };

    const handleDeleteSeries = async (id, isSeries) => {
        const target = transactions.find(t => t.id === id);
        if (!target) return;
        if (isSeries && target.recurringId) {
            const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`), where('recurringId', '==', target.recurringId));
            const snap = await getDocs(q);
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } else {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`, id));
        }
        setDeletingRecurring(null);
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        const val = parseFloat(formAmount.replace(/\./g, '').replace(',', '.'));
        if (isNaN(val)) return;
        const date = new Date(formDate + 'T12:00:00');
        const ref = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`);
        if (editingTransaction) {
            await updateDoc(doc(ref, editingTransaction.id), { desc: formDesc, amount: val, type: formType, subcategory: formSubcat });
        } else if (isRecurring && recurringMonths > 1) {
            await handleAddRecurringTransaction({ desc: formDesc, amount: val, type: formType, months: recurringMonths });
        } else {
            await addDoc(ref, { desc: formDesc, amount: val, type: formType, subcategory: formSubcat, createdAt: Timestamp.fromDate(date) });
        }
        setEditingTransaction(null); setFormDesc(''); setFormAmount(''); setIsRecurring(false);
    };

    const handleEditClick = (t) => {
        setMainTab('lancamentos');
        setEditingTransaction(t);
        setFormDesc(t.desc);
        setFormAmount(t.amount.toString().replace('.', ','));
        setFormType(t.type);
        setFormSubcat(t.subcategory || '');
        if (t.createdAt) setFormDate(t.createdAt.toDate().toISOString().split('T')[0]);
    };

    const handleCreateCompany = async (name, type) => {
        if (!name || !user) return;
        const newCompRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies`));
        await setDoc(newCompRef, { name, type, createdAt: Timestamp.now() });
        const batch = writeBatch(db);
        const subCats = type === 'personal' ? defaultSubcategoriesPersonal : defaultSubcategoriesBusiness;
        Object.entries(subCats).forEach(([catType, names]) => {
            names.forEach(n => {
                const ref = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${newCompRef.id}/subcategories`));
                batch.set(ref, { name: n, type: catType });
            });
        });
        await batch.commit();
        setShowInitialChoice(false);
    };

    const handleDeleteCompanyRequest = (companyId) => {
        if (!user || !companyId) return;
        openConfirm(
            "Excluir Conta",
            "Deseja realmente excluir esta conta? Os dados visuais serão removidos permanentemente.",
            async () => {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies`, companyId));
                if (companies.length <= 1) setShowInitialChoice(true);
            }
        );
    };

    const handleDeleteAssetRequest = (id) => {
        openConfirm(
            "Excluir Bem",
            "Tem certeza que deseja remover este item do patrimônio?",
            () => deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`, id))
        );
    };

    const handleCompanyChange = (company) => {
        setCurrentCompany(company);
        localStorage.setItem('lastCompanyId', company.id);
        setShowSidebar(false);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) setIsDragging(true);
        const touch = e.touches[0];
        const newX = window.innerWidth - touch.clientX - 25;
        const newY = window.innerHeight - touch.clientY - 25;
        setChatPos({ 
            x: Math.max(0, Math.min(newX, window.innerWidth - 60)), 
            y: Math.max(0, Math.min(newY, window.innerHeight - 60)) 
        });
    };

    const handleTouchEnd = () => {
        setTimeout(() => setIsDragging(false), 100);
    };

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-indigo-400"><LucideRefresh className="animate-spin mb-4" size={48} /><p className="font-black animate-pulse uppercase tracking-widest text-xs">A preparar o seu sistema financeiro...</p></div>;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <header className="max-w-5xl mx-auto p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={()=>setShowSidebar(true)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-md"><LucideMenu size={28} /></button>
                    <div><h1 className="text-3xl font-black tracking-tighter">Gestão Financeira</h1><p className="text-xs text-indigo-600 font-bold uppercase tracking-widest flex items-center gap-1"><LucideBuilding2 size={12} /> {currentCompany?.name}</p></div>
                    <button onClick={()=>setShowCalculator(true)} className="p-2 text-indigo-600 hover:scale-110 transition-transform"><LucideCalculator size={24}/></button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={()=>setDarkMode(!darkMode)} className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm">{darkMode ? <LucideSun className="text-amber-400"/> : <LucideMoon className="text-indigo-600"/>}</button>
                    <select className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-md font-bold outline-none border-0" value={period} onChange={e => setPeriod(isNaN(e.target.value) ? e.target.value : parseInt(e.target.value))}>{PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                    {period !== 'ALL' && <select className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-md font-bold outline-none border-0" value={year} onChange={e => setYear(parseInt(e.target.value))}>{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>}
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4">
                <div className="flex overflow-x-auto gap-4 mb-8 no-print border-b dark:border-slate-800">
                    {['lancamentos', 'planejamento', 'patrimonio', 'resultados'].map(t => (
                        <button key={t} onClick={() => setMainTab(t)} className={`px-6 py-4 font-black transition-all border-b-4 ${mainTab === t ? 'border-indigo-600 text-indigo-600 scale-105' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            {t === 'lancamentos' ? 'LANÇAMENTOS' : t === 'planejamento' ? 'PLANEJAMENTO' : t === 'patrimonio' ? 'PATRIMÔNIO' : 'RESULTADOS'}
                        </button>
                    ))}
                </div>

                {mainTab === 'lancamentos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
                                <h2 className="font-black text-xl mb-6 flex items-center gap-2 uppercase tracking-wide">{editingTransaction ? <LucideEdit2 className="text-indigo-500"/> : <LucidePlus className="text-green-500"/>} {editingTransaction ? 'Editando' : 'Novo Lançamento'}</h2>
                                <form onSubmit={handleSaveTransaction} className="space-y-5">
                                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl outline-none focus:ring-2 ring-indigo-500 dark:text-white" />
                                    <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold outline-none focus:ring-2 ring-indigo-500 dark:text-white">{activeCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                                    <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="O que deseja registrar?" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl outline-none focus:ring-2 ring-indigo-500 dark:text-white" />
                                    <div className="relative"><span className="absolute left-4 top-4 font-black text-slate-400">R$</span><input value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0,00" className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-black text-2xl outline-none focus:ring-2 ring-indigo-500 dark:text-white" /></div>
                                    {!editingTransaction && (<div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border"><div className="flex items-center gap-3"><input type="checkbox" id="rec" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-6 h-6 rounded-lg text-indigo-600" /><label htmlFor="rec" className="font-black text-xs uppercase tracking-widest text-slate-500">Fixa Mensal?</label></div>{isRecurring && <input type="number" min="2" value={recurringMonths} onChange={e => setRecurringMonths(parseInt(e.target.value))} className="w-16 p-2 rounded-lg bg-white dark:bg-slate-800 text-center font-bold" />}</div>)}
                                    <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95">REGISTRAR</button>
                                </form>
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border dark:border-slate-800 h-[700px] flex flex-col overflow-hidden">
                                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><span className="font-black uppercase text-xs tracking-widest text-slate-400">Fluxo de Movimentação</span><div className="relative"><LucideSearch size={14} className="absolute left-3 top-3 text-slate-400"/><input placeholder="Procurar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 p-2 bg-white dark:bg-slate-950 rounded-xl text-xs w-48 outline-none border dark:border-slate-700" /></div></div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {searchedData.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(t => (
                                        <div key={t.id} className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl flex justify-between items-center group transition-all">
                                            <div className="truncate"><p className="font-black truncate text-sm uppercase leading-tight">{t.desc}</p><p className="text-[10px] text-slate-400 font-black mt-1 uppercase">{safeDate(t.createdAt)} · {activeCategories.find(c=>c.value===t.type)?.label.split(' ')[0]}</p></div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-black whitespace-nowrap text-lg ${activeCategories.find(c=>c.value===t.type)?.isPositive ? 'text-green-500' : 'text-red-500'}`}>{safeCurrency(t.amount)}</span>
                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditClick(t)} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl mr-2"><LucideEdit2 size={18}/></button>
                                                    <button 
                                                        onClick={() => { 
                                                            if(t.recurringId) setDeletingRecurring(t); 
                                                            else openConfirm(
                                                                "Excluir Lançamento", 
                                                                "Deseja apagar este lançamento?", 
                                                                () => handleDeleteSeries(t.id, false)
                                                            ); 
                                                        }} 
                                                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl"
                                                    >
                                                        <LucideTrash2 size={18}/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mainTab === 'planejamento' && <BudgetPlanningView budget={budget} subcategories={subcategories} onSaveBudget={async(b)=>await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`), b)} isMonthly={typeof period === 'number'} companyType={companyType} />}
                
                {mainTab === 'patrimonio' && (
                    <AssetsView 
                        assets={assets} 
                        onAddAsset={d=>addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`), d)} 
                        onUpdateAsset={(id, d)=>updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`, id), d)}
                        onDeleteAsset={handleDeleteAssetRequest} 
                    />
                )}
                
                {mainTab === 'resultados' && (
                    <div className="space-y-8 animate-fade-in">
                         <CashFlowView transactions={filteredData} companyType={companyType} />
                         <div className="flex gap-2 bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl w-fit">
                            {['dre', 'graficos'].map(k => (<button key={k} onClick={() => setResultTab(k)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${resultTab === k ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-slate-500'}`}>{k}</button>))}
                         </div>
                         {resultTab === 'dre' && <DREView transactions={filteredData} companyType={companyType} />}
                         {resultTab === 'graficos' && <ChartsView allTransactions={transactions} companyType={companyType} />}
                    </div>
                )}
            </main>

            {/* ESCOLHA INICIAL DE CONTA */}
            {showInitialChoice && (
                <div className="fixed inset-0 bg-indigo-600 z-[150] flex items-center justify-center p-6 text-white text-center">
                    <div className="max-w-md space-y-8 animate-fade-in">
                        <div className="bg-white p-8 rounded-full inline-block mb-4 shadow-2xl"><LucideRocket size={48} className="text-indigo-600"/></div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Bem-vindo ao seu Sistema Financeiro</h2>
                        <p className="text-lg opacity-90">Para começar, que tipo de conta deseja gerenciar agora?</p>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={() => handleCreateCompany('Minhas Finanças', 'personal')} className="bg-white text-indigo-600 py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><LucideUserCircle size={32}/> Pessoa Física</button>
                            <button onClick={() => handleCreateCompany('Minha Empresa', 'business')} className="bg-indigo-900/50 text-white py-6 rounded-3xl font-black text-xl shadow-xl border-4 border-indigo-400 flex items-center justify-center gap-3 active:scale-95 transition-all"><LucideBriefcase size={32}/> Empresa / Jurídico</button>
                        </div>
                    </div>
                </div>
            )}

            {deletingRecurring && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border dark:border-slate-700">
                        <LucideAlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
                        <h3 className="text-xl font-black mb-2 uppercase tracking-tighter">Série Recorrente</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Deseja apagar apenas esta parcela ou toda a sequência futura?</p>
                        <div className="space-y-3">
                            <button onClick={()=>handleDeleteSeries(deletingRecurring.id, false)} className="w-full py-4 bg-slate-100 dark:bg-slate-700 font-bold rounded-2xl transition-all">Apagar APENAS ESTE</button>
                            <button onClick={()=>handleDeleteSeries(deletingRecurring.id, true)} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg transition-all">Apagar TODA A SÉRIE</button>
                            <button onClick={()=>setDeletingRecurring(null)} className="w-full py-2 text-slate-400 font-bold">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full border dark:border-slate-700 animate-fade-in">
                        <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white">{confirmModal.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancelar</button>
                            <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {showUpdateMessage && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-4 rounded-full shadow-2xl z-[80] font-black animate-bounce flex items-center gap-3 border-4 border-white cursor-pointer" onClick={()=>setShowUpdateMessage(false)}><LucideRocket/> NOVIDADE: ASSISTENTE IA MAIS INTELIGENTE E VALOR CORRIGIDO! <LucideX size={16}/></div>}
            
            {showTutorial && <TutorialModal onClose={() => {setShowTutorial(false); localStorage.setItem('hasSeenFinTutorial_v48', 'true')}} />}
            {showCalculator && <CalculatorModal onClose={()=>setShowCalculator(false)} onConfirm={v=>{setFormAmount(v); setShowCalculator(false)}} />}
            
            <button 
                ref={chatBtnRef}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => !isDragging && setShowChat(!showChat)}
                style={{ 
                    bottom: chatPos.y ? `${chatPos.y}px` : '32px', 
                    right: chatPos.x ? `${chatPos.x}px` : '32px',
                    position: 'fixed'
                }}
                className="z-[70] p-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl hover:scale-110 transition-transform border-4 border-white dark:border-slate-800 ring-4 ring-indigo-600/20 active:scale-95 select-none touch-none"
            >
                <LucideMessageSquare size={32} />
            </button>

            {showChat && <ChatInterface isOpen={true} onClose={()=>setShowChat(false)} onAddTransaction={async(d)=>addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`), {...d, createdAt: Timestamp.fromDate(d.date)})} onAddRecurringTransaction={handleAddRecurringTransaction} onAddAsset={d=>addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/assets`), d)} currentCompany={currentCompany} />}
            <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} companies={companies} currentCompany={currentCompany} onChangeCompany={handleCompanyChange} onAddCompany={handleCreateCompany} onDeleteCompany={handleDeleteCompanyRequest} />
        </div>
    );
}

function Sidebar({ isOpen, onClose, companies, currentCompany, onChangeCompany, onAddCompany, onDeleteCompany }){
    const [newName, setNewName] = useState(''); const [isCreating, setIsCreating] = useState(false); const [newType, setNewType] = useState('business');
    return (<> {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />} <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}> 
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center font-black uppercase text-xs tracking-widest text-slate-400">Suas Contas<button onClick={onClose}><LucideX/></button></div> 
        <div className="p-4 flex flex-col h-[calc(100%-80px)]"> 
            <div className="flex-1 space-y-3 overflow-y-auto"> 
                {companies.map(c => (
                    <div key={c.id} onClick={() => onChangeCompany(c)} className={`p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group ${currentCompany?.id === c.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600'}`}> 
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${c.type==='personal'?'bg-green-100 text-green-600':'bg-blue-100 text-blue-600'}`}>{c.type==='personal'? <LucideUser size={20}/>:<LucideBriefcase size={20}/>}</div> 
                            <div className="flex-1 font-black truncate text-sm uppercase">{c.name}</div> 
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteCompany(c.id); }} className={`p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 ${currentCompany?.id === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                            <LucideTrash2 size={16}/>
                        </button>
                    </div>
                ))} 
                <button onClick={()=>setIsCreating(true)} className="w-full p-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-bold hover:border-indigo-400 transition-all"> <LucidePlus size={20}/> Nova Conta </button> 
                {isCreating && <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border space-y-3"><input autoFocus placeholder="Nome da Conta" className="w-full p-2 rounded-lg border dark:bg-slate-900 outline-none" value={newName} onChange={e=>setNewName(e.target.value)} /><div className="flex gap-2"><button onClick={()=>setNewType('business')} className={`flex-1 py-1 text-[10px] font-bold rounded border ${newType==='business'?'bg-indigo-100 border-indigo-600 text-indigo-700':'bg-white text-slate-400'}`}>Empresa</button><button onClick={()=>setNewType('personal')} className={`flex-1 py-1 text-[10px] font-bold rounded border ${newType==='personal'?'bg-green-100 border-green-600 text-green-700':'bg-white text-slate-400'}`}>Pessoal</button></div><button onClick={()=>{onAddCompany(newName, newType); setNewName(''); setIsCreating(false);}} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold">Criar</button></div>} 
            </div> 
        </div> 
    </div> </>)
}

function CalculatorModal({onClose,onConfirm}){
    const [e,setE]=useState('');
    const h=(v)=>{
        if(v==='C')setE('');
        else if(v==='='){
            try{ const calc = new Function('return ' + e.replace(/x/g,'*').replace(/÷/g,'/').replace(/,/g,'.')); setE(String(calc())); }catch{setE('Erro')}
        }else setE(p=>p+v)
    };
    return(<div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl"><div className="flex justify-between mb-4 font-black uppercase text-[10px] text-indigo-600 tracking-widest">Calculadora IA<button onClick={onClose}><LucideX/></button></div><div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl mb-4 text-right font-black text-3xl overflow-hidden">{e||'0'}</div><div className="grid grid-cols-4 gap-2 mb-4">{['7','8','9','÷','4','5','6','x','1','2','3','-','C','0',',','+'].map(x=><button key={x} onClick={()=>h(x)} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl font-black text-xl hover:bg-indigo-50 transition-all">{x}</button>)}<button onClick={()=>h('=')} className="col-span-4 bg-indigo-600 text-white p-4 rounded-xl font-black text-xl">=</button></div><button onClick={()=>onConfirm(e.replace('.',','))} className="w-full bg-slate-800 text-white p-4 rounded-xl font-black uppercase tracking-widest transition-all">Usar Valor</button></div></div>)
}

function TutorialModal({onClose}){
    const [step, setStep] = useState(0);
    const slides = [
        { title: "BEM-VINDO!", desc: "Seu sistema financeiro agora é inteligente. Vamos ver o que mudou?", icon: <LucideRocket size={48} className="text-indigo-600"/> },
        { title: "ASSISTENTE + ESPERTO", desc: "Agora ele entende suas palavras! Digite 'Uber' e ele sabe que é Transporte. 'Mercado' vira Alimentação.", icon: <LucideMessageSquare size={48} className="text-blue-500"/> },
        { title: "VALOR CORRIGIDO", desc: "No seu Patrimônio, veja quanto seu dinheiro já rendeu automaticamente na nova coluna.", icon: <LucideTrendingUp size={48} className="text-green-500"/> },
        { title: "LANÇAMENTOS", desc: "A aba LANÇAMENTOS permite registrar saídas e entradas rapidamente.", icon: <LucidePlus size={48} className="text-indigo-500"/> },
        { title: "PATRIMÔNIO", desc: "Registre bens e investimentos. Agora com cálculo de correção monetária.", icon: <LucideHome size={48} className="text-amber-500"/> }
    ];
    return (<div className="fixed inset-0 bg-indigo-600 z-[200] flex items-center justify-center p-6 text-white text-center animate-fade-in"><div className="max-w-sm space-y-8">
        <div className="bg-white p-8 rounded-full inline-block mb-4 shadow-2xl animate-bounce">{slides[step].icon}</div>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">{slides[step].title}</h2>
        <p className="text-lg font-medium opacity-90">{slides[step].desc}</p>
        <div className="flex gap-2 justify-center">
            {slides.map((_, i) => (
                <div key={i} className={`h-2 w-2 rounded-full ${i === step ? 'bg-white w-8' : 'bg-indigo-400'} transition-all`} />
            ))}
        </div>
        <button onClick={() => step < slides.length - 1 ? setStep(step + 1) : onClose()} className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
            {step < slides.length - 1 ? 'PRÓXIMO' : 'ENTREI NO COMANDO!'}
        </button>
    </div></div>)
}

function CashFlowView({ transactions, companyType }){
    const { receita, totalSaidas, fluxoCaixa } = useMemo(() => calculateFinancials(transactions, companyType), [transactions, companyType]);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/30"><h3 className="text-green-800 dark:text-green-400 text-sm font-semibold uppercase mb-2">Entradas</h3><p className="text-3xl font-bold text-green-700 dark:text-green-400">{safeCurrency(receita)}</p></div>
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30"><h3 className="text-red-800 dark:text-red-400 text-sm font-semibold uppercase mb-2">Saídas</h3><p className="text-3xl font-bold text-red-700 dark:text-red-400">{safeCurrency(totalSaidas)}</p></div>
            <div className={`p-6 rounded-xl border ${fluxoCaixa >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30'}`}><h3 className={`${fluxoCaixa >= 0 ? 'text-indigo-800 dark:text-indigo-300' : 'text-orange-800 dark:text-orange-300'} text-sm font-semibold uppercase mb-2`}>Saldo Atual</h3><p className={`text-3xl font-black ${fluxoCaixa >= 0 ? 'text-indigo-900 dark:text-indigo-200' : 'text-orange-700 dark:text-orange-300'}`}>{safeCurrency(fluxoCaixa)}</p></div>
        </div>
    );
}

function ChartsView({ allTransactions, companyType }){
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

        // Sort keys chronologically
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const [yA, mA] = a.split('-').map(Number);
            const [yB, mB] = b.split('-').map(Number);
            return yA - yB || mA - mB;
        });

        let accumulatedBalance = 0;

        return sortedKeys.map(key => {
            const [yearStr, monthStr] = key.split('-');
            const fins = calculateFinancials(groups[key], companyType);
            
            // "Arraste" o saldo: Soma o resultado deste mês ao acumulado anterior
            accumulatedBalance += fins.fluxoCaixa;

            return { 
                name: `${MONTHS[parseInt(monthStr)]}/${yearStr.slice(2)}`, 
                Saldo: accumulatedBalance, // Mostra o acumulado no gráfico
                Mensal: fins.fluxoCaixa,
                year: parseInt(yearStr), 
                month: parseInt(monthStr) 
            };
        }).slice(-12); // Pega os ultimos 12 meses registrados
    }, [allTransactions, companyType]);

    return (
        <div className="h-80 bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest text-center">Evolução de Saldo Acumulado</h3>
            <ResponsiveContainer width="100%" height="90%"><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip formatter={(value) => safeCurrency(value)} /><Legend /><Line type="monotone" dataKey="Saldo" stroke="#4f46e5" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>
        </div>
    );
}

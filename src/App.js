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
    Percent as LucidePercent, Info as LucideInfo, Download as LucideDownload, Copy as LucideCopy, CheckCircle as LucideCheckCircle, Smartphone as LucideSmartphone, Menu as LucideMenu, Check as LucideCheck, Rocket as LucideRocket, Moon as LucideMoon, Sun as LucideSun, Repeat as LucideRepeat, Printer as LucidePrinter, Calculator as LucideCalculator, User as LucideUser, Briefcase as LucideBriefcase, Bell as LucideBell
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

// --- Utilitários ---
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
    safeData.forEach(t => {
        if (t.subcategory) {
            const key = `${t.type}:${t.subcategory}`;
            subcatTotals[key] = (subcatTotals[key] || 0) + (Number(t.amount) || 0);
        }
    });

    const receitaKey = type === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA;
    const receita = sumByType(receitaKey);
    
    // Total Saídas (soma tudo que não é receita)
    let totalSaidas = 0;
    cats.forEach(cat => {
        if (!cat.isPositive) totalSaidas += sumByType(cat.value);
    });

    const fluxoCaixa = receita - totalSaidas;
    
    // Retorna objeto genérico + totais específicos
    const financials = { receita, totalSaidas, fluxoCaixa, subcatTotals };
    cats.forEach(cat => {
        financials[cat.value] = sumByType(cat.value);
    });
    
    // Campos específicos de DRE Empresarial
    if (type === 'business') {
        financials.lucroBruto = receita - financials[TransactionTypeBusiness.CUSTO];
        financials.ebitda = financials.lucroBruto - financials[TransactionTypeBusiness.DESPESA_OPERACIONAL];
        financials.lucroLiquido = financials.ebitda - financials[TransactionTypeBusiness.JUROS_FINANCEIROS] - financials[TransactionTypeBusiness.IMPOSTOS];
    }

    return financials;
};

// --- Componentes Visuais ---
const DREView = ({ transactions, budget, isMonthly, isPrintMode, companyType }) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [showPercentage, setShowPercentage] = useState(false);
    const real = useMemo(() => calculateFinancials(transactions, companyType), [transactions, companyType]);
    const meta = useMemo(() => isMonthly && budget ? budget : {}, [budget, isMonthly]);
    const toggleRow = (label) => setExpandedRows(prev => ({ ...prev, [label]: !prev[label] }));
    const cats = companyType === 'personal' ? categoriesPersonal : categoriesBusiness;

    const SubcatRows = ({ type, subcatTotals, budgetSubcats, isNegative }) => {
        if (!subcatTotals && !budgetSubcats) return null;
        const relevantSubcats = new Set([
            ...Object.keys(subcatTotals || {}).filter(k => k.startsWith(type + ':')).map(k => k.split(':')[1]),
            ...Object.keys(budgetSubcats || {}).filter(k => k.startsWith(type + ':')).map(k => k.split(':')[1])
        ]);
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

const CashFlowView = ({ transactions, isPrintMode }) => {
    const { receita, totalSaidas, fluxoCaixa } = useMemo(() => calculateFinancials(transactions), [transactions]);
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
                        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={true}>
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
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs border border-amber-200"><strong>Atenção:</strong> Devido a bloqueios de segurança, o download automático pode não ocorrer. Use o botão abaixo para copiar.</div>
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
            <div className="max-w-[210mm] mx-auto bg-white p-[10mm] min-h-screen shadow-2xl my-8 print:shadow-none print:m-0 print:p-0 print:w-full">
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
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const [editingTransaction, setEditingTransaction] = useState(null);
    const [repeatingTransaction, setRepeatingTransaction] = useState(null);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formType, setFormType] = useState(transactionCategories[0].value);
    const [formSubcat, setFormSubcat] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [isRecurring, setIsRecurring] = useState(false); // Novo estado para checkbox de recorrência
    const [recurringMonths, setRecurringMonths] = useState(1); // Novo estado para meses de recorrência
    const [newSubcatName, setNewSubcatName] = useState('');

    const activeCategories = useMemo(() => currentCompany?.type === 'personal' ? categoriesPersonal : categoriesBusiness, [currentCompany]);

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
        
        // Verifica notificação
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
    
    // Notificação simples ao carregar se tiver passado 24h
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
            if (comps.length > 0 && !currentCompany) setCurrentCompany(comps[0]);
            if (comps.length === 0 && !currentCompany) createDefaultCompany();
            setLoading(false);
        });
    }, [user, db]);

    useEffect(() => {
        if (!user || !db || !currentCompany) { setTransactions([]); setSubcategories({}); return; }
        setLoading(true);
        const qTx = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`));
        const unsubTx = onSnapshot(qTx, (snap) => { setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
        const qSub = query(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/subcategories`));
        const unsubSub = onSnapshot(qSub, (snap) => {
            const subs = {}; snap.docs.forEach(d => { const data = d.data(); if (!subs[data.type]) subs[data.type] = []; subs[data.type].push({ id: d.id, name: data.name }); }); setSubcategories(subs);
        });
        return () => { unsubTx(); unsubSub(); };
    }, [user, db, currentCompany]);

    useEffect(() => {
        if (!user || !db || !currentCompany || typeof period !== 'number') { setBudget({}); return; }
        getDoc(doc(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/budgets/${year}_${period}`)).then(snap => setBudget(snap.exists() ? snap.data() : {})).catch(err => console.error(err));
    }, [user, db, period, year, currentCompany]);

    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            if (!t.createdAt || typeof t.createdAt.toDate !== 'function') return false;
            const d = t.createdAt.toDate();
            if (d.getUTCFullYear() !== year) return false;
            const txMonth = d.getUTCMonth();
            if (typeof period === 'number') return txMonth === period;
            switch (period) {
                case 'Q1': return txMonth >= 0 && txMonth <= 2; case 'Q2': return txMonth >= 3 && txMonth <= 5;
                case 'Q3': return txMonth >= 6 && txMonth <= 8; case 'Q4': return txMonth >= 9 && txMonth <= 11;
                case 'S1': return txMonth >= 0 && txMonth <= 5; case 'S2': return txMonth >= 6 && txMonth <= 11;
                case 'Y': return true; default: return false;
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
    const handleSaveTransaction = async (e) => { e.preventDefault(); if (!currentCompany) { alert("Selecione uma empresa."); return; } const val = parseFloat(formAmount.replace(',', '.')); const parts = formDate.split('-'); const selectedDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0)); if (!val || !user || isNaN(selectedDate.getTime())) return; try { const collectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/companies/${currentCompany.id}/fin_data`); const data = { desc: formDesc, amount: val, type: formType, subcategory: formSubcat, createdAt: Timestamp.fromDate(selectedDate) }; if (editingTransaction) { await updateDoc(doc(collectionRef, editingTransaction.id), { ...data, editedAt: Timestamp.now() }); } else { 
        // Lógica de Recorrência Integrada
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
    Object.entries(defaults).forEach(([type, subs]) => { subs.forEach(subName => { const ref = doc(collection(db, `artifacts/${appId}/users/${user.uid}/companies/${newCompRef.id}/subcategories`)); batch.set(ref, { type, name: subName }); }); }); await batch.commit(); if (name === 'Minha Empresa') setCurrentCompany({ id: newCompRef.id, name, type }); } catch (e) { console.error(e); alert("Erro ao criar empresa inicial."); } };
    
    const handleCreateCompany = async (name, type) => { if (!name || !user || !db) return; await createDefaultCompany(name, type); };
    const handleInstallClick = () => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((choiceResult) => { if (choiceResult.outcome === 'accepted') { setDeferredPrompt(null); } }); } else { setShowInstallGuide(true); } };
    const closeTutorial = () => { setShowTutorial(false); localStorage.setItem('hasSeenFinTutorial', 'true'); const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; if (!isStandalone) { handleInstallClick(); } };
    const handleExportCSV = () => { if (!filteredData || filteredData.length === 0) { alert("Não há dados para exportar neste período."); return; } const headers = ["Data", "Tipo", "Subcategoria", "Descrição", "Valor (R$)"]; const rows = filteredData.map(t => [t.createdAt?.toDate ? safeDate(t.createdAt) : '', t.type, t.subcategory || '', t.desc.replace(/"/g, '""'), (typeof t.amount === 'number' ? t.amount : 0).toFixed(2).replace('.', ',')]); const csvContent = [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n"); setCsvContentToExport(csvContent); setExportFileName(`financeiro_${currentCompany?.name || 'empresa'}_${year}_${typeof period === 'number' ? MONTHS[period] : period}.csv`); setShowExportModal(true); };
    const handlePrint = () => { setShowPrintPreview(true); };
    const handleCalculatorFinish = (val) => { setFormAmount(val); setShowCalculator(false); };
    
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
            {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} onConfirm={handleCalculatorFinish} />}
            
            {showPrintPreview && (<PrintLayout companyName={currentCompany?.name} periodStr={`${typeof period === 'number' ? MONTHS[period] : period}/${year}`} onClose={() => setShowPrintPreview(false)}>{mainTab === 'resultados' && (<><h3 className="text-lg font-bold border-b border-gray-400 mb-2 mt-4">Demonstrativo do Resultado (DRE)</h3><DREView transactions={filteredData} budget={budget} isMonthly={typeof period === 'number'} isPrintMode={true} companyType={currentCompany?.type || 'business'} /><h3 className="text-lg font-bold border-b border-gray-400 mb-2 mt-8">Fluxo de Caixa</h3><CashFlowView transactions={filteredData} isPrintMode={true} companyType={currentCompany?.type || 'business'} /></>)}{mainTab === 'lancamentos' && (<><h3 className="text-lg font-bold border-b border-gray-400 mb-2 mt-4">Extrato de Lançamentos</h3><table className="w-full text-xs text-left"><thead className="border-b-2 border-gray-300"><tr><th className="py-1">Data</th><th className="py-1">Tipo</th><th className="py-1">Subcategoria</th><th className="py-1">Descrição</th><th className="py-1 text-right">Valor</th></tr></thead><tbody>{searchedData.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(t => (<tr key={t.id} className="border-b border-gray-100"><td className="py-1">{safeDate(t.createdAt)}</td><td className="py-1">{activeCategories.find(c=>c.value===t.type)?.label.split(' ')[0]}</td><td className="py-1">{t.subcategory || '-'}</td><td className="py-1">{t.desc}</td><td className={`py-1 text-right font-bold ${activeCategories.find(c=>c.value===t.type)?.isPositive ? 'text-green-800' : 'text-red-800'}`}>{safeCurrency(t.amount)}</td></tr>))}</tbody></table></>)}{mainTab === 'planejamento' && (<div className="text-center p-10 text-gray-500 border border-dashed border-gray-300 mt-4">Para imprimir o Planejamento, tire um print da tela ou use a função de impressão do navegador.</div>)}</PrintLayout>)}
            
            <Sidebar 
                isOpen={showSidebar} 
                onClose={() => setShowSidebar(false)} 
                companies={companies}
                currentCompany={currentCompany}
                onChangeCompany={setCurrentCompany}
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

            <header className="max-w-5xl mx-auto mb-6 p-4 md:p-8 pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowSidebar(true)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200" title="Menu"><LucideMenu size={28} /></button>
                    <div><h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Gestão Financeira</h1><p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><LucideBuilding2 size={14} />{currentCompany?.name}</p></div>
                    <button onClick={() => setShowCalculator(true)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-indigo-600 dark:text-indigo-400" title="Calculadora"><LucideCalculator size={24} /></button>
                </div>
                <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"><button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 mr-2" title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}>{darkMode ? <LucideSun size={20} /> : <LucideMoon size={20} />}</button><span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-2">Visualizando:</span><select className="bg-slate-100 dark:bg-slate-700 border-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={period} onChange={e => setPeriod(isNaN(e.target.value) ? e.target.value : parseInt(e.target.value))}>{PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select><select className="bg-slate-100 dark:bg-slate-700 border-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={year} onChange={e => setYear(parseInt(e.target.value))}>{[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select><div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div><button onClick={handleExportCSV} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors" title="Exportar CSV (Copiar)"><LucideCopy size={20} /></button><button onClick={handlePrint} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Imprimir / Visualizar Relatório"><LucidePrinter size={20} /></button></div>
            </header>

            <main className="max-w-5xl mx-auto animate-fade-in p-4 md:p-8 pt-0 print:hidden">
                <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-full max-w-2xl mb-6 mx-auto md:mx-0">{['lancamentos', 'planejamento', 'resultados'].map(tab => (<button key={tab} onClick={() => setMainTab(tab)} className={`flex-1 py-2.5 text-sm font-bold uppercase rounded-lg transition-all ${mainTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{tab === 'lancamentos' ? 'Lançamentos' : tab === 'planejamento' ? 'Planejamento' : 'Resultados'}</button>))}</div>
                {mainTab === 'lancamentos' && (<div className="grid grid-cols-1 lg:grid-cols-5 gap-8"><div className="lg:col-span-2 space-y-6"><div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border-2 ${editingTransaction ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-700'}`}><div className="flex justify-between items-center mb-4"><h2 className={`font-bold text-lg ${editingTransaction ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{editingTransaction ? 'Editando' : 'Novo Lançamento'}</h2>{editingTransaction && <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><LucideX size={20} /></button>}</div><form onSubmit={handleSaveTransaction} className="space-y-4"><div><label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1 mb-1 block">Data</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 dark:text-white transition-all" /></div><select value={formType} onChange={(e) => { setFormType(e.target.value); setFormSubcat(''); }} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 dark:text-white transition-all">{activeCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select><select value={formSubcat} onChange={(e) => setFormSubcat(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 dark:text-white transition-all disabled:opacity-50" disabled={!subcategories[formType] || subcategories[formType].length === 0}><option value="">{(!subcategories[formType] || subcategories[formType].length === 0) ? 'Sem subcategorias' : 'Selecione Subcategoria (opcional)'}</option>{subcategories[formType]?.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}</select><input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Descrição" required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 dark:text-white transition-all" /><div className="relative"><span className="absolute left-3 top-3 text-slate-400 font-medium">R$</span><input value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0,00" required className="w-full p-3 pl-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-semibold outline-none focus:border-indigo-500 dark:text-white transition-all" /></div>
                
                {/* Checkbox Recorrência */}
                {!editingTransaction && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <input type="checkbox" id="recurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                        <label htmlFor="recurring" className="text-sm text-indigo-700 dark:text-indigo-300 font-medium flex-1">É despesa fixa/parcelada?</label>
                    </div>
                )}
                {isRecurring && !editingTransaction && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Repetir por:</span>
                        <input type="number" min="2" max="60" value={recurringMonths} onChange={(e) => setRecurringMonths(parseInt(e.target.value))} className="w-16 p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-center font-bold" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">meses</span>
                    </div>
                )}

                <button type="submit" className={`w-full py-3.5 text-white rounded-xl font-bold text-base transition-colors shadow-sm ${editingTransaction ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{editingTransaction ? 'ATUALIZAR' : 'REGISTRAR'}</button></form></div></div><div className="lg:col-span-3"><div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-[600px] flex flex-col"><div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center flex-wrap gap-3"><div className="flex items-center gap-2 flex-1"><span>Histórico</span><span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">{searchedData.length} itens</span></div><div className="relative w-full md:w-auto md:max-w-xs"><LucideSearch className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-900 border-0 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all" /></div></div><div className="flex-1 overflow-y-auto"><ul className="divide-y divide-slate-100 dark:divide-slate-700">{searchedData.slice().sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(t => (<li key={t.id} className={`p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 group transition-colors ${editingTransaction?.id === t.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}><div className="truncate pr-4 flex-1"><div className="flex items-center gap-2"><span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-base">{t.desc}</span>{t.editedAt && <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full font-medium" title="Editado">(editado)</span>}</div><div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap"><span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-xs font-medium">{safeDate(t.createdAt)}</span><span>•</span><span>{activeCategories.find(c=>c.value===t.type)?.label.split(' ')[0]}</span>{t.subcategory && <><span>•</span><span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md text-xs font-medium">{t.subcategory}</span></>}</div></div><div className="flex items-center gap-3"><div className={`font-bold text-base whitespace-nowrap ${activeCategories.find(c=>c.value===t.type)?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{safeCurrency(t.amount)}</div><div className="flex opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleRepeat(t)} className="text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all" title="Repetir Lançamento"><LucideRepeat size={18} /></button><button onClick={() => handleEditClick(t)} className="text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"><LucideEdit2 size={18} /></button><button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"><LucideTrash2 size={18} /></button></div></div></li>))}{searchedData.length === 0 && <li className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 space-y-4"><p>{searchTerm ? 'Nenhum lançamento encontrado para esta busca.' : 'Nenhum lançamento para este período.'}</p></li>}</ul></div></div></div></div>)}
                {mainTab === 'planejamento' && (<BudgetPlanningView budget={budget} subcategories={subcategories} onSaveBudget={handleSaveBudget} isMonthly={typeof period === 'number'} companyType={currentCompany?.type || 'business'} />)}
                {mainTab === 'resultados' && (<div><div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-lg mb-6 max-w-md mx-auto">{['dre', 'fluxo', 'graficos', 'subcategorias'].map(key => (<button key={key} onClick={() => setResultTab(key)} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${resultTab === key ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>{key === 'dre' ? 'DRE' : key === 'fluxo' ? 'Fluxo' : key === 'graficos' ? 'Gráficos' : <LucidePieChart size={16} className="mx-auto"/>}</button>))}</div><div className="animate-fade-in">{resultTab === 'dre' && <DREView transactions={filteredData} budget={budget} isMonthly={typeof period === 'number'} companyType={currentCompany?.type || 'business'} />}{resultTab === 'fluxo' && <CashFlowView transactions={filteredData} companyType={currentCompany?.type || 'business'} />}{resultTab === 'graficos' && <ChartsView allTransactions={transactions} companyType={currentCompany?.type || 'business'} />}{resultTab === 'subcategorias' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><CategoryPieChart transactions={filteredData} type={companyType === 'personal' ? TransactionTypePersonal.RECEITA : TransactionTypeBusiness.RECEITA} /><CategoryPieChart transactions={filteredData} type={companyType === 'personal' ? TransactionTypePersonal.MORADIA : TransactionTypeBusiness.DESPESA_OPERACIONAL} /><CategoryPieChart transactions={filteredData} type={companyType === 'personal' ? TransactionTypePersonal.ALIMENTACAO : TransactionTypeBusiness.CUSTO} /></div>)}</div></div>)}
            </main>
        </div>
    );
}

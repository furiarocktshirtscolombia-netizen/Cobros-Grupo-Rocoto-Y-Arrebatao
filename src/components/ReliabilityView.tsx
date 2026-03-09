import React, { useMemo, useState } from 'react';
import { ArticleSummary, ReliabilitySummary, ReliabilityStats } from '../types';
import { getReliabilitySummary } from '../utils/inventory';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  DollarSign, 
  Building2, 
  ChevronRight, 
  ArrowRight,
  PieChart,
  BarChart3,
  Search,
  Filter,
  FileDown,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie,
  Legend
} from 'recharts';

interface ReliabilityViewProps {
  data: ArticleSummary[];
}

export const ReliabilityView: React.FC<ReliabilityViewProps> = ({ data }) => {
  const [selectedSede, setSelectedSede] = useState<ReliabilityStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const summary = useMemo(() => getReliabilitySummary(data), [data]);

  const filteredSedes = useMemo(() => {
    return summary.sedesStats.filter(s => {
      const matchesSearch = s.sede.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || s.nivel === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [summary, searchTerm, levelFilter]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const getLevelColor = (nivel: string) => {
    switch (nivel) {
      case 'Alta': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Media': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Baja': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Crítica': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getLevelProgressColor = (nivel: string) => {
    switch (nivel) {
      case 'Alta': return 'bg-emerald-500';
      case 'Media': return 'bg-amber-500';
      case 'Baja': return 'bg-orange-500';
      case 'Crítica': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const distributionData = useMemo(() => {
    const counts = { Alta: 0, Media: 0, Baja: 0, Crítica: 0 };
    summary.sedesStats.forEach(s => counts[s.nivel]++);
    return [
      { name: 'Alta', value: counts.Alta, color: '#10b981' },
      { name: 'Media', value: counts.Media, color: '#f59e0b' },
      { name: 'Baja', value: counts.Baja, color: '#f97316' },
      { name: 'Crítica', value: counts.Crítica, color: '#f43f5e' },
    ].filter(d => d.value > 0);
  }, [summary]);

  const chartData = useMemo(() => {
    return summary.sedesStats.slice(0, 10).map(s => ({
      name: s.sede,
      confiabilidad: Math.round(s.confiabilidad),
      impacto: s.impactoEconomico
    }));
  }, [summary]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Informe de Confiabilidad por Sede</h2>
          <p className="text-slate-500">Indicador de precisión y consistencia del inventario por sede</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
            <FileDown className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <FileDown className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Main Findings Block */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4 text-indigo-700">
          <Target className="w-5 h-5" />
          <h3 className="font-bold uppercase tracking-wider text-sm">Hallazgos Principales</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 mt-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase">Sede más confiable</p>
              <p className="text-lg font-bold text-slate-900">{summary.sedeMasConfiable}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-rose-100 p-2 rounded-lg text-rose-600 mt-1">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase">Sede menos confiable</p>
              <p className="text-lg font-bold text-slate-900">{summary.sedeMenosConfiable}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600 mt-1">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase">Mayor Impacto Económico</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.impactoEconomicoTotal)}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 mt-1">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase">Diferencias Detectadas</p>
              <p className="text-lg font-bold text-slate-900">{summary.totalDiferencias} artículos</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sedes</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.totalSedes}</p>
          <p className="text-sm text-slate-500 mt-1">Sedes evaluadas</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{Math.round(summary.promedioConfiabilidad)}%</p>
          <p className="text-sm text-slate-500 mt-1">Confiabilidad general</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diferencias</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.totalDiferencias}</p>
          <p className="text-sm text-slate-500 mt-1">Artículos con descuadre</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Impacto</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(summary.impactoEconomicoTotal)}</p>
          <p className="text-sm text-slate-500 mt-1">Valor total diferencias</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-6 text-slate-400">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Confiabilidad por Sede (%)</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="confiabilidad" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.confiabilidad >= 90 ? '#10b981' : entry.confiabilidad >= 75 ? '#f59e0b' : entry.confiabilidad >= 60 ? '#f97316' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-6 text-slate-400">
            <PieChart className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Distribución por Nivel de Riesgo</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Filtros de Sedes</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar sede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select 
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los niveles</option>
              <option value="Alta">Alta Confiabilidad</option>
              <option value="Media">Media Confiabilidad</option>
              <option value="Baja">Baja Confiabilidad</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sede Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSedes.map((sede) => (
          <motion.div 
            key={sede.sede}
            layoutId={sede.sede}
            onClick={() => setSelectedSede(sede)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{sede.sede}</h4>
                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getLevelColor(sede.nivel)}`}>
                  {sede.nivel}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{Math.round(sede.confiabilidad)}%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confiabilidad</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${sede.confiabilidad}%` }}
                  className={`h-full ${getLevelProgressColor(sede.nivel)}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Artículos</p>
                  <p className="text-sm font-bold text-slate-700">{sede.articulosEvaluados}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diferencias</p>
                  <p className="text-sm font-bold text-slate-700">{sede.articulosConDiferencia}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impacto Económico</p>
                  <p className="text-sm font-bold text-rose-600">{formatCurrency(sede.impactoEconomico)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-indigo-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
              <span>Ver detalle completo</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Ranking de Confiabilidad por Sede</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pos</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sede</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Confiabilidad %</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Evaluados</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sin Dif.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Con Dif.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Variación</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Impacto $</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nivel</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {summary.sedesStats.map((s, idx) => (
                <tr key={s.sede} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-emerald-100 text-emerald-700' : idx === summary.sedesStats.length - 1 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{s.sede}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-slate-900">{Math.round(s.confiabilidad)}%</span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">{s.articulosEvaluados}</td>
                  <td className="px-6 py-4 text-center text-emerald-600 font-medium">{s.articulosSinDiferencia}</td>
                  <td className="px-6 py-4 text-center text-rose-600 font-medium">{s.articulosConDiferencia}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{s.variacionTotal.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-rose-600">{formatCurrency(s.impactoEconomico)}</td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getLevelColor(s.nivel)}`}>
                      {s.nivel}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedSede(s)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-sm"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSede && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSede(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              layoutId={selectedSede.sede}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Detalle de Confiabilidad - {selectedSede.sede}</h3>
                  <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getLevelColor(selectedSede.nivel)}`}>
                    Nivel {selectedSede.nivel}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSede(null)}
                  className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confiabilidad</p>
                    <p className="text-2xl font-black text-slate-900">{Math.round(selectedSede.confiabilidad)}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Evaluados</p>
                    <p className="text-2xl font-black text-slate-900">{selectedSede.articulosEvaluados}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sin Diferencia</p>
                    <p className="text-2xl font-black text-emerald-600">{selectedSede.articulosSinDiferencia}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Con Diferencia</p>
                    <p className="text-2xl font-black text-rose-600">{selectedSede.articulosConDiferencia}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Top Critical */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4 text-rose-600">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Top 10 Artículos Críticos</span>
                    </div>
                    <div className="space-y-2">
                      {selectedSede.topArticulosCriticos.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-bold text-slate-700 truncate">{a.articulo}</p>
                            <p className="text-[10px] text-slate-400">Var: {a.variacion.toLocaleString()}</p>
                          </div>
                          <p className="text-sm font-bold text-rose-600 whitespace-nowrap">{formatCurrency(a.impacto)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Reliable */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Top 10 Artículos Confiables</span>
                    </div>
                    <div className="space-y-2">
                      {selectedSede.topArticulosConfiables.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-bold text-slate-700 truncate">{a.articulo}</p>
                            <p className="text-[10px] text-slate-400">Var: {a.variacion.toLocaleString()}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(a.impacto)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impacto Total Sede</p>
                    <p className="text-xl font-black text-rose-600">{formatCurrency(selectedSede.impactoEconomico)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSede(null)}
                  className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Cerrar Detalle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

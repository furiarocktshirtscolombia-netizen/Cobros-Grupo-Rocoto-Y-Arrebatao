/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  LayoutDashboard, 
  FileSearch,
  Receipt
} from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { StatsCard } from './components/StatsCard';
import { InventoryTable } from './components/InventoryTable';
import { Filters } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { ArticleSummary } from './types';
import { getDashboardStats } from './utils/inventory';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [inventoryData, setInventoryData] = useState<ArticleSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'charges' | 'debug'>('summary');
  const [debugMode] = useState(false); // Set to true to enable the Debug tab
  const [debugData, setDebugData] = useState<{ info: any, preview: any[] } | null>(null);
  const [filters, setFilters] = useState({
    sede: '',
    cc: '',
    subfamilia: '',
    status: 'all',
    search: ''
  });

  const stats = useMemo(() => getDashboardStats(inventoryData), [inventoryData]);

  const handleDataLoaded = (data: ArticleSummary[], debug?: any, preview?: any[]) => {
    setInventoryData(data);
    if (debug && preview) {
      setDebugData({ info: debug, preview });
    }
    setActiveTab('summary');
  };

  const handleReset = () => {
    setInventoryData([]);
    setFilters({
      sede: '',
      cc: '',
      subfamilia: '',
      status: 'all',
      search: ''
    });
    setActiveTab('summary');
  };

  const filteredData = useMemo(() => {
    return inventoryData.filter(item => {
      const matchesSede = !filters.sede || item.sede === filters.sede;
      const matchesCC = !filters.cc || item.cc === filters.cc;
      const matchesSubfamilia = !filters.subfamilia || item.subfamilia === filters.subfamilia;
      const matchesSearch = !filters.search || 
        item.articulo.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.codBarras.includes(filters.search);
      
      let matchesStatus = true;
      if (filters.status === 'cobrables') matchesStatus = item.debeCobrar;
      else if (filters.status === 'faltantes') matchesStatus = item.tipo === 'FALTANTE';
      else if (filters.status === 'sobrantes') matchesStatus = item.tipo === 'SOBRANTE';

      return matchesSede && matchesCC && matchesSubfamilia && matchesSearch && matchesStatus;
    });
  }, [inventoryData, filters]);

  const uniqueSedes = useMemo(() => Array.from(new Set(inventoryData.map(i => i.sede))), [inventoryData]);
  const uniqueCCs = useMemo(() => Array.from(new Set(inventoryData.map(i => i.cc).filter(Boolean))), [inventoryData]);
  const uniqueSubfamilias = useMemo(() => Array.from(new Set(inventoryData.map(i => i.subfamilia))), [inventoryData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Cruces de Inventario</h1>
              <p className="text-xs text-slate-500 font-medium">Auditoría y Cobros por Sede</p>
            </div>
          </div>
          
          {inventoryData.length > 0 && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'summary' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Resumen
                </button>
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'analysis' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Análisis
                </button>
                <button 
                  onClick={() => setActiveTab('charges')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'charges' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cobros
                </button>
                {debugMode && (
                  <button 
                    onClick={() => setActiveTab('debug')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'debug' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Debug
                  </button>
                )}
              </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileUpload 
          onDataLoaded={handleDataLoaded} 
          onReset={handleReset}
          hasData={inventoryData.length > 0} 
        />

        {inventoryData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard 
                title="Artículos Revisados" 
                value={stats.totalArticulos} 
                icon={LayoutDashboard} 
                color="bg-indigo-500" 
              />
              <StatsCard 
                title="Artículos con Faltante" 
                value={stats.totalFaltantes} 
                icon={TrendingDown} 
                color="bg-amber-500" 
              />
              <StatsCard 
                title="Artículos Cobrables" 
                value={stats.totalCobrables} 
                icon={Receipt} 
                color="bg-rose-500" 
              />
              <StatsCard 
                title="Valor Total a Cobrar" 
                value={formatCurrency(stats.valorTotalCobro)} 
                icon={DollarSign} 
                color="bg-emerald-500" 
              />
            </div>

            <Filters 
              sedes={uniqueSedes} 
              ccs={uniqueCCs}
              subfamilias={uniqueSubfamilias} 
              filters={filters} 
              setFilters={setFilters} 
            />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                {activeTab === 'summary' && <><LayoutDashboard className="w-5 h-5 mr-2 text-indigo-500" /> Resumen por Sede</>}
                {activeTab === 'analysis' && <><FileSearch className="w-5 h-5 mr-2 text-indigo-500" /> Detalle de Análisis</>}
                {activeTab === 'charges' && <><Receipt className="w-5 h-5 mr-2 text-indigo-500" /> Reporte Final de Cobro</>}
                {activeTab === 'debug' && <><FileSearch className="w-5 h-5 mr-2 text-indigo-500" /> Debug Técnico</>}
              </h2>
              <ExportButtons 
                data={activeTab === 'charges' ? filteredData.filter(a => a.debeCobrar) : filteredData} 
                onlyCobrables={activeTab === 'charges'} 
              />
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'summary' && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {stats.sedes.map(sede => (
                    <div key={sede.sede} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <h3 className="font-bold text-slate-800">{sede.sede}</h3>
                        </div>
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                          {sede.articulos.length} Art.
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Faltantes:</span>
                          <span className="font-semibold text-amber-600">{sede.totalFaltantes}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Cobrables:</span>
                          <span className="font-semibold text-rose-600">{sede.totalCobrables}</span>
                        </div>
                        <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cobro</span>
                          <span className="text-lg font-bold text-emerald-600">{formatCurrency(sede.totalCobroSede)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setFilters({ ...filters, sede: sede.sede });
                          setActiveTab('analysis');
                        }}
                        className="w-full mt-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                      >
                        Ver detalle de sede
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}

              {(activeTab === 'analysis' || activeTab === 'charges') && (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <InventoryTable 
                    data={activeTab === 'charges' ? filteredData.filter(a => a.debeCobrar) : filteredData} 
                  />
                </motion.div>
              )}

              {activeTab === 'debug' && debugData && (
                <motion.div
                  key="debug"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-800 text-slate-300 p-6 rounded-2xl font-mono text-xs overflow-auto max-h-[400px] shadow-xl">
                    <p className="text-indigo-400 font-bold mb-4 uppercase tracking-widest border-b border-slate-700 pb-2">Mapeo de Columnas Detectadas</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-slate-500 mb-2 font-bold">Encabezados Originales:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {debugData.info.originalHeaders.map((h: string, i: number) => (
                            <li key={i} className="hover:text-white transition-colors">{h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-2 font-bold">Mapeo Resuelto:</p>
                        <pre className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">{JSON.stringify(debugData.info.mappedColumns, null, 2)}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vista previa de datos crudos (Primeras 10 filas)</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50/50">
                            {Object.keys(debugData.preview[0]).map(key => (
                              <th key={key} className="px-4 py-3 text-left font-bold text-slate-600 border-b border-slate-100 whitespace-nowrap">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {debugData.preview.map((row, i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                              {Object.values(row).map((val: any, j) => (
                                <td key={j} className="px-4 py-2 text-slate-600 whitespace-nowrap">
                                  {val?.toString() || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="mt-12 flex flex-col items-center text-center opacity-40">
            <div className="bg-slate-200 p-6 rounded-full mb-4">
              <FileSearch className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-400">No hay datos para mostrar</h2>
            <p className="text-slate-400 max-w-xs">Carga un archivo Excel con la base de datos de inventarios para comenzar el análisis.</p>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-8 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest font-bold z-40">
        <div className="flex items-center space-x-4">
          <span>Sistema de Auditoría v1.0</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>Reglas: Gramos {'>'} 1000 | Onzas {'>'} 5 | Unidades {'>'} 1</span>
        </div>
        <div>
          © {new Date().getFullYear()} Cruces de Inventario
        </div>
      </footer>
    </div>
  );
}

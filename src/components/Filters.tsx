import React from 'react';
import { Filter, Search } from 'lucide-react';

interface FiltersProps {
  sedes: string[];
  subfamilias: string[];
  filters: {
    sede: string;
    subfamilia: string;
    status: string;
    search: string;
  };
  setFilters: (f: any) => void;
}

export const Filters: React.FC<FiltersProps> = ({ sedes, subfamilias, filters, setFilters }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
      <div className="flex items-center space-x-2 mb-4 text-slate-400">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Filtros de Análisis</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Sede (Almacén)</label>
          <select 
            value={filters.sede}
            onChange={(e) => setFilters({ ...filters, sede: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las sedes</option>
            {sedes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Subfamilia</label>
          <select 
            value={filters.subfamilia}
            onChange={(e) => setFilters({ ...filters, subfamilia: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las subfamilias</option>
            {subfamilias.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Mostrar</label>
          <select 
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los registros</option>
            <option value="cobrables">Solo cobrables</option>
            <option value="faltantes">Solo faltantes</option>
            <option value="sobrantes">Solo sobrantes</option>
          </select>
        </div>
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Buscar Artículo</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Nombre o código..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

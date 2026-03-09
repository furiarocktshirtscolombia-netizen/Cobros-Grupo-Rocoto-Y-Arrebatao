import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, Loader2, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { normalizeData } from '../utils/inventory';
import { ArticleSummary } from '../types';
import { motion } from 'motion/react';

interface FileUploadProps {
  onDataLoaded: (data: ArticleSummary[]) => void;
  onReset: () => void;
  hasData: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onReset, hasData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string, sheet: string, rows: number } | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [debug, setDebug] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setPreview([]);
    setDebug(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      
      // Look for "BASE DE DATOS" sheet, otherwise use the first one
      let sheetName = workbook.SheetNames.find(name => 
        name.toUpperCase().includes("BASE DE DATOS")
      ) || workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("No se encontraron hojas en el archivo Excel");
      }

      const worksheet = workbook.Sheets[sheetName];
      // Use raw: true to get real types (Dates, numbers)
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: true });
      
      if (json.length === 0) {
        throw new Error("El archivo no contiene datos válidos o la hoja está vacía");
      }

      const { articles, errors, debug: debugInfo } = normalizeData(json);
      setDebug(debugInfo);
      
      if (errors.length > 0) {
        setError(errors[0]);
        setLoading(false);
        return;
      }

      setFileInfo({
        name: file.name,
        sheet: sheetName,
        rows: json.length
      });

      // Preview first 10 rows
      setPreview(json.slice(0, 10));
      
      onDataLoaded(articles);
      setLoading(false);
    } catch (err: any) {
      console.error("Excel Processing Error:", err);
      setError(err.message || "No se pudo leer el archivo");
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFile(file);
    } else {
      setError("Formato no permitido, sube un archivo Excel (.xlsx o .xls)");
    }
  };

  const handleReset = () => {
    setFileInfo(null);
    setPreview([]);
    setError(null);
    onReset();
  };

  if (hasData && fileInfo) {
    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-100">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">{fileInfo.name}</p>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                  Hoja: {fileInfo.sheet}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                  {fileInfo.rows} Filas leídas
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600"
            title="Cargar otro archivo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {debug && (
          <div className="bg-slate-800 text-slate-300 p-4 rounded-2xl text-[10px] font-mono overflow-auto max-h-40">
            <p className="text-indigo-400 font-bold mb-2 uppercase tracking-widest">Depuración de Mapeo de Columnas</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 mb-1">Encabezados Originales:</p>
                <ul className="list-disc list-inside">
                  {debug.originalHeaders.map((h: string, i: number) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Mapeo Resuelto:</p>
                <pre>{JSON.stringify(debug.mappedColumns, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        {preview.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center space-x-2">
              <Table className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vista previa de datos crudos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    {Object.keys(preview[0]).map(key => (
                      <th key={key} className="px-3 py-2 text-left font-bold text-slate-500 border-b border-slate-100 whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                          {val?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 text-center cursor-pointer
          ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'}
          ${loading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          {loading ? (
            <div className="bg-indigo-500 p-4 rounded-2xl shadow-lg shadow-indigo-200 mb-4 animate-pulse">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : (
            <div className="bg-indigo-500 p-4 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
          )}
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {loading ? 'Procesando archivo...' : 'Cargar base de inventarios'}
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">
            {loading 
              ? 'Estamos normalizando las columnas y analizando los datos...' 
              : 'Arrastra tu archivo Excel (.xlsx) aquí o haz clic para seleccionarlo.'}
          </p>
          
          <div className="mt-6 flex items-center space-x-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center"><FileSpreadsheet className="w-3 h-3 mr-1" /> Excel (.xlsx, .xls)</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Hoja: BASE DE DATOS</span>
          </div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center space-x-2 bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

import React from 'react';
import { FileDown, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ArticleSummary } from '../types';
import { format, startOfMonth, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExportButtonsProps {
  data: ArticleSummary[];
  onlyCobrables?: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ data, onlyCobrables = false }) => {
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // 1. Identify all unique dates (normalized to start of day) and group them by month
    const allMovements = data.flatMap(a => a.movements);
    const uniqueDates = (Array.from(new Set(allMovements.map(m => startOfDay(m.fecha).getTime()))) as number[])
      .sort((a, b) => a - b)
      .map(t => new Date(t));

    const monthsMap = new Map<string, Date[]>();
    uniqueDates.forEach(date => {
      const monthKey = format(startOfMonth(date), 'MMMM yyyy', { locale: es });
      if (!monthsMap.has(monthKey)) monthsMap.set(monthKey, []);
      monthsMap.get(monthKey)!.push(date);
    });

    const sortedMonths = Array.from(monthsMap.keys());

    // Debug Logs as requested
    console.log("Fechas únicas detectadas:", uniqueDates.map(d => format(d, 'yyyy-MM-dd')));
    console.log("Meses detectados:", sortedMonths.map(m => m.split(' ')[0]));
    
    // Group by Sede
    const sedes = Array.from(new Set(data.map(a => a.sede))) as string[];

    sedes.forEach(sedeName => {
      // Filter only cobrable articles for this sede
      const sedeArticles = data.filter(a => a.sede === sedeName && a.debeCobrar);
      if (sedeArticles.length === 0) return;

      const rows: any[][] = [];
      const merges: XLSX.Range[] = [];
      
      // --- HEADER SECTION (Rows 0-3) ---
      rows.push(["REPORTE DE COBROS POR AJUSTES DE INVENTARIO"]);
      rows.push([`Sede / Almacén: ${sedeName}`]);
      rows.push([`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`]);
      rows.push([]); // Spacer

      // --- DYNAMIC TABLE HEADERS (Rows 4-5) ---
      const row4: any[] = ["Artículo", "Unidad"];
      const row5: any[] = ["", ""];
      
      let currentCol = 2;

      sortedMonths.forEach(monthKey => {
        const dates = monthsMap.get(monthKey)!;
        const monthName = format(dates[0], 'MMM', { locale: es }).replace('.', '');
        
        // Month Header (Level 1)
        row4.push(monthName);
        // Fill row4 with empty strings for the merge
        for (let i = 0; i < dates.length; i++) {
          if (i > 0) row4.push("");
        }
        
        // Dates (Level 2)
        dates.forEach(date => {
          row5.push(format(date, 'd-MMM', { locale: es }).replace('.', ''));
        });

        // Monthly Total Column
        const totalLabel = `Total ${monthName}`;
        row4.push(""); // Part of the merge
        row5.push(totalLabel);

        // Merge month header across dates + total column
        merges.push({
          s: { r: 4, c: currentCol },
          e: { r: 4, c: currentCol + dates.length }
        });

        currentCol += dates.length + 1;
      });

      // Final Static Columns
      row4.push("Total General", "Coste Línea", "Total Cobro");
      row5.push("", "", "");
      
      // Merge static headers vertically
      merges.push({ s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }); // Artículo
      merges.push({ s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }); // Unidad
      merges.push({ s: { r: 4, c: currentCol }, e: { r: 5, c: currentCol } }); // Total General
      merges.push({ s: { r: 4, c: currentCol + 1 }, e: { r: 5, c: currentCol + 1 } }); // Coste Línea
      merges.push({ s: { r: 4, c: currentCol + 2 }, e: { r: 5, c: currentCol + 2 } }); // Total Cobro

      rows.push(row4);
      rows.push(row5);

      // --- DATA ROWS ---
      sedeArticles.forEach(art => {
        const dateValues = new Map<number, number>();
        art.movements.forEach(m => {
          const t = startOfDay(m.fecha).getTime();
          dateValues.set(t, (dateValues.get(t) || 0) + m.variacion);
        });

        const row: any[] = [art.articulo, art.subarticulo];
        let pivotTotal = 0;
        
        sortedMonths.forEach(monthKey => {
          const dates = monthsMap.get(monthKey)!;
          let monthSum = 0;
          
          dates.forEach(date => {
            const val = dateValues.get(startOfDay(date).getTime()) || 0;
            row.push(val);
            monthSum += val;
            pivotTotal += val;
          });
          
          row.push(monthSum);
        });

        // Validation Log as requested
        if (Math.abs(pivotTotal - art.totalDiferencia) > 0.000001) {
          console.warn(`Discrepancia detectada en ${art.articulo}:`, {
            rawTotal: art.totalDiferencia,
            pivotTotal: pivotTotal,
            diff: art.totalDiferencia - pivotTotal
          });
        }

        const costToUse = art.ultimoCoste || art.costePromedio || 0;
        const totalCobro = Math.abs(art.totalDiferencia) * costToUse;

        // Always use art.totalDiferencia (raw sum from base records) for the final column
        row.push(art.totalDiferencia, costToUse, totalCobro);
        rows.push(row);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // --- STYLING & CONFIGURATION ---
      // Top level merges
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: row4.length - 1 } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: row4.length - 1 } });
      merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: row4.length - 1 } });
      
      worksheet['!merges'] = merges;

      // Auto-width
      const wscols = row4.map((_, i) => {
        let maxLen = 10;
        rows.slice(4).forEach(r => {
          const val = r[i]?.toString() || "";
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet['!cols'] = wscols;

      const safeSheetName = sedeName.replace(/[\\/?*[\]]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    });

    if (workbook.SheetNames.length === 0) {
      alert("No hay datos de cobros para exportar.");
      return;
    }

    XLSX.writeFile(workbook, `Reporte_Cobros_Jerarquico_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const filteredData = data.filter(a => a.debeCobrar);
    
    if (filteredData.length === 0) {
      alert("No hay datos de cobros para exportar.");
      return;
    }

    doc.setFontSize(18);
    doc.text("Reporte Final de Cobros por Sede", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

    const tableData = filteredData.map(a => [
      a.sede,
      a.articulo,
      a.subarticulo,
      a.totalDiferencia.toLocaleString(),
      'COBRA',
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(a.ultimoCoste || a.costePromedio),
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Math.abs(a.totalDiferencia) * (a.ultimoCoste || a.costePromedio))
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: [['Sede', 'Artículo', 'Unidad', 'Diferencia Total', 'Estado', 'Costo', 'Total Cobro']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }, // slate-800
      styles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    doc.save("Reporte_Cobros.pdf");
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={exportToExcel}
        className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-100"
      >
        <FileDown className="w-4 h-4" />
        <span>Excel Jerárquico</span>
      </button>
      <button
        onClick={exportToPDF}
        className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-rose-100"
      >
        <FileText className="w-4 h-4" />
        <span>PDF Cobros</span>
      </button>
    </div>
  );
};

import { RawInventoryRow, ArticleSummary, SedeSummary, DashboardStats, InventoryMovement } from '../types';
import { parse, isValid } from 'date-fns';

const EXACT_MOJIBAKE_MAP: Record<string, string> = {
  "Fecha Doc": "fecha",
  "Serie / NÃºmero": "serie",
  "AlmacÃ©n": "sede",
  "CC": "cc",
  "Subfamilia": "subfamilia",
  "ArtÃculo": "articulo",
  "CÃ³d. Barras": "codBarras",
  "SubartÃculo": "subarticulo",
  "Coste LÃnea": "costeLinea",
  "Stock a Fecha": "stockFecha",
  "VariaciÃ³n Stock": "variacion",
  "Stock Inventario": "stockInventario"
};

const INDEX_FALLBACK: Record<number, string> = {
  0: "fecha",
  1: "serie",
  2: "sede",
  3: "cc",
  4: "subfamilia",
  5: "articulo",
  6: "codBarras",
  7: "subarticulo",
  8: "costeLinea",
  9: "stockFecha",
  10: "variacion",
  11: "stockInventario"
};

const ALIASES: Record<string, string[]> = {
  "fecha": ["fecha doc", "fecha", "fecha documento"],
  "sede": ["almacen", "bodega", "sede", "almacen"],
  "articulo": ["articulo", "producto", "item", "insumo"],
  "subarticulo": ["subarticulo", "unidad", "unidad de medida", "medida", "u m", "um"],
  "costeLinea": ["coste linea", "costo linea", "coste", "costo", "valor costo"],
  "variacion": ["variacion stock", "variacion", "ajuste", "ajuste stock", "diferencia stock", "movimiento stock"],
  "subfamilia": ["subfamilia", "familia"],
  "stockFecha": ["stock a fecha", "stock fecha"],
  "stockInventario": ["stock inventario", "inventario"],
  "codBarras": ["cod barras", "codigo barras", "cod.", "barras"]
};

function normalizeHeader(header: string): string {
  if (!header) return "";
  let str = header.toString();
  
  // 1. Mojibake correction
  str = str.replace(/Ã³/g, 'o');
  str = str.replace(/Ã¡/g, 'a');
  str = str.replace(/Ã©/g, 'e');
  str = str.replace(/Ãº/g, 'u');
  str = str.replace(/Ã±/g, 'n');
  str = str.replace(/Ã/g, 'i');
  str = str.replace(/Â/g, '');
  
  // 2. Standard normalization
  str = str.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
  str = str.replace(/[^a-z0-9\s/]/g, '');
  
  return str.trim();
}

function findInternalName(header: string, index: number): string | null {
  // 1. Exact Mojibake Match
  if (EXACT_MOJIBAKE_MAP[header]) return EXACT_MOJIBAKE_MAP[header];

  const normalized = normalizeHeader(header);

  // 2. Normalized Match
  for (const [internalName, synonyms] of Object.entries(ALIASES)) {
    for (const synonym of synonyms) {
      const normalizedSynonym = normalizeHeader(synonym);
      if (normalized === normalizedSynonym) return internalName;
    }
  }

  // 3. Partial Match
  for (const [internalName, synonyms] of Object.entries(ALIASES)) {
    for (const synonym of synonyms) {
      const normalizedSynonym = normalizeHeader(synonym);
      if (normalized.includes(normalizedSynonym) || normalizedSynonym.includes(normalized)) {
        return internalName;
      }
    }
  }

  // 4. Index Fallback (if within range 0-11)
  if (index >= 0 && index <= 11) return INDEX_FALLBACK[index];

  return null;
}

export function normalizeData(rawRows: RawInventoryRow[]): { articles: ArticleSummary[], errors: string[], debug: any } {
  const errors: string[] = [];
  
  if (!rawRows || rawRows.length === 0) {
    return { articles: [], errors: ["El archivo no contiene datos válidos"], debug: {} };
  }

  // Detect columns from first row
  const firstRow = rawRows[0];
  const headerMap: Record<string, string> = {};
  const debugInfo: any = {
    originalHeaders: Object.keys(firstRow),
    normalizedHeaders: [],
    mappedColumns: {}
  };

  Object.keys(firstRow).forEach((key, index) => {
    const normalized = normalizeHeader(key);
    debugInfo.normalizedHeaders.push(normalized);
    
    const internalName = findInternalName(key, index);
    if (internalName) {
      headerMap[key] = internalName;
      debugInfo.mappedColumns[internalName] = key;
    }
  });

  const requiredColumns = ['fecha', 'sede', 'articulo', 'subarticulo', 'costeLinea', 'variacion'];
  const foundColumns = Object.values(headerMap);
  const missing = requiredColumns.filter(col => !foundColumns.includes(col));

  if (missing.length > 0) {
    const friendlyNames: Record<string, string> = {
      fecha: 'Fecha Doc',
      sede: 'Almacén',
      articulo: 'Artículo',
      subarticulo: 'Subartículo',
      costeLinea: 'Coste Línea',
      variacion: 'Variación Stock'
    };
    return { 
      articles: [], 
      errors: [`Faltan columnas obligatorias: ${missing.map(m => friendlyNames[m] || m).join(', ')}. Por favor verifica los encabezados.`],
      debug: debugInfo
    };
  }

  const normalized: any[] = rawRows.map(row => {
    const newRow: any = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = headerMap[key];
      if (normalizedKey) {
        newRow[normalizedKey] = row[key];
      }
    });
    return newRow;
  }).filter(row => row.articulo && row.sede);

  const grouped = new Map<string, ArticleSummary>();

  normalized.forEach(row => {
    const key = `${row.sede}|${row.articulo}`;
    
    let fecha = row.fecha;
    if (fecha instanceof Date) {
      // Already a date from XLSX
    } else if (typeof fecha === 'number') {
      fecha = new Date((fecha - 25569) * 86400 * 1000);
    } else if (typeof fecha === 'string') {
      const cleanFecha = fecha.trim();
      const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'd/M/yyyy'];
      let parsedDate = null;
      for (const f of formats) {
        const d = parse(cleanFecha, f, new Date());
        if (isValid(d)) {
          parsedDate = d;
          break;
        }
      }
      fecha = parsedDate || new Date(cleanFecha);
    } else {
      fecha = new Date(fecha);
    }

    // Ensure we have a valid date, otherwise skip row
    if (!isValid(fecha)) {
      return;
    }

    const variacion = parseFloat(row.variacion) || 0;
    const costeLinea = parseFloat(row.costeLinea) || 0;
    const subarticulo = (row.subarticulo || 'UNIDADES').toString().toUpperCase().trim();

    if (!grouped.has(key)) {
      grouped.set(key, {
        sede: row.sede.toString(),
        articulo: row.articulo.toString(),
        subarticulo,
        subfamilia: (row.subfamilia || '').toString(),
        codBarras: (row.codBarras || '').toString(),
        movements: [],
        totalDiferencia: 0,
        costePromedio: 0,
        ultimoCoste: 0,
        totalCobro: 0,
        debeCobrar: false,
        tipo: 'SIN_VARIACION'
      });
    }

    const summary = grouped.get(key)!;
    summary.movements.push({ fecha, variacion, costeLinea });
  });

  const articles: ArticleSummary[] = Array.from(grouped.values()).map(summary => {
    summary.movements.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    
    const totalDiferencia = summary.movements.reduce((acc, m) => acc + m.variacion, 0);
    const totalCoste = summary.movements.reduce((acc, m) => acc + m.costeLinea, 0);
    const costePromedio = summary.movements.length > 0 ? totalCoste / summary.movements.length : 0;
    const ultimoCoste = summary.movements.length > 0 ? summary.movements[summary.movements.length - 1].costeLinea : 0;
    
    const costToUse = costePromedio > 0 ? costePromedio : ultimoCoste;

    summary.totalDiferencia = totalDiferencia;
    summary.costePromedio = costePromedio;
    summary.ultimoCoste = ultimoCoste;
    
    if (totalDiferencia < -0.0001) summary.tipo = 'FALTANTE';
    else if (totalDiferencia > 0.0001) summary.tipo = 'SOBRANTE';
    else summary.tipo = 'SIN_VARIACION';

    const absDiff = Math.abs(totalDiferencia);
    let debeCobrar = false;

    if (summary.tipo === 'FALTANTE') {
      const unit = summary.subarticulo;
      if (unit.includes('GRAMO')) {
        debeCobrar = absDiff > 1000;
      } else if (unit.includes('ONZA')) {
        debeCobrar = absDiff > 5;
      } else if (unit.includes('UNIDAD')) {
        debeCobrar = absDiff > 1;
      } else {
        debeCobrar = absDiff > 1;
      }
    }

    summary.debeCobrar = debeCobrar;
    summary.totalCobro = debeCobrar ? absDiff * (summary.ultimoCoste || summary.costePromedio) : 0;

    return summary;
  });

  return { articles, errors, debug: debugInfo };
}

export function getDashboardStats(articles: ArticleSummary[]): DashboardStats {
  const sedesMap = new Map<string, ArticleSummary[]>();
  
  articles.forEach(a => {
    if (!sedesMap.has(a.sede)) sedesMap.set(a.sede, []);
    sedesMap.get(a.sede)!.push(a);
  });

  const sedes: SedeSummary[] = Array.from(sedesMap.entries()).map(([sede, arts]) => {
    const totalCobroSede = arts.reduce((acc, a) => acc + a.totalCobro, 0);
    return {
      sede,
      articulos: arts,
      totalCobroSede,
      totalArticulos: arts.length,
      totalFaltantes: arts.filter(a => a.tipo === 'FALTANTE').length,
      totalCobrables: arts.filter(a => a.debeCobrar).length
    };
  });

  return {
    totalArticulos: articles.length,
    totalFaltantes: articles.filter(a => a.tipo === 'FALTANTE').length,
    totalCobrables: articles.filter(a => a.debeCobrar).length,
    valorTotalCobro: articles.reduce((acc, a) => acc + a.totalCobro, 0),
    sedes
  };
}

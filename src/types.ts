export interface RawInventoryRow {
  [key: string]: any;
}

export interface InventoryMovement {
  fecha: Date;
  variacion: number;
  costeLinea: number;
}

export interface ArticleSummary {
  sede: string;
  articulo: string;
  subarticulo: string; // Unit of measure
  subfamilia: string;
  codBarras: string;
  movements: InventoryMovement[];
  totalDiferencia: number;
  costePromedio: number;
  ultimoCoste: number;
  totalCobro: number;
  debeCobrar: boolean;
  tipo: 'FALTANTE' | 'SOBRANTE' | 'SIN_VARIACION';
}

export interface SedeSummary {
  sede: string;
  articulos: ArticleSummary[];
  totalCobroSede: number;
  totalArticulos: number;
  totalFaltantes: number;
  totalCobrables: number;
}

export interface DashboardStats {
  totalArticulos: number;
  totalFaltantes: number;
  totalCobrables: number;
  valorTotalCobro: number;
  sedes: SedeSummary[];
}

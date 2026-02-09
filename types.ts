
export interface SalesRecord {
  orderId: string;
  date: string;
  grossAmount: number;
  taxableAmount: number;
  taxCollected: number;
  state: string;
  county: string;
  city: string;
  zipCode: string;
}

export interface JurisdictionSummary {
  name: string;
  grossSales: number;
  taxableSales: number;
  taxCollected: number;
  taxLiability: number; // calculated
  jurisdictionCode?: string; // Added for official tax filing codes
  taxRate?: number; // Added for granular tax rate reporting
}

export interface StateSummary extends JurisdictionSummary {
  counties: Record<string, CountySummary>;
}

export interface CountySummary extends JurisdictionSummary {
  cities: Record<string, JurisdictionSummary>;
}

export interface TaxReport {
  totalGrossSales: number;
  totalTaxableSales: number;
  totalTaxCollected: number;
  totalTaxLiability: number;
  states: Record<string, StateSummary>;
  period: string;
}

export type ViewType = 'dashboard' | 'reports' | 'import' | 'settings';

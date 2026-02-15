
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
  expectedTax: number; // Calculated: Taxable Sales * Tax Rate
  taxLiability: number; // Final amount due/owed
  variance: number; // Expected Tax - Tax Collected
  jurisdictionCode?: string;
  taxRate?: number; // Nominal percentage (e.g., 8.25)
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
  totalExpectedTax: number;
  totalTaxLiability: number;
  totalVariance: number;
  states: Record<string, StateSummary>;
  period: string;
}

export type ViewType = 'dashboard' | 'reports' | 'import' | 'settings';

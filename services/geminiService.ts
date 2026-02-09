
import { GoogleGenAI, Type } from "@google/genai";
import { TaxReport, StateSummary, CountySummary, JurisdictionSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function processSalesData(
  data: string, 
  mimeType: string = 'text/plain'
): Promise<TaxReport> {
  
  const isBinary = mimeType !== 'text/plain' && mimeType !== 'text/csv';
  
  const part = isBinary 
    ? { inlineData: { data, mimeType } } 
    : { text: data };

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        {
          text: `You are a World-Class Sales Tax Compliance Expert. 
          
          CORE COMPETENCY:
          - You know every US State, County, and Local Tax Jurisdiction.
          - You understand the 'Shipping region' mapping for Shopify/Amazon reports.
          - You possess an internal database of Jurisdiction Codes (e.g., SST codes, State-specific IDs like CA's 3-digit codes, TX Local Codes).

          CRITICAL TASK - DATA ENRICHMENT:
          1. INFER MISSING COUNTIES: If the uploaded data lacks a 'County' or 'Jurisdiction' column, you MUST automatically determine the correct County based on the 'City', 'State', and 'Zip' provided. DO NOT leave the county field blank or 'Unknown'.
          2. JURISDICTION CODES: For every level (State, County, City), identify and include the official Filing Jurisdiction Code. This is vital for the user to file on state portals.
          
          DATA MAPPING:
          - "Shipping region" / "Province" => State
          - "Shipping city" / "City" => City
          - "Net sales" / "Total" => Taxable & Gross Sales
          - "Taxes" / "Tax collected" => Tax Collected
          
          OUTPUT STRUCTURE:
          - Aggregate all sales.
          - State > County > City hierarchy.
          - Ensure math is perfect: State Total = Sum of Counties = Sum of Cities.
          
          Return ONLY a clean JSON object following the provided schema.`
        },
        part
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalGrossSales: { type: Type.NUMBER },
          totalTaxableSales: { type: Type.NUMBER },
          totalTaxCollected: { type: Type.NUMBER },
          totalTaxLiability: { type: Type.NUMBER },
          period: { type: Type.STRING },
          states: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stateCode: { type: Type.STRING },
                name: { type: Type.STRING },
                jurisdictionCode: { type: Type.STRING },
                grossSales: { type: Type.NUMBER },
                taxableSales: { type: Type.NUMBER },
                taxCollected: { type: Type.NUMBER },
                taxLiability: { type: Type.NUMBER },
                counties: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      jurisdictionCode: { type: Type.STRING },
                      grossSales: { type: Type.NUMBER },
                      taxableSales: { type: Type.NUMBER },
                      taxCollected: { type: Type.NUMBER },
                      taxLiability: { type: Type.NUMBER },
                      cities: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            jurisdictionCode: { type: Type.STRING },
                            grossSales: { type: Type.NUMBER },
                            taxableSales: { type: Type.NUMBER },
                            taxCollected: { type: Type.NUMBER },
                            taxLiability: { type: Type.NUMBER },
                          },
                          required: ["name", "grossSales", "taxableSales", "taxCollected", "taxLiability"]
                        }
                      }
                    },
                    required: ["name", "grossSales", "taxableSales", "taxCollected", "taxLiability", "cities"]
                  }
                }
              },
              required: ["stateCode", "name", "grossSales", "taxableSales", "taxCollected", "taxLiability", "counties"]
            }
          }
        },
        required: ["totalGrossSales", "totalTaxableSales", "totalTaxCollected", "totalTaxLiability", "states"]
      }
    }
  });

  try {
    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI Response Format");
    
    const rawData = JSON.parse(jsonMatch[0]);
    
    const transformedReport: TaxReport = {
      totalGrossSales: rawData.totalGrossSales,
      totalTaxableSales: rawData.totalTaxableSales,
      totalTaxCollected: rawData.totalTaxCollected,
      totalTaxLiability: rawData.totalTaxLiability,
      period: rawData.period || "Consolidated Report",
      states: {}
    };

    if (Array.isArray(rawData.states)) {
      rawData.states.forEach((s: any) => {
        const stateKey = s.stateCode || s.name;
        const stateSummary: StateSummary = {
          name: s.name,
          jurisdictionCode: s.jurisdictionCode,
          grossSales: s.grossSales,
          taxableSales: s.taxableSales,
          taxCollected: s.taxCollected,
          taxLiability: s.taxLiability,
          counties: {}
        };

        if (Array.isArray(s.counties)) {
          s.counties.forEach((co: any) => {
            const countySummary: CountySummary = {
              name: co.name,
              jurisdictionCode: co.jurisdictionCode,
              grossSales: co.grossSales,
              taxableSales: co.taxableSales,
              taxCollected: co.taxCollected,
              taxLiability: co.taxLiability,
              cities: {}
            };

            if (Array.isArray(co.cities)) {
              co.cities.forEach((ci: any) => {
                countySummary.cities[ci.name] = {
                  name: ci.name,
                  jurisdictionCode: ci.jurisdictionCode,
                  grossSales: ci.grossSales,
                  taxableSales: ci.taxableSales,
                  taxCollected: ci.taxCollected,
                  taxLiability: ci.taxLiability
                };
              });
            }
            stateSummary.counties[co.name] = countySummary;
          });
        }
        transformedReport.states[stateKey] = stateSummary;
      });
    }

    return transformedReport;
  } catch (err) {
    console.error("Gemini Response parsing error:", err, response.text);
    throw new Error("Tax Audit Failed. The report structure was invalid. Please ensure headers like 'Shipping City' and 'Gross Sales' are present.");
  }
}

export const MOCK_SALES_CSV = `Shipping region,Shipping city,Shipping country,Taxes,Net sales
California,Chula Vista,United States,4.83,234.97
South Carolina,Blythewood,United States,4.45,55.5
Michigan,Auburn Hills,United States,3.39,56.56`;

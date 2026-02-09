
import { GoogleGenAI, Type } from "@google/genai";
import { TaxReport, StateSummary, CountySummary, JurisdictionSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Processes sales data using Gemini 3 Flash for high-speed analysis (30-60s target).
 * Flash is optimized for lower latency while maintaining reasoning for jurisdiction inference.
 */
export async function processSalesData(
  data: string, 
  mimeType: string = 'text/plain'
): Promise<TaxReport> {
  
  const isBinary = mimeType !== 'text/plain' && mimeType !== 'text/csv';
  
  const part = isBinary 
    ? { inlineData: { data, mimeType } } 
    : { text: data };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: {
      parts: [
        {
          text: `You are a High-Speed Sales Tax Compliance Engine. 
          
          TASK: 
          Rapidly analyze the provided sales dataset and return a structured JSON tax report.
          
          ENRICHMENT RULES:
          1. INFER MISSING COUNTIES: Using the City/State/Zip provided, automatically determine the correct County. 
          2. JURISDICTION CODES: Include official Filing Jurisdiction Codes for every level.
          3. TAX RATES: For every level (State, County, City), identify and include the applicable nominal or effective tax rate as a percentage (e.g., 8.25).
          4. HEADERS: Map common e-commerce headers:
             - "Shipping region", "Province", "State" -> State
             - "Shipping city", "City" -> City
             - "Net sales", "Item Price", "Amount" -> Taxable & Gross Sales
             - "Taxes", "Tax collected", "Sales Tax" -> Tax Collected
          
          AGGREGATION:
          Summarize data at State > County > City levels.
          State Total = Sum(Counties) = Sum(Cities).
          
          OUTPUT: Return ONLY a clean JSON object following the schema provided. No preamble.`
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
                taxRate: { type: Type.NUMBER },
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
                      taxRate: { type: Type.NUMBER },
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
                            taxRate: { type: Type.NUMBER },
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
          taxRate: s.taxRate,
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
              taxRate: co.taxRate,
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
                  taxRate: ci.taxRate,
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
    throw new Error("High-speed sync failed. Ensure your file headers are clear and recognizable.");
  }
}

export const MOCK_SALES_CSV = `Shipping region,Shipping city,Zip,Taxes,Net sales
California,Los Angeles,90001,45.50,500.00
California,Santa Monica,90401,12.20,145.00
Texas,Houston,77001,34.00,412.50
New York,Brooklyn,11201,18.75,210.00
Florida,Miami,33101,0.00,100.00`;

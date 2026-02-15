
import { GoogleGenAI, Type } from "@google/genai";
import { TaxReport, StateSummary, CountySummary, JurisdictionSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Processes sales data using Gemini 3 Flash.
 * Optimized for precise geographic auditing and high-volume data sets.
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
          text: `You are the Expert Sales Tax Compliance Auditor and Geographic Specialist. 
          
          CRITICAL GEOGRAPHIC MAPPING RULES:
          1. CITY-TO-COUNTY PRECISION: 
             - For every "Row Label" (City) and "State", you MUST identify the correct County.
             - Example: "Atlanta, GA" MUST be mapped to "Fulton" or "DeKalb" (Audit and assign the most appropriate). "Alpharetta, GA" MUST be "Fulton".
             - DO NOT leave County as "Unknown". Use your internal database of US jurisdictions.
          
          2. 2024/2025 TAX RATE CALCULATION:
             - Use the most current combined sales tax rates as of today (State + County + Local/City).
             - "Expected Tax" = Taxable Sales * (Correct 2024/2025 Combined Rate / 100).
             - Highlight the difference between "Tax Collected" (from the file) and this "Expected Tax" in the "variance" field.

          3. ACCOUNTING NOTATION & CLEANING: 
             - Treat "(X.XX)" as -X.XX.
             - Treat "-" as 0.
             - Normalize all strings: "POOLER" -> "Pooler", "Dacu;a" -> "Dacula".

          4. FULL AUDIT INTEGRITY:
             - Process EVERY single row in the input. 
             - Use "Grand Total" lines to cross-check that your internal sums match the user's report exactly.
             - Ensure every City is nested under its correct County in the JSON structure.

          TASK: 
          Convert the raw data into a structured JSON tax report. Accuracy is non-negotiable for filing purposes.

          OUTPUT: Return ONLY a clean JSON object.`
        },
        part
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 18000 }, // Maximize reasoning for geographic lookups and math
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalGrossSales: { type: Type.NUMBER },
          totalTaxableSales: { type: Type.NUMBER },
          totalTaxCollected: { type: Type.NUMBER },
          totalExpectedTax: { type: Type.NUMBER },
          totalTaxLiability: { type: Type.NUMBER },
          totalVariance: { type: Type.NUMBER },
          period: { type: Type.STRING },
          states: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                taxRate: { type: Type.NUMBER },
                grossSales: { type: Type.NUMBER },
                taxableSales: { type: Type.NUMBER },
                taxCollected: { type: Type.NUMBER },
                expectedTax: { type: Type.NUMBER },
                taxLiability: { type: Type.NUMBER },
                variance: { type: Type.NUMBER },
                counties: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      taxRate: { type: Type.NUMBER },
                      grossSales: { type: Type.NUMBER },
                      taxableSales: { type: Type.NUMBER },
                      taxCollected: { type: Type.NUMBER },
                      expectedTax: { type: Type.NUMBER },
                      taxLiability: { type: Type.NUMBER },
                      variance: { type: Type.NUMBER },
                      cities: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            taxRate: { type: Type.NUMBER },
                            grossSales: { type: Type.NUMBER },
                            taxableSales: { type: Type.NUMBER },
                            taxCollected: { type: Type.NUMBER },
                            expectedTax: { type: Type.NUMBER },
                            taxLiability: { type: Type.NUMBER },
                            variance: { type: Type.NUMBER },
                          },
                          required: ["name", "taxRate", "grossSales", "taxableSales", "taxCollected", "expectedTax", "variance"]
                        }
                      }
                    },
                    required: ["name", "grossSales", "taxableSales", "taxCollected", "expectedTax", "cities"]
                  }
                }
              },
              required: ["name", "grossSales", "taxableSales", "taxCollected", "expectedTax", "counties"]
            }
          }
        },
        required: ["totalGrossSales", "totalTaxableSales", "totalTaxCollected", "totalExpectedTax", "states"]
      }
    }
  });

  try {
    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response as JSON.");
    
    const rawData = JSON.parse(jsonMatch[0]);
    
    const transformedReport: TaxReport = {
      totalGrossSales: rawData.totalGrossSales,
      totalTaxableSales: rawData.totalTaxableSales,
      totalTaxCollected: rawData.totalTaxCollected,
      totalExpectedTax: rawData.totalExpectedTax,
      totalTaxLiability: rawData.totalTaxLiability || rawData.totalExpectedTax,
      totalVariance: rawData.totalVariance || (rawData.totalExpectedTax - rawData.totalTaxCollected),
      period: rawData.period || "Consolidated Audit Report",
      states: {}
    };

    if (Array.isArray(rawData.states)) {
      rawData.states.forEach((s: any) => {
        const stateSummary: StateSummary = {
          name: s.name,
          taxRate: s.taxRate,
          grossSales: s.grossSales,
          taxableSales: s.taxableSales,
          taxCollected: s.taxCollected,
          expectedTax: s.expectedTax,
          taxLiability: s.taxLiability || s.expectedTax,
          variance: s.variance || (s.expectedTax - s.taxCollected),
          counties: {}
        };

        if (Array.isArray(s.counties)) {
          s.counties.forEach((co: any) => {
            const countySummary: CountySummary = {
              name: co.name,
              taxRate: co.taxRate,
              grossSales: co.grossSales,
              taxableSales: co.taxableSales,
              taxCollected: co.taxCollected,
              expectedTax: co.expectedTax,
              taxLiability: co.taxLiability || co.expectedTax,
              variance: co.variance || (co.expectedTax - co.taxCollected),
              cities: {}
            };

            if (Array.isArray(co.cities)) {
              co.cities.forEach((ci: any) => {
                countySummary.cities[ci.name] = {
                  name: ci.name,
                  taxRate: ci.taxRate,
                  grossSales: ci.grossSales,
                  taxableSales: ci.taxableSales,
                  taxCollected: ci.taxCollected,
                  expectedTax: ci.expectedTax,
                  taxLiability: ci.taxLiability || ci.expectedTax,
                  variance: ci.variance || (ci.expectedTax - ci.taxCollected)
                };
              });
            }
            stateSummary.counties[co.name] = countySummary;
          });
        }
        transformedReport.states[s.name] = stateSummary;
      });
    }

    return transformedReport;
  } catch (err) {
    console.error("Gemini Error:", err, response.text);
    throw new Error("Tax Engine reached a parsing conflict. Please ensure your file headers are legible and valid.");
  }
}

export const MOCK_SALES_CSV = `State,Row Labels, Sum of Gross sales , Sum of Discounts , Sum of Discounts returned , Sum of Gift card discounts , Sum of Taxes returned , Sum of Net sales , Sum of Taxes 
Georgia,Acworth, 59.950 , -   , -   , -   , -   , 59.950 , -   
Georgia,Albany, 59.950 , -   , -   , -   , -   , 59.950 , -   
Georgia,Alpharetta, 359.700 , (58.980), -   , -   , -   , 300.720 , -   
,Grand Total," 9,741.850 ", (481.460), 11.990 , -   , -   ," 8,818.970 ", -   `;

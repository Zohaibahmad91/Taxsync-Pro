
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
          text: `You are a Senior Sales Tax Compliance Expert with deep knowledge of US state, county, and local tax jurisdictions.
          
          TASK:
          Process the attached sales data into a structured tax report.
          
          ADVANCED MAPPING & INFERENCE:
          1. AUTOMATIC COUNTY ASSIGNMENT: If the input data lacks a "County" column, you MUST use your knowledge of US geography to determine the correct County based on the "City" and "State" (and "Zip" if available).
          2. JURISDICTION CODES: Provide official tax jurisdiction codes where possible (e.g., California's 3-digit county/city codes, Texas local codes, etc.).
          3. DATA MAPPING:
             - "Shipping region" or "Region" => State
             - "Shipping city" or "City" => City
             - "Net sales" or "Amount" => Taxable & Gross Sales
             - "Taxes" => Tax Collected
          
          PROCESSING RULES:
          - Aggregate all individual transactions into jurisdiction totals.
          - Hierarchy: State -> County -> City.
          - Ensure totalTaxLiability = totalTaxCollected.
          - Identify the report period if mentioned (e.g. "Oct 2023").
          
          OUTPUT: Return JSON following the strict schema provided.`
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
    throw new Error("Unable to parse tax report. Ensure your file has valid sales data with identifiable cities and states.");
  }
}

export const MOCK_SALES_CSV = `Shipping region,Shipping city,Shipping country,Taxes,Net sales
California,Chula Vista,United States,4.83,234.97
South Carolina,Blythewood,United States,4.45,55.5
Michigan,Auburn Hills,United States,3.39,56.56`;

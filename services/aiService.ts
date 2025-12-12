import { GoogleGenAI } from "@google/genai";
import { ProtocolBlock, TargetLanguage, AISettings } from "../types";

export const GENERATOR_SYSTEM_PROMPT = `
You are an expert low-level systems engineer and parser generator. 
Your goal is to convert a JSON-based protocol schema into robust, idiomatic, and high-performance parsing code for a specific language.
- For C++, use modern C++17/20 standards (structs, std::vector, bit-fields or bit manipulation).
- For C#, use idiomatic classes, BinaryReader, or Span<byte>.
- For Python, use 'struct' module or 'construct' library patterns or distinct classes with a parse method.
- Handle nested structures, repeated lists (assume prefixed length or consume-all based on context if not specified), and bitfields correctly.
- Add comments explaining the parsing logic.
`;

export const SIMULATOR_SYSTEM_PROMPT = `
You are a binary protocol analysis engine.
You will receive a Protocol Schema and a Hexadecimal string.
Your job is to "parse" the hex string according to the schema rules and return the resulting object as a JSON.
- If the hex string is too short or invalid, return an error object.
- Interpret basic types (Little Endian by default unless standard network byte order is implied, but sticking to Little Endian is safe for this generic test).
- For bitfields, break them down into their boolean/integer components.
`;

// Helper to safely access env vars in browser or node
const getEnvApiKey = () => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
  } catch (e) {
    return undefined;
  }
};

const getGoogleGenAI = (apiKey?: string) => {
  // Use provided key or fallback to env. 
  const key = apiKey || getEnvApiKey();
  if (!key) throw new Error("No API Key provided. Please set it in Settings.");
  return new GoogleGenAI({ apiKey: key });
};

export const generateParsingCode = async (
  schema: ProtocolBlock[],
  language: TargetLanguage,
  settings: AISettings
): Promise<string> => {
  try {
    const prompt = `
    Target Language: ${language}
    
    Protocol Schema (JSON):
    ${JSON.stringify(schema, null, 2)}
    
    Task:
    Generate the complete source code to parse this protocol from a binary stream (or byte array). 
    Provide a main class/struct named 'PacketParser' or similar based on the root nodes.
    `;

    if (settings.provider === 'google') {
      const ai = getGoogleGenAI(settings.apiKey);
      const response = await ai.models.generateContent({
        model: settings.model || "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: GENERATOR_SYSTEM_PROMPT },
      });
      return response.text || "// Failed to generate code.";
    } 
    
    if (settings.provider === 'openai') {
      if (!settings.apiKey) throw new Error("OpenAI API Key is required");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model || "gpt-4o",
          messages: [
            { role: "system", content: GENERATOR_SYSTEM_PROMPT },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices?.[0]?.message?.content || "// No response from OpenAI";
    }

    return "// Unknown provider";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return `// Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

export const simulateParsing = async (
  schema: ProtocolBlock[],
  hexInput: string,
  settings: AISettings
): Promise<any> => {
  try {
    const prompt = `
    Protocol Schema: ${JSON.stringify(schema)}
    Hex Input: ${hexInput}
    Task: Parse the Hex Input using the Schema. Return the structured JSON result.
    `;

    if (settings.provider === 'google') {
      const ai = getGoogleGenAI(settings.apiKey);
      const response = await ai.models.generateContent({
        model: settings.model || "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SIMULATOR_SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });
      return JSON.parse(response.text || "{}");
    }

    if (settings.provider === 'openai') {
      if (!settings.apiKey) throw new Error("OpenAI API Key is required");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model || "gpt-4o",
          messages: [
            { role: "system", content: SIMULATOR_SYSTEM_PROMPT },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.choices?.[0]?.message?.content;
      return JSON.parse(text || "{}");
    }

    return { error: "Unknown Provider" };
  } catch (error) {
    console.error("AI Simulation Error:", error);
    return { error: "Failed to simulate", details: error instanceof Error ? error.message : "Unknown" };
  }
};

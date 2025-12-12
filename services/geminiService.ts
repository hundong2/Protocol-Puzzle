import { GoogleGenAI, Type } from "@google/genai";
import { ProtocolBlock, TargetLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for the Code Generator persona
const GENERATOR_SYSTEM_PROMPT = `
You are an expert low-level systems engineer and parser generator. 
Your goal is to convert a JSON-based protocol schema into robust, idiomatic, and high-performance parsing code for a specific language.
- For C++, use modern C++17/20 standards (structs, std::vector, bit-fields or bit manipulation).
- For C#, use idiomatic classes, BinaryReader, or Span<byte>.
- For Python, use 'struct' module or 'construct' library patterns or distinct classes with a parse method.
- Handle nested structures, repeated lists (assume prefixed length or consume-all based on context if not specified), and bitfields correctly.
- Add comments explaining the parsing logic.
`;

export const generateParsingCode = async (
  schema: ProtocolBlock[],
  language: TargetLanguage
): Promise<string> => {
  try {
    const prompt = `
    Target Language: ${language}
    
    Protocol Schema (JSON):
    ${JSON.stringify(schema, null, 2)}
    
    Task:
    Generate the complete source code to parse this protocol from a binary stream (or byte array). 
    Provide a main class/struct named 'PacketParser' or similar based on the root nodes.
    Ensure all types (Int, Float, String, Bitfields) are handled.
    If a List is present, assume a 4-byte integer length prefix precedes the list unless specific metadata implies otherwise.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: GENERATOR_SYSTEM_PROMPT,
      },
    });

    return response.text || "// Failed to generate code.";
  } catch (error) {
    console.error("Gemini Code Gen Error:", error);
    return `// Error generating code: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

// System instruction for the Simulation persona
const SIMULATOR_SYSTEM_PROMPT = `
You are a binary protocol analysis engine.
You will receive a Protocol Schema and a Hexadecimal string.
Your job is to "parse" the hex string according to the schema rules and return the resulting object as a JSON.
- If the hex string is too short or invalid, return an error object.
- Interpret basic types (Little Endian by default unless standard network byte order is implied, but sticking to Little Endian is safe for this generic test).
- For bitfields, break them down into their boolean/integer components.
`;

export const simulateParsing = async (
  schema: ProtocolBlock[],
  hexInput: string
): Promise<any> => {
  try {
    const prompt = `
    Protocol Schema:
    ${JSON.stringify(schema)}

    Hex Input:
    ${hexInput}

    Task:
    Parse the Hex Input using the Schema. Return the structured JSON result.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SIMULATOR_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Simulation Error:", error);
    return { error: "Failed to simulate parsing", details: error instanceof Error ? error.message : "Unknown" };
  }
};

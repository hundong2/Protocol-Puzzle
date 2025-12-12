// Supported Target Languages
export enum TargetLanguage {
  CSharp = 'C#',
  CPP = 'C++',
  Python = 'Python',
}

// Block Types
export enum BlockType {
  Struct = 'Struct',
  List = 'List',
  Bitfield = 'Bitfield',
  // Primitives
  Int8 = 'Int8',
  UInt8 = 'UInt8',
  Int16 = 'Int16',
  UInt16 = 'UInt16',
  Int32 = 'Int32',
  UInt32 = 'UInt32',
  Int64 = 'Int64',
  UInt64 = 'UInt64',
  Float = 'Float',
  Double = 'Double',
  String = 'String',
  Boolean = 'Boolean',
  Bit = 'Bit', // Only valid inside Bitfield
}

// The core data structure for a Protocol definition
export interface ProtocolBlock {
  id: string;
  name: string;
  type: BlockType;
  // Metadata
  description?: string;
  // Specific config
  length?: number; // For fixed strings or array counts (if static)
  bitSize?: number; // For Bit types
  // Recursive children
  children?: ProtocolBlock[];
}

export interface GenerationRequest {
  schema: ProtocolBlock[];
  language: TargetLanguage;
  context?: string; // specific requirements
}

export interface SimulationRequest {
  schema: ProtocolBlock[];
  hexInput: string;
}

export type AIProvider = 'google' | 'openai';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

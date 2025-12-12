import { BlockType, ProtocolBlock } from "./types";

export const INITIAL_SCHEMA: ProtocolBlock[] = [
  {
    id: 'root-1',
    name: 'Header',
    type: BlockType.Struct,
    children: [
      { id: 'f-1', name: 'magic_byte', type: BlockType.UInt8 },
      { id: 'f-2', name: 'packet_id', type: BlockType.UInt16 },
    ],
  },
  {
    id: 'root-2',
    name: 'Payload',
    type: BlockType.List,
    description: 'List of Item structures',
    children: [
       {
         id: 'item-struct',
         name: 'Item',
         type: BlockType.Struct,
         children: [
            { id: 'i-1', name: 'item_id', type: BlockType.Int32 },
            { id: 'i-2', name: 'cost', type: BlockType.Float },
         ]
       }
    ]
  }
];

export const SAMPLE_HEX = "AA0100020000000A000000000040410B00000000008041";

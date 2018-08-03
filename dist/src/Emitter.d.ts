/// <reference types="node" />
import * as Types from './types';
export default class Emitter {
    private types;
    renames: {
        [key: string]: string;
    };
    constructor(types: Types.TypeMap);
    emitAll(stream: NodeJS.WritableStream): void;
    emitTopLevelNode(node: Types.Node, name: Types.SymbolName, stream: NodeJS.WritableStream): void;
    _preprocessNode(node: Types.Node, name: Types.SymbolName): boolean;
    _emitAlias(node: Types.AliasNode, name: Types.SymbolName): string;
    _emitUnion(node: Types.UnionNode, name: Types.SymbolName): string;
    _emitInterface(node: Types.InterfaceNode | Types.ClassNode, name: Types.SymbolName): string | null;
    _emitEnum(node: Types.EnumNode, name: Types.SymbolName): string;
    _emitExpression: (node: Types.Node) => string;
    _collectMembers: (node: Types.InterfaceNode | Types.LiteralObjectNode) => Types.PropertyNode[];
    _name: (name: string) => string;
    _isPrimitive(node: Types.Node): boolean;
    _indent(content: string | string[]): string;
    _transitiveInterfaces(node: Types.InterfaceNode | Types.ClassNode): Array<Types.InterfaceNode | Types.ClassNode>;
    _hasDocTag(node: Types.ComplexNode, prefix: string): boolean;
    _getDocTag(node: Types.ComplexNode, prefix: string): string | null;
}

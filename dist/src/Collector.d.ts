import * as typescript from 'typescript';
import * as types from './types';
/**
 * Walks declarations from a TypeScript programs, and builds up a map of
 * referenced types.
 */
export default class Collector {
    types: types.TypeMap;
    private checker;
    private nodeMap;
    constructor(program: typescript.Program);
    addRootNode(node: typescript.InterfaceDeclaration): void;
    mergeOverrides(node: typescript.InterfaceDeclaration, name: types.SymbolName): void;
    _walkNode: (node: typescript.Node) => types.Node;
    _walkSymbol: (symbol: typescript.Symbol) => types.Node[];
    _walkInterfaceDeclaration(node: typescript.InterfaceDeclaration): types.Node;
    _walkClassDeclaration(node: typescript.ClassDeclaration): types.Node | null;
    _walkMethodSignature(node: typescript.MethodSignature): types.Node;
    _walkPropertySignature(node: typescript.PropertySignature): types.Node;
    _walkPropertyDeclaration(node: typescript.PropertyDeclaration): types.Node | null;
    _walkTypeReferenceNode(node: typescript.TypeReferenceNode): types.Node;
    _walkTypeAliasDeclaration(node: typescript.TypeAliasDeclaration): types.Node;
    _walkEnumDeclaration(node: typescript.EnumDeclaration): types.Node;
    _walkTypeLiteralNode(node: typescript.TypeLiteralNode): types.Node;
    _walkArrayTypeNode(node: typescript.ArrayTypeNode): types.Node;
    _walkUnionTypeNode(node: typescript.UnionTypeNode): types.Node;
    _walkType: (type: typescript.Type) => types.Node;
    _walkTypeReference(type: typescript.TypeReference): types.Node;
    _walkInterfaceType(type: typescript.InterfaceType): types.Node;
    _addType(node: typescript.InterfaceDeclaration | typescript.TypeAliasDeclaration | typescript.EnumDeclaration | typescript.ClassDeclaration, typeBuilder: () => types.Node): types.Node;
    _symbolForNode(node: typescript.Node): typescript.Symbol;
    _nameForSymbol(symbol: typescript.Symbol): types.SymbolName;
    _expandSymbol(symbol: typescript.Symbol): typescript.Symbol;
    _referenceForSymbol(symbol: typescript.Symbol): types.ReferenceNode;
}

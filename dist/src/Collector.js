"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var typescript = require("typescript");
var util = require("./util");
var SyntaxKind = typescript.SyntaxKind;
var TypeFlags = typescript.TypeFlags;
/**
 * Walks declarations from a TypeScript programs, and builds up a map of
 * referenced types.
 */
var Collector = /** @class */ (function () {
    function Collector(program) {
        var _this = this;
        this.types = {
            Date: { type: 'alias', target: { type: 'string' } },
        };
        this.nodeMap = new Map();
        // Node Walking
        this._walkNode = function (node) {
            // Reentrant node walking.
            if (_this.nodeMap.has(node)) {
                return _this.nodeMap.get(node);
            }
            var nodeReference = {};
            _this.nodeMap.set(node, nodeReference);
            var result = null;
            if (node.kind === SyntaxKind.InterfaceDeclaration) {
                result = _this._walkInterfaceDeclaration(node);
            }
            else if (node.kind === SyntaxKind.ClassDeclaration) {
                result = _this._walkClassDeclaration(node);
            }
            else if (node.kind === SyntaxKind.MethodSignature) {
                result = _this._walkMethodSignature(node);
            }
            else if (node.kind === SyntaxKind.PropertySignature) {
                result = _this._walkPropertySignature(node);
            }
            else if (node.kind === SyntaxKind.PropertyDeclaration) {
                result = _this._walkPropertyDeclaration(node);
            }
            else if (node.kind === SyntaxKind.TypeReference) {
                result = _this._walkTypeReferenceNode(node);
            }
            else if (node.kind === SyntaxKind.TypeAliasDeclaration) {
                result = _this._walkTypeAliasDeclaration(node);
            }
            else if (node.kind === SyntaxKind.EnumDeclaration) {
                result = _this._walkEnumDeclaration(node);
            }
            else if (node.kind === SyntaxKind.TypeLiteral) {
                result = _this._walkTypeLiteralNode(node);
            }
            else if (node.kind === SyntaxKind.ArrayType) {
                result = _this._walkArrayTypeNode(node);
            }
            else if (node.kind === SyntaxKind.UnionType) {
                result = _this._walkUnionTypeNode(node);
            }
            else if (node.kind === SyntaxKind.StringKeyword) {
                result = { type: 'not null', element: { type: 'string' } };
            }
            else if (node.kind === SyntaxKind.NumberKeyword) {
                result = { type: 'not null', element: { type: 'number' } };
            }
            else if (node.kind === SyntaxKind.BooleanKeyword) {
                result = { type: 'not null', element: { type: 'boolean' } };
            }
            else if (node.kind === SyntaxKind.NullKeyword) {
                result = { type: 'null' };
            }
            else if (node.kind === SyntaxKind.UndefinedKeyword) {
                result = { type: 'undefined' };
            }
            else if (node.kind === SyntaxKind.ModuleDeclaration) {
                // Nada.
            }
            else if (node.kind === SyntaxKind.VariableDeclaration) {
                // Nada.
            }
            else if (node.kind === SyntaxKind.ParenthesizedType) {
                // We can just recur on the child
                result = _this._walkNode(node.type);
            }
            else {
                console.error(node);
                console.error(node.getSourceFile().fileName);
                throw new Error("Don't know how to handle " + SyntaxKind[node.kind] + " nodes");
            }
            if (result) {
                Object.assign(nodeReference, result);
            }
            return nodeReference;
        };
        this._walkSymbol = function (symbol) {
            return _.map(symbol.getDeclarations(), function (d) { return _this._walkNode(d); });
        };
        // Type Walking
        this._walkType = function (type) {
            if (type.flags & TypeFlags.Object) {
                return _this._walkTypeReference(type);
            }
            else if (type.flags & TypeFlags.BooleanLike) {
                return _this._walkInterfaceType(type);
            }
            else if (type.flags & TypeFlags.Index) {
                return _this._walkNode(type.getSymbol().declarations[0]);
            }
            else if (type.flags & TypeFlags.String) {
                return { type: 'string' };
            }
            else if (type.flags & TypeFlags.Number) {
                return { type: 'number' };
            }
            else if (type.flags & TypeFlags.Boolean) {
                return { type: 'boolean' };
            }
            else {
                console.error(type);
                console.error(type.getSymbol().declarations[0].getSourceFile().fileName);
                throw new Error("Don't know how to handle type with flags: " + type.flags);
            }
        };
        this.checker = program.getTypeChecker();
    }
    Collector.prototype.addRootNode = function (node) {
        this._walkNode(node);
        var simpleNode = this.types[this._nameForSymbol(this._symbolForNode(node.name))];
        simpleNode.concrete = true;
    };
    Collector.prototype.mergeOverrides = function (node, name) {
        var existing = this.types[name];
        if (!existing) {
            throw new Error("Cannot override \"" + name + "\" - it was never included");
        }
        var overrides = node.members.map(this._walkNode);
        var overriddenNames = new Set(overrides.map(function (o) { return o.name; }));
        existing.members = _(existing.members)
            .filter(function (m) { return !overriddenNames.has(m.name); })
            .concat(overrides)
            .value();
    };
    Collector.prototype._walkInterfaceDeclaration = function (node) {
        var _this = this;
        // TODO: How can we determine for sure that this is the global date?
        if (node.name.text === 'Date') {
            return { type: 'reference', target: 'Date' };
        }
        return this._addType(node, function () {
            var e_1, _a, e_2, _b;
            var inherits = [];
            if (node.heritageClauses) {
                try {
                    for (var _c = __values(node.heritageClauses), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var clause = _d.value;
                        try {
                            for (var _e = __values(clause.types), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var type = _f.value;
                                var symbol = _this._symbolForNode(type.expression);
                                _this._walkSymbol(symbol);
                                inherits.push(_this._nameForSymbol(symbol));
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return {
                type: 'interface',
                members: node.members.map(_this._walkNode),
                inherits: inherits,
            };
        });
    };
    Collector.prototype._walkClassDeclaration = function (node) {
        var _this = this;
        if (!node.name) {
            return null;
        }
        // TODO: How can we determine for sure that this is the global date?
        if (node.name.text === 'Date') {
            return { type: 'reference', target: 'Date' };
        }
        return this._addType(node, function () {
            var e_3, _a, e_4, _b;
            var inherits = [];
            if (node.heritageClauses) {
                try {
                    for (var _c = __values(node.heritageClauses), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var clause = _d.value;
                        try {
                            for (var _e = __values(clause.types), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var type = _f.value;
                                var symbol = _this._symbolForNode(type.expression);
                                _this._walkSymbol(symbol);
                                inherits.push(_this._nameForSymbol(symbol));
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            return {
                type: 'class',
                members: node.members.map(_this._walkNode).filter(function (n) { return n.type; }),
                inherits: inherits,
            };
        });
    };
    Collector.prototype._walkMethodSignature = function (node) {
        var e_5, _a;
        var signature = this.checker.getSignatureFromDeclaration(node);
        var parameters = {};
        try {
            for (var _b = __values(signature.getParameters()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var parameter = _c.value;
                var parameterNode = parameter.valueDeclaration;
                parameters[parameter.getName()] = this._walkNode(parameterNode.type);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return {
            type: 'method',
            name: node.name.getText(),
            parameters: parameters,
            returns: this._walkNode(node.type),
        };
    };
    Collector.prototype._walkPropertySignature = function (node) {
        var signature = this._walkNode(node.type);
        return {
            type: 'property',
            name: node.name.getText(),
            // We use the presence of a "questionToken" to say that the property is
            // nullable, which means we have to unwrap any 'not null' annotation from
            // the recursion.
            signature: (node.questionToken && signature.type === 'not null') ? signature.element : signature,
        };
    };
    Collector.prototype._walkPropertyDeclaration = function (node) {
        // We don't export private or protected members
        if (node.modifiers &&
            node.modifiers.find(function (t) {
                return t.kind === SyntaxKind.PrivateKeyword || t.kind === SyntaxKind.ProtectedKeyword;
            })) {
            return null;
        }
        return {
            type: 'property',
            name: node.name.getText(),
            signature: this._walkNode(node.type),
        };
    };
    Collector.prototype._walkTypeReferenceNode = function (node) {
        return { type: 'not null', element: this._referenceForSymbol(this._symbolForNode(node.typeName)) };
    };
    Collector.prototype._walkTypeAliasDeclaration = function (node) {
        var _this = this;
        return this._addType(node, function () { return ({
            type: 'alias',
            target: _this._walkNode(node.type),
        }); });
    };
    Collector.prototype._walkEnumDeclaration = function (node) {
        return this._addType(node, function () {
            var values = node.members.map(function (m) {
                // If the user provides an initializer, use the value of the initializer
                // as the GQL enum value _unless_ the initializer is a numeric literal.
                if (m.initializer && m.initializer.kind !== SyntaxKind.NumericLiteral) {
                    /**
                     *  Enums with initializers can look like:
                     *
                     *    export enum Type {
                     *      CREATED  = <any>'CREATED',
                     *      ACCEPTED = <any>'ACCEPTED',
                     *    }
                     *
                     *    export enum Type {
                     *      CREATED  = 'CREATED',
                     *      ACCEPTED = 'ACCEPTED',
                     *    }
                     */
                    var target = _.last(m.initializer.getChildren()) || m.initializer;
                    return _.trim(target.getText(), "'");
                }
                else {
                    /**
                     *  For Enums without initializers (or with numeric literal initializers), emit the
                     *  EnumMember name as the value. Example:
                     *    export enum Type {
                     *      CREATED,
                     *      ACCEPTED,
                     *    }
                     */
                    return _.trim(m.name.getText(), "'");
                }
            });
            return {
                type: 'enum',
                values: values,
            };
        });
    };
    Collector.prototype._walkTypeLiteralNode = function (node) {
        return {
            type: 'literal object',
            members: node.members.map(this._walkNode),
        };
    };
    Collector.prototype._walkArrayTypeNode = function (node) {
        return { type: 'not null', element: {
                type: 'array',
                elements: [this._walkNode(node.elementType)],
            } };
    };
    Collector.prototype._walkUnionTypeNode = function (node) {
        return {
            type: 'union',
            types: node.types.map(this._walkNode),
        };
    };
    Collector.prototype._walkTypeReference = function (type) {
        if (type.target && type.target.getSymbol().name === 'Array') {
            return {
                type: 'array',
                elements: type.typeArguments.map(this._walkType),
            };
        }
        else {
            throw new Error('Non-array type references not yet implemented');
        }
    };
    Collector.prototype._walkInterfaceType = function (type) {
        return this._referenceForSymbol(this._expandSymbol(type.getSymbol()));
    };
    // Utility
    Collector.prototype._addType = function (node, typeBuilder) {
        var name = this._nameForSymbol(this._symbolForNode(node.name));
        if (this.types[name])
            return this.types[name];
        var type = typeBuilder();
        type.documentation = util.documentationForNode(node);
        this.types[name] = type;
        return type;
    };
    Collector.prototype._symbolForNode = function (node) {
        return this._expandSymbol(this.checker.getSymbolAtLocation(node));
    };
    Collector.prototype._nameForSymbol = function (symbol) {
        symbol = this._expandSymbol(symbol);
        var parts = [];
        while (symbol) {
            parts.unshift(this.checker.symbolToString(symbol));
            symbol = symbol['parent'];
            // Don't include raw module names.
            if (symbol && symbol.flags === typescript.SymbolFlags.ValueModule)
                break;
        }
        return parts.join('.');
    };
    Collector.prototype._expandSymbol = function (symbol) {
        while (symbol.flags & typescript.SymbolFlags.Alias) {
            symbol = this.checker.getAliasedSymbol(symbol);
        }
        return symbol;
    };
    Collector.prototype._referenceForSymbol = function (symbol) {
        this._walkSymbol(symbol);
        var referenced = this.types[this._nameForSymbol(symbol)];
        if (referenced && referenced.type === 'interface') {
            referenced.concrete = true;
        }
        return {
            type: 'reference',
            target: this._nameForSymbol(symbol),
        };
    };
    return Collector;
}());
exports.default = Collector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwwQkFBNEI7QUFDNUIsdUNBQXlDO0FBR3pDLDZCQUErQjtBQUUvQixJQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO0FBQ3pDLElBQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUM7QUFFdkM7OztHQUdHO0FBQ0g7SUFPRSxtQkFBWSxPQUEwQjtRQUF0QyxpQkFFQztRQVJELFVBQUssR0FBaUI7WUFDcEIsSUFBSSxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDLEVBQUM7U0FDaEQsQ0FBQztRQUVNLFlBQU8sR0FBb0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQXlCN0QsZUFBZTtRQUVmLGNBQVMsR0FBRyxVQUFDLElBQW9CO1lBQy9CLDBCQUEwQjtZQUMxQixJQUFJLEtBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMxQixPQUFPLEtBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBZSxDQUFDO2FBQzdDO1lBQ0QsSUFBTSxhQUFhLEdBQTBCLEVBQUUsQ0FBQztZQUNoRCxLQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFdEMsSUFBSSxNQUFNLEdBQW1CLElBQUksQ0FBQztZQUNsQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLG9CQUFvQixFQUFFO2dCQUNqRCxNQUFNLEdBQUcsS0FBSSxDQUFDLHlCQUF5QixDQUFrQyxJQUFJLENBQUMsQ0FBQzthQUNoRjtpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLGdCQUFnQixFQUFFO2dCQUNw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
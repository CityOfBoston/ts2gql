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
// tslint:disable-next-line
// https://raw.githubusercontent.com/sogko/graphql-shorthand-notation-cheat-sheet/master/graphql-shorthand-notation-cheat-sheet.png
var Emitter = /** @class */ (function () {
    function Emitter(types) {
        var _this = this;
        this.types = types;
        this.renames = {};
        this._emitExpression = function (node) {
            if (!node) {
                return '';
            }
            else if (node.type === 'not null') {
                return _this._emitExpression(node.element) + "!";
            }
            else if (node.type === 'string') {
                return 'String'; // TODO: ID annotation
            }
            else if (node.type === 'number') {
                return 'Float'; // TODO: Int/Float annotation
            }
            else if (node.type === 'boolean') {
                return 'Boolean';
            }
            else if (node.type === 'reference') {
                return _this._name(node.target);
            }
            else if (node.type === 'array') {
                return "[" + node.elements.map(_this._emitExpression).join(' | ') + "]";
            }
            else if (node.type === 'literal object' || node.type === 'interface') {
                return _(_this._collectMembers(node))
                    .map(function (member) {
                    return _this._name(member.name) + ": " + _this._emitExpression(member.signature);
                })
                    .join(', ');
            }
            else if (node.type === 'union') {
                var notNullTypes = node.types.filter(function (_a) {
                    var type = _a.type;
                    return type !== 'null' && type !== 'undefined';
                });
                // If the lengths don’t match that means that we threw out an undefined
                // or null part of the union, so we need to unwrap the "not null" of
                // whatever’s left in the union.
                if (notNullTypes.length !== node.types.length) {
                    notNullTypes = notNullTypes.map(function (node) {
                        return node.type === 'not null' ? node.element : node;
                    });
                }
                if (notNullTypes.length !== 1) {
                    throw new Error("Can't serialize union with != 1 non-null type");
                }
                return _this._emitExpression(notNullTypes[0]);
            }
            else {
                throw new Error("Can't serialize " + node.type + " as an expression");
            }
        };
        this._collectMembers = function (node) {
            var e_1, _a, e_2, _b;
            var members = [];
            if (node.type === 'literal object') {
                members = node.members;
            }
            else {
                var seenProps = new Set();
                var interfaceNode = void 0;
                interfaceNode = node;
                // loop through this interface and any super-interfaces
                while (interfaceNode) {
                    try {
                        for (var _c = __values(interfaceNode.members), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var member = _d.value;
                            if (seenProps.has(member.name))
                                continue;
                            seenProps.add(member.name);
                            members.push(member);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    if (interfaceNode.inherits.length > 1) {
                        throw new Error("No support for multiple inheritence: " + JSON.stringify(interfaceNode.inherits));
                    }
                    else if (interfaceNode.inherits.length === 1) {
                        var supertype = _this.types[interfaceNode.inherits[0]];
                        if (supertype.type !== 'interface') {
                            throw new Error("Expected supertype to be an interface node: " + supertype);
                        }
                        interfaceNode = supertype;
                    }
                    else {
                        interfaceNode = null;
                    }
                }
            }
            try {
                for (var members_1 = __values(members), members_1_1 = members_1.next(); !members_1_1.done; members_1_1 = members_1.next()) {
                    var member = members_1_1.value;
                    if (member.type !== 'property') {
                        throw new Error("Expected members to be properties; got " + member.type);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (members_1_1 && !members_1_1.done && (_b = members_1.return)) _b.call(members_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return members;
        };
        // Utility
        this._name = function (name) {
            name = _this.renames[name] || name;
            return name.replace(/\W/g, '_');
        };
        this.types = _.omitBy(types, function (node, name) { return _this._preprocessNode(node, name); });
    }
    Emitter.prototype.emitAll = function (stream) {
        var _this = this;
        stream.write('\n');
        _.each(this.types, function (node, name) { return _this.emitTopLevelNode(node, name, stream); });
    };
    Emitter.prototype.emitTopLevelNode = function (node, name, stream) {
        var content;
        if (node.type === 'alias') {
            content = this._emitAlias(node, name);
        }
        else if (node.type === 'interface' || node.type === 'class') {
            content = this._emitInterface(node, name);
        }
        else if (node.type === 'enum') {
            content = this._emitEnum(node, name);
        }
        else {
            throw new Error("Don't know how to emit " + node.type + " as a top level node");
        }
        if (content) {
            stream.write(content + "\n\n");
        }
    };
    // Preprocessing
    Emitter.prototype._preprocessNode = function (node, name) {
        if (node.type === 'alias' && node.target.type === 'reference') {
            var referencedNode = this.types[node.target.target];
            if (this._isPrimitive(referencedNode) || referencedNode.type === 'enum') {
                this.renames[name] = node.target.target;
                return true;
            }
        }
        else if (node.type === 'alias' && this._hasDocTag(node, 'Int')) {
            this.renames[name] = 'Int';
            return true;
        }
        else if (node.type === 'alias' && this._hasDocTag(node, 'ID')) {
            this.renames[name] = 'ID';
            return true;
        }
        return false;
    };
    // Nodes
    Emitter.prototype._emitAlias = function (node, name) {
        if (this._isPrimitive(node.target)) {
            return "scalar " + this._name(name);
        }
        else if (node.target.type === 'reference') {
            return "union " + this._name(name) + " = " + this._name(node.target.target);
        }
        else if (node.target.type === 'union') {
            return this._emitUnion(node.target, name);
        }
        else {
            throw new Error("Can't serialize " + JSON.stringify(node.target) + " as an alias");
        }
    };
    Emitter.prototype._emitUnion = function (node, name) {
        var _this = this;
        node.types.map(function (type) {
            if (type.type !== 'reference') {
                throw new Error("GraphQL unions require that all types are references. Got a " + type.type);
            }
        });
        var firstChild = node.types[0];
        var firstChildType = this.types[firstChild.target];
        if (firstChildType.type === 'enum') {
            var nodeTypes = node.types.map(function (type) {
                var subNode = _this.types[type.target];
                if (subNode.type !== 'enum') {
                    throw new Error("ts2gql expected a union of only enums since first child is an enum. Got a " + type.type);
                }
                return subNode.values;
            });
            return this._emitEnum({
                type: 'enum',
                values: _.uniq(_.flatten(nodeTypes)),
            }, this._name(name));
        }
        else if (firstChildType.type === 'interface') {
            var nodeNames = node.types.map(function (type) {
                var subNode = _this.types[type.target];
                if (subNode.type !== 'interface') {
                    throw new Error("ts2gql expected a union of only interfaces since first child is an interface. " +
                        ("Got a " + type.type));
                }
                return type.target;
            });
            return "union " + this._name(name) + " = " + nodeNames.join(' | ');
        }
        else {
            throw new Error("ts2gql currently does not support unions for type: " + firstChildType.type);
        }
    };
    Emitter.prototype._emitInterface = function (node, name) {
        var _this = this;
        // GraphQL expects denormalized type interfaces
        var members = _(this._transitiveInterfaces(node))
            .map(function (i) { return i.members; })
            .flatten()
            .uniqBy('name')
            .sortBy('name')
            .value();
        // GraphQL can't handle empty types or interfaces, but we also don't want
        // to remove all references (complicated).
        if (!members.length) {
            if (node.concrete) {
                members.push({
                    type: 'property',
                    name: '__placeholder',
                    signature: { type: 'boolean' },
                });
            }
            else {
                // If no one was referencing this to begin with, just ignore it.
                return null;
            }
        }
        var isSchema = this._getDocTag(node, 'schema');
        var properties = _.map(members, function (member) {
            if (member.type === 'method') {
                var parameters = '';
                if (_.size(member.parameters) > 1) {
                    throw new Error("Methods can have a maximum of 1 argument");
                }
                else if (_.size(member.parameters) === 1) {
                    var argType = _.values(member.parameters)[0];
                    if (argType.type === 'reference') {
                        argType = _this.types[argType.target];
                    }
                    parameters = "(" + _this._emitExpression(argType) + ")";
                }
                var returnType = _this._emitExpression(member.returns);
                return "" + _this._name(member.name) + parameters + ": " + returnType;
            }
            else if (member.type === 'property') {
                var signature = member.signature;
                // Schemas can’t have the "!" that "not null" gives us. Schema properties
                // are always "not null."
                if (isSchema && signature.type === 'not null') {
                    signature = signature.element;
                }
                return _this._name(member.name) + ": " + _this._emitExpression(signature);
            }
            else {
                throw new Error("Can't serialize " + member.type + " as a property of an interface");
            }
        });
        if (isSchema) {
            return "schema {\n" + this._indent(properties) + "\n}";
        }
        else if (this._getDocTag(node, 'input')) {
            return "input " + this._name(name) + " {\n" + this._indent(properties) + "\n}";
        }
        if (node.concrete) {
            return "type " + this._name(name) + " {\n" + this._indent(properties) + "\n}";
        }
        var result = "interface " + this._name(name) + " {\n" + this._indent(properties) + "\n}";
        var fragmentDeclaration = this._getDocTag(node, 'fragment');
        if (fragmentDeclaration) {
            result = result + "\n\n" + fragmentDeclaration + " {\n" + this._indent(members.map(function (m) { return m.name; })) + "\n}";
        }
        return result;
    };
    Emitter.prototype._emitEnum = function (node, name) {
        return "enum " + this._name(name) + " {\n" + this._indent(node.values) + "\n}";
    };
    Emitter.prototype._isPrimitive = function (node) {
        return node.type === 'string' || node.type === 'number' || node.type === 'boolean';
    };
    Emitter.prototype._indent = function (content) {
        if (!_.isArray(content))
            content = content.split('\n');
        return content.map(function (s) { return "  " + s; }).join('\n');
    };
    Emitter.prototype._transitiveInterfaces = function (node) {
        var e_3, _a;
        var interfaces = [node];
        try {
            for (var _b = __values(node.inherits), _c = _b.next(); !_c.done; _c = _b.next()) {
                var name = _c.value;
                var inherited = this.types[name];
                interfaces = interfaces.concat(this._transitiveInterfaces(inherited));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return _.uniq(interfaces);
    };
    Emitter.prototype._hasDocTag = function (node, prefix) {
        return !!this._getDocTag(node, prefix);
    };
    Emitter.prototype._getDocTag = function (node, prefix) {
        var e_4, _a;
        if (!node.documentation)
            return null;
        try {
            for (var _b = __values(node.documentation.tags), _c = _b.next(); !_c.done; _c = _b.next()) {
                var tag = _c.value;
                if (tag.title !== 'graphql')
                    continue;
                if (tag.description.startsWith(prefix))
                    return tag.description;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return null;
    };
    return Emitter;
}());
exports.default = Emitter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9FbWl0dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBCQUE0QjtBQUs1QiwyQkFBMkI7QUFDM0IsbUlBQW1JO0FBQ25JO0lBR0UsaUJBQW9CLEtBQW1CO1FBQXZDLGlCQUVDO1FBRm1CLFVBQUssR0FBTCxLQUFLLENBQWM7UUFGdkMsWUFBTyxHQUF5QixFQUFFLENBQUM7UUE4S25DLG9CQUFlLEdBQUcsVUFBQyxJQUFlO1lBQ2hDLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1QsT0FBTyxFQUFFLENBQUM7YUFDWDtpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO2dCQUNuQyxPQUFVLEtBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFHLENBQUE7YUFDaEQ7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFDakMsT0FBTyxRQUFRLENBQUMsQ0FBQyxzQkFBc0I7YUFDeEM7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFDakMsT0FBTyxPQUFPLENBQUMsQ0FBQyw2QkFBNkI7YUFDOUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDbEMsT0FBTyxTQUFTLENBQUM7YUFDbEI7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRTtnQkFDcEMsT0FBTyxLQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNoQztpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFO2dCQUNoQyxPQUFPLE1BQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENB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
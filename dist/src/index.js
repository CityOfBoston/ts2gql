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
var path = require("path");
var util = require("./util");
var Collector_1 = require("./Collector");
var Emitter_1 = require("./Emitter");
function load(schemaRootPath, rootNodeNames) {
    var e_1, _a;
    schemaRootPath = path.resolve(schemaRootPath);
    var program = typescript.createProgram([schemaRootPath], {});
    var schemaRoot = program.getSourceFile(schemaRootPath);
    if (!schemaRoot) {
        throw new Error("Could not load source file from " + schemaRootPath);
    }
    var interfaces = {};
    typescript.forEachChild(schemaRoot, function (node) {
        if (!isNodeExported(node))
            return;
        if (node.kind === typescript.SyntaxKind.InterfaceDeclaration) {
            var interfaceNode = node;
            interfaces[interfaceNode.name.text] = interfaceNode;
            var documentation = util.documentationForNode(interfaceNode, schemaRoot.text);
            if (documentation && _.find(documentation.tags, { title: 'graphql', description: 'schema' })) {
                rootNodeNames.push(interfaceNode.name.text);
            }
        }
    });
    rootNodeNames = _.uniq(rootNodeNames);
    var collector = new Collector_1.default(program);
    try {
        for (var rootNodeNames_1 = __values(rootNodeNames), rootNodeNames_1_1 = rootNodeNames_1.next(); !rootNodeNames_1_1.done; rootNodeNames_1_1 = rootNodeNames_1.next()) {
            var name = rootNodeNames_1_1.value;
            var rootInterface = interfaces[name];
            if (!rootInterface) {
                throw new Error("No interface named " + name + " was exported by " + schemaRootPath);
            }
            collector.addRootNode(rootInterface);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rootNodeNames_1_1 && !rootNodeNames_1_1.done && (_a = rootNodeNames_1.return)) _a.call(rootNodeNames_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    _.each(interfaces, function (node, name) {
        var documentation = util.documentationForNode(node);
        if (!documentation)
            return;
        var override = _.find(documentation.tags, function (t) { return t.title === 'graphql' && t.description.startsWith('override'); });
        if (!override)
            return;
        var overrideName = override.description.split(' ')[1] || name;
        collector.mergeOverrides(node, overrideName);
    });
    return collector.types;
}
exports.load = load;
function emit(schemaRootPath, rootNodeNames, stream) {
    if (stream === void 0) { stream = process.stdout; }
    var loadedTypes = load(schemaRootPath, rootNodeNames);
    var emitter = new Emitter_1.default(loadedTypes);
    emitter.emitAll(stream);
}
exports.emit = emit;
function isNodeExported(node) {
    return !!node.modifiers && node.modifiers.some(function (m) { return m.kind === typescript.SyntaxKind.ExportKeyword; });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBQzVCLHVDQUF5QztBQUN6QywyQkFBNkI7QUFHN0IsNkJBQStCO0FBQy9CLHlDQUFvQztBQUNwQyxxQ0FBZ0M7QUFFaEMsU0FBZ0IsSUFBSSxDQUFDLGNBQXFCLEVBQUUsYUFBc0I7O0lBQ2hFLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzlDLElBQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMvRCxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRXpELElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDZixNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFtQyxjQUFnQixDQUFDLENBQUM7S0FDdEU7SUFFRCxJQUFNLFVBQVUsR0FBa0QsRUFBRSxDQUFDO0lBQ3JFLFVBQVUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFVBQUMsSUFBSTtRQUN2QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQztZQUFFLE9BQU87UUFDbEMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLEVBQUU7WUFDNUQsSUFBTSxhQUFhLEdBQW9DLElBQUksQ0FBQztZQUM1RCxVQUFVLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUM7WUFFcEQsSUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEYsSUFBSSxhQUFhLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENB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
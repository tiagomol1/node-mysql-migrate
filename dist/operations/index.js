"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = exports.foreignKeysToCreate = exports.tablesToCreate = exports.query = exports.createTable = void 0;
const tables_1 = require("./tables");
Object.defineProperty(exports, "createTable", { enumerable: true, get: function () { return tables_1.createTable; } });
Object.defineProperty(exports, "tablesToCreate", { enumerable: true, get: function () { return tables_1.tablesToCreate; } });
Object.defineProperty(exports, "foreignKeysToCreate", { enumerable: true, get: function () { return tables_1.foreignKeysToCreate; } });
const query_1 = require("./query");
Object.defineProperty(exports, "query", { enumerable: true, get: function () { return query_1.query; } });
Object.defineProperty(exports, "queries", { enumerable: true, get: function () { return query_1.queries; } });
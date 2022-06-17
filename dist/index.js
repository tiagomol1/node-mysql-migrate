"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.Table = void 0;
const migration_1 = __importDefault(require("./migration"));
const index_1 = require("./operations/index");
Object.defineProperty(exports, "Table", { enumerable: true, get: function () { return index_1.Table; } });
Object.defineProperty(exports, "query", { enumerable: true, get: function () { return index_1.query; } });
exports.default = migration_1.default;

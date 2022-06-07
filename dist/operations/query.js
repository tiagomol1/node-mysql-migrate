"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.queries = void 0;
exports.queries = [];
function query(command) {
    exports.queries.push(command);
}
exports.query = query;

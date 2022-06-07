"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const mysql_1 = __importDefault(require("mysql"));
function database(db_config) {
    async function query(command) {
        const connection = mysql_1.default.createConnection(db_config);
        const results = await new Promise((resolve) => {
            connection.query(command, (err, result) => {
                if (err)
                    throw err;
                resolve(result);
            });
        });
        await connection.end();
        return results;
    }
    return {
        query
    };
}
exports.database = database;

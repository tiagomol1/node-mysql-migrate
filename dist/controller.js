"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationController = void 0;
const lodash_1 = __importDefault(require("lodash"));
const index_1 = require("./operations/index");
const runner_1 = require("./runner");
async function migrationController(query) {
    const exec = runner_1.runner(query);
    await exec.createControllerTables();
    const dbCreatedTables = await exec.getCreatedTables();
    const { pendingTablesToCreate, pendingToCreateForeignkey, pendingTablesToDrop, createdTablesToVerify } = identifyTables(dbCreatedTables);
    if (pendingTablesToDrop.length > 0) {
        await exec.sqlConstructorDropTable(pendingTablesToDrop);
    }
    if (pendingTablesToCreate.length > 0) {
        await exec.sqlConstructorCreateTable(pendingTablesToCreate);
        await exec.sqlConstructorForeignKeys(pendingToCreateForeignkey);
    }
    if (createdTablesToVerify.length > 0) {
        const { newFields, alteredFields, fieldsToDrop } = compareTables(createdTablesToVerify, dbCreatedTables);
        await exec.sqlContructorAlterTableDropColumn(fieldsToDrop);
        await exec.sqlContructorAlterTableModifyColumn(alteredFields);
        await exec.sqlContructorAlterTableAddColumn(newFields);
    }
    return await exec.runCommands();
}
exports.migrationController = migrationController;
function identifyTables(tables) {
    console.info('\n> Checking created, dropped and altered tables.');
    const createdTables = [];
    tables.map(table => {
        createdTables.push(table.tableName);
    });
    const pendingTablesToCreate = [];
    const pendingToCreateForeignkey = [];
    const pendingTablesToDrop = [];
    const createdTablesToVerify = [];
    index_1.tablesToCreate.map((table) => {
        if (createdTables.includes(table.table.tableName)) {
            return createdTablesToVerify.push(table.table);
        }
        else {
            // set new pending tables and foreign keys to create
            const foreign = index_1.foreignKeysToCreate.filter(foreignToCreate => {
                return foreignToCreate.tableName == table.table.tableName;
            });
            if (foreign.length > 0) {
                pendingToCreateForeignkey.push(foreign[0]);
            }
            return pendingTablesToCreate.push(table);
        }
    });
    // set tables to drop
    createdTables.map(table => {
        const exists = index_1.tablesToCreate.filter(tableCreate => {
            return tableCreate.table.tableName === table;
        });
        if (exists.length == 0) {
            return pendingTablesToDrop.push({ tableName: table });
        }
    });
    return {
        pendingTablesToCreate,
        pendingToCreateForeignkey,
        pendingTablesToDrop,
        createdTablesToVerify
    };
}
function compareTables(tables, createdTables) {
    const ordenedCreatedTables = [];
    // sorting table sequences for comparison
    tables.forEach(table => {
        const item = createdTables.filter(createdTables => {
            return createdTables.tableName == table.tableName;
        });
        ordenedCreatedTables.push(item[0]);
    });
    const newFields = [];
    const alteredFields = [];
    const fieldsToDrop = [];
    // running comparisons
    for (let i = 0; i < tables.length; i++) {
        if (!lodash_1.default.isEqual(tables[i], ordenedCreatedTables[i])) {
            // comparison to find new and changed fields
            tables[i].fields.map(field => {
                const correspondentField = ordenedCreatedTables[i].fields
                    .filter(correspondentField => {
                    return correspondentField.name == field.name;
                });
                if (correspondentField.length == 0) {
                    newFields.push({ field: field, tableName: tables[i].tableName });
                }
                else {
                    if (!lodash_1.default.isEqual(field, correspondentField[0])) {
                        alteredFields.push({ field: field, tableName: tables[i].tableName });
                    }
                }
            });
            // comparison to find fields that will be dropped
            ordenedCreatedTables[i].fields.map(field => {
                const correspondentField = tables[i].fields
                    .filter(correspondentField => {
                    return correspondentField.name == field.name;
                });
                if (correspondentField.length == 0) {
                    fieldsToDrop.push({ field: field, tableName: ordenedCreatedTables[i].tableName });
                }
            });
        }
    }
    return {
        newFields,
        alteredFields,
        fieldsToDrop
    };
}

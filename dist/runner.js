"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runner = void 0;
const index_1 = require("./operations/index");
async function runner(query) {
    const db_getTables = await query('show tables');
    const { pendingTablesToCreate, pendingTablesToDrop, createdTablesToVerify } = verifyTables(db_getTables);
    if (pendingTablesToDrop.length > 0) {
        await runningDropTable(pendingTablesToDrop, query);
    }
    if (pendingTablesToCreate.length > 0) {
        await runningCreateTable(pendingTablesToCreate, query);
    }
    if (createdTablesToVerify.length > 0) {
        await compareCreatedTables(createdTablesToVerify, query);
    }
}
exports.runner = runner;
function verifyTables(tables) {
    console.info('\n> Checking created, dropped and altered tables.');
    const createdTables = [];
    tables.map(table => {
        createdTables.push(table[Object.keys(table)[0]]);
    });
    const pendingTablesToCreate = [];
    const pendingTablesToDrop = [];
    const createdTablesToVerify = [];
    index_1.tablesToCreate.map((table) => {
        if (createdTables.includes(table.table.tableName)) {
            createdTablesToVerify.push(table.table);
        }
        else {
            pendingTablesToCreate.push(table);
        }
    });
    createdTables.map(table => {
        const exists = index_1.tablesToCreate.filter(tableCreate => {
            return tableCreate.table.tableName === table;
        });
        if (exists.length == 0) {
            pendingTablesToDrop.push({ tableName: table });
        }
    });
    return {
        pendingTablesToCreate,
        pendingTablesToDrop,
        createdTablesToVerify
    };
}
async function runningDropTable(tables, query) {
    console.info('\n> Dropping unused tables:');
    return await tables.forEach(async (table) => {
        console.info(`  - Drop table ${table.tableName}`);
        await query(`delete from ${table.tableName};`);
        await query(`drop table ${table.tableName};`);
    });
}
async function runningCreateTable(tables, query) {
    console.info('\n> Creating new tables:');
    return await tables.forEach(async (table) => {
        console.info(`  - Create table ${table.table.tableName}`);
        await query(table.command);
    });
}
async function compareCreatedTables(tables, query) {
    console.log('\n> Compare schemas:');
}

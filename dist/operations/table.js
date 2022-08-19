"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foreignKeysToCreate = exports.tablesToCreate = exports.Table = void 0;
const tablesToCreate = [];
exports.tablesToCreate = tablesToCreate;
const foreignKeysToCreate = [];
exports.foreignKeysToCreate = foreignKeysToCreate;
class Table {
    constructor(table) {
        console.info(`> Generating SQL command to create '${table.tableName}' table.`);
        const commandCreate = [];
        commandCreate.push(`CREATE TABLE ${table.tableName} (`);
        commandCreate.push(this.parseColumns(table).join(', '));
        commandCreate.push(');');
        tablesToCreate.push({
            table: table,
            command: commandCreate.join('')
        });
    }
    parseColumns({ tableName, fields }) {
        return fields.map(field => {
            const fieldProperties = [];
            fieldProperties.push(field.name);
            fieldProperties.push(field.type);
            if (field.pk)
                fieldProperties.push('PRIMARY KEY');
            if (field.increment)
                fieldProperties.push('AUTO_INCREMENT');
            field.isNull
                ? fieldProperties.push('NULL')
                : fieldProperties.push('NOT NULL');
            if (field.default)
                fieldProperties.push(`DEFAULT '${field.default}'`);
            if (field.fk)
                this.parseForeignKeys(tableName, field);
            return fieldProperties.join(' ');
        });
    }
    parseForeignKeys(tableName, field) {
        foreignKeysToCreate.push({
            tableName: tableName,
            fieldName: field.name,
            fk_tableName: field.fk.tableName,
            fk_fieldName: field.fk.fieldName,
            command: `ALTER TABLE ${tableName} ADD FOREIGN KEY (${field.name}) REFERENCES ${field.fk.tableName}(${field.fk.fieldName});`
        });
    }
}
exports.Table = Table;

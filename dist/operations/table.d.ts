import { ITable, ITablesToCreate, IForeignKeyCommand } from './interfaces';
declare const tablesToCreate: ITablesToCreate[];
declare const foreignKeysToCreate: IForeignKeyCommand[];
declare class Table {
    constructor(table: ITable);
    private parseColumns;
    private parseForeignKeys;
}
export { Table, tablesToCreate, foreignKeysToCreate, };

import { ITable, ITablesToCreate, IForeignKeyCommand } from './interfaces';
declare const tablesToCreate: ITablesToCreate[];
declare const foreignKeysToCreate: IForeignKeyCommand[];
declare function createTable(table: ITable): void;
export { createTable, tablesToCreate, foreignKeysToCreate };

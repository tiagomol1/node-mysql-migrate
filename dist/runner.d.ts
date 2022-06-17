import { IDatabaseQuery, IColumns } from "./interfaces";
import { ITable, ITablesToCreate, IDropTable, IForeignKeyCommand } from './operations/interfaces';
export declare function runner(query: IDatabaseQuery): {
    createControllerTables: () => Promise<void>;
    getCreatedTables: () => Promise<ITable[]>;
    sqlConstructorDropTable: (tables: IDropTable[]) => void;
    sqlConstructorCreateTable: (tables: ITablesToCreate[]) => Promise<void>;
    sqlContructorAlterTableAddColumn: (columns: IColumns[]) => Promise<void>;
    sqlContructorAlterTableModifyColumn: (columns: IColumns[]) => Promise<void>;
    sqlContructorAlterTableDropColumn: (columns: IColumns[]) => Promise<void>;
    sqlConstructorForeignKeys: (foreignKeys: IForeignKeyCommand[]) => Promise<void>;
    runCommands: () => Promise<void>;
};

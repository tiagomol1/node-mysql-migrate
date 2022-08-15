interface ITable{
    tableName: string
    fields: IFields[]
}

interface IFields{
    name: string,
    type: 
        'CHAR' |
        'VARCHAR' |
        'BINARY' |
        'VARBINARY' |
        'TINYBINARY' |
        'TINYTEXT' |
        'TEXT' |
        'BLOB' |
        'MEDIUMTEXT' |
        'MEDIUMBLOB' |
        'LONGTEXT' |
        'LONGBLOB' |
        'BIT' |
        'TINYINT' |
        'BOOLEAN' |
        'SMALLINT' |
        'MEDIUMINT' |
        'INT' |
        'BIGINT' |
        'FLOAT' |
        'DOUBLE' |
        'DECIMAL' |
        'DATE' |
        'DATETIME' |
        'TIME' |
        'YEAR' | any
    ,
    pk?: boolean,
    fk?: IForeingKey,
    isNull: boolean
    increment?: boolean
    default?: any
}

interface IForeingKey{
    tableName: string,
    fieldName: string
}

interface IForeignKeyCommand{
    tableName: string,
    fieldName: string,
    fk_tableName: string,
    fk_fieldName: string,
    command: string
}

interface IDropTable{
    tableName: string
}

interface ITablesToCreate{
    table: ITable,
    command: string
}

export { 
    ITable, 
    IFields, 
    IDropTable, 
    ITablesToCreate,
    IForeignKeyCommand
}
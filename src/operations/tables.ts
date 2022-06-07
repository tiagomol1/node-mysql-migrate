import { 
    ITable, 
    IFields, 
    ITablesToCreate, 
    IForeignKeyCommand 
} from './interfaces'

const tablesToCreate: ITablesToCreate[] = []
const foreignKeysToCreate: IForeignKeyCommand[] = []

function createTable(table: ITable){

    console.info(`> Generating SQL command to create '${table.tableName}' table.`)

    const commandCreate = []

    commandCreate.push(`CREATE TABLE ${table.tableName} (`)
    commandCreate.push(parseColumns(table).join(', '))
    commandCreate.push(');')

    tablesToCreate.push({
        table: table, 
        command: commandCreate.join('')
    })

}

function parseColumns({ tableName,  fields }: ITable){
    
    return fields.map(field => {

        const fieldProperties = []
        fieldProperties.push(field.name)
        field.size 
            ? fieldProperties.push(`${field.type}(${field.size})`)
            : fieldProperties.push(field.type)
        
        if(field.pk) fieldProperties.push('PRIMARY KEY')

        if(field.increment) fieldProperties.push('AUTO_INCREMENT')        

        field.isNull 
            ? fieldProperties.push('NULL')
            : fieldProperties.push('NOT NULL')

        if(field.default)fieldProperties.push(`DEFAULT ${field.default}`)

        if(field.fk) parseForeignKeys(tableName, field)

        return fieldProperties.join(' ')

    })
}

function parseForeignKeys(tableName: string, field: IFields){

    foreignKeysToCreate.push({
        tableName: tableName,
        fieldName: field.name,
        fk_tableName: field.fk.tableName,
        fk_fieldName: field.fk.fieldName,
        command: `ALTER TABLE ${tableName} ADD FOREIGN KEY ${field.name} REFERENCES ${field.fk.tableName}(${field.fk.fieldName});`
    })

}


export {
    createTable,
    tablesToCreate,
    foreignKeysToCreate
}
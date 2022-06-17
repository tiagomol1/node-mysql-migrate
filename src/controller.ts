import _ from 'lodash'
import { tablesToCreate } from './operations/index'
import { ITable, ITablesToCreate, IDropTable } from './operations/interfaces'
import { IColumns, IDatabaseQuery } from './interfaces'
import { runner } from './runner'

export async function migrationController(query: IDatabaseQuery){

    const exec = runner(query)
    await exec.createControllerTables()
    const dbCreatedTables = await exec.getCreatedTables()
    
    const {
        pendingTablesToCreate,
        pendingTablesToDrop,
        createdTablesToVerify
    } = identifyTables(dbCreatedTables)


    if(pendingTablesToDrop.length > 0){
        await exec.sqlConstructorDropTable(pendingTablesToDrop)
    }
    if(pendingTablesToCreate.length > 0){
        await exec.sqlConstructorCreateTable(pendingTablesToCreate)
    }
    if(createdTablesToVerify.length > 0){
        const {
            newFields,
            alteredFields,
            fieldsToDrop
        } = compareTables(createdTablesToVerify, dbCreatedTables)   

        await exec.sqlContructorAlterTableDropColumn(fieldsToDrop)
        await exec.sqlContructorAlterTableModifyColumn(alteredFields)
        await exec.sqlContructorAlterTableAddColumn(newFields)
    }

    return await exec.runCommands()

}

function identifyTables(tables: ITable[]){
    console.info('\n> Checking created, dropped and altered tables.')

    const createdTables: string[] = []

    tables.map(table => {
        createdTables.push(table.tableName)
    })

    const pendingTablesToCreate: ITablesToCreate[] = []
    const pendingTablesToDrop: IDropTable[] = []
    const createdTablesToVerify: ITable[] = []

    tablesToCreate.map((table) => {
        if(createdTables.includes(table.table.tableName)){
            return createdTablesToVerify.push(table.table)
        }else{
            return pendingTablesToCreate.push(table)
        }
    })    

    createdTables.map(table => {
        const exists = tablesToCreate.filter(tableCreate => {
            return tableCreate.table.tableName === table
        })
        if(exists.length == 0){
            return pendingTablesToDrop.push({ tableName: table })
        }
    })

    return {
        pendingTablesToCreate,
        pendingTablesToDrop,
        createdTablesToVerify
    }

}

function compareTables(tables: ITable[], createdTables: ITable[]){

    const ordenedCreatedTables : ITable[] = []

    // sorting table sequences for comparison
    tables.forEach(table => {
        
        const item = createdTables.filter(createdTables =>{
            return createdTables.tableName == table.tableName
        })

        ordenedCreatedTables.push(item[0])
    })  

    const newFields : IColumns[] = []
    const alteredFields : IColumns[] = []
    const fieldsToDrop: IColumns[] = []
    
    // running comparisons
    for(let i = 0; i < tables.length; i++){

        if(!_.isEqual(tables[i], ordenedCreatedTables[i])){

            // comparison to find new and changed fields
            tables[i].fields.map(field => {
                const correspondentField = ordenedCreatedTables[i].fields
                    .filter(correspondentField => {
                        return correspondentField.name == field.name
                    })
                
                if(correspondentField.length == 0){
                    newFields.push({field: field, tableName: tables[i].tableName})
                } else {
                    if(!_.isEqual(field, correspondentField[0])){
                        alteredFields.push({field: field, tableName: tables[i].tableName})
                    }
                }
            })

            // comparison to find fields that will be dropped
            ordenedCreatedTables[i].fields.map(field => {
                const correspondentField = tables[i].fields
                    .filter(correspondentField => {
                        return correspondentField.name == field.name
                    })
                
                if(correspondentField.length == 0){
                    fieldsToDrop.push({field: field, tableName: ordenedCreatedTables[i].tableName})
                }
            })

        }
        
    }

    return {
        newFields,
        alteredFields,
        fieldsToDrop
    }
}
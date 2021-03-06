import mysql, { ConnectionConfig } from "mysql"

export function database(db_config: ConnectionConfig){

    async function query(command: string){

        db_config.flags = '-FOUND_ROWS,IGNORE_SPACE'
        const connection = mysql.createConnection(db_config)

        const results =  await new Promise((resolve) => {
            connection.query(command, (err, result) => {
                if(err) throw err
                resolve(result)
            })
        })

        await connection.end()

        return results

    }

    return { query }

}
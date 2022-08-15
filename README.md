# node-mysql-migrate

Public project to perform migrations on mysql database.


## How to run

1. First step, install the dependency for your project. To make it, to do this you have to run this command:
```bash
  npm install node-mysql-migrate
```
> Obs: You need install mysql dependency too.

2. Create your migrations, example below:
```javascript
  import { createTable } from 'node-mysql-migrate'

  export default function users(){
      createTable({
          tableName: 'users',
          fields: [
              {
                  name: 'id',
                  type: 'INT',
                  pk: true,
                  isNull: false,
                  increment: true
              },
              {
                  name: 'fullname',
                  type: 'VARCHAR(255)',
                  isNull: false
              },
              {
                  name: 'email',
                  type: 'VARCHAR(255)',
                  isNull: false
              },
              {
                  name: 'password',
                  type: 'VARCHAR(255)',
                  isNull: false
              },
              {
                  name: 'typeAccess_id',
                  type: 'INT', 
                  fk: {
                      tableName: 'typeAccess',
                      fieldName: 'id'
                  },
                  isNull: false
              },
              {
                  name: 'created_at',
                  type: 'DATETIME',
                  default: 'NOW()',
                  isNull: false
              }
          ]
      })
  }
```

3. Create the migration data source, example below:
```javascript
  import MigrationDataSource from 'node-mysql-migrate'
  import users from './migrations/users'
  import typeAccess from './migrations/typeAccess'

  export default new MigrationDataSource({
      db_config: {    
          host     : '...yourHost',
          port     : 3306, //your port
          user     : '...yourUser',
          password : '...yourPass',
          database : '...yourDatabase',
      },
      migrations: [users, typeAccess]  
  })
```
> Obs: In the 'migrations' field you must add your migrations.

That's all folks.

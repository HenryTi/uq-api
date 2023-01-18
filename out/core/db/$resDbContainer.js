"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
import { DbContainer } from "./DbContainer";
import { env } from "../../tool/env";

class $ResDbContainer extends DbContainer {
    constructor() {
        super(consts.$res);
    }
    protected getDbConfig() { return env.connection; }

    async initLoad(): Promise<void> { }

    async createDatabase(): Promise<void> {
        await super.createDatabase();
        let sql = `
        CREATE TABLE if not exists ${this.dbName}.item(
            id int not null auto_increment primary key,
            fileName varchar(120),
            mimetype varchar(50),
            uploadDate datetime default now(),
            useDate datetime
        );
    `;
        await this.db.sql(sql, undefined);
        let proc = `
            DROP PROCEDURE IF EXISTS ${this.dbName}.createItem;
            CREATE PROCEDURE ${this.dbName}.createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
            BEGIN
                insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
                select last_insert_id() as id;
            END;
        `;
        await this.sql(proc, undefined);

        proc = `
            DROP PROCEDURE IF EXISTS ${this.dbName}.useItem;
            CREATE PROCEDURE ${this.dbName}.useItem(_id int)
            BEGIN
                update item set useDate=now() where id=_id;
            END;
        `;
        await this.sql(proc, undefined);
    }
}

export const $resDb = new $ResDbContainer();
*/ 
//# sourceMappingURL=$resDbContainer.js.map
import { env } from "../../../tool";
import { consts } from "../../consts";
import { Db$Res } from "../Db";
import { MyDb } from "./MyDb";
import { MyDbs } from "./MyDbs";

export class MyDb$Res extends MyDb implements Db$Res {
    constructor(myDbs: MyDbs) {
        super(myDbs, consts.$res)
    }
    protected override initConfig(dbName: string) { return env.connection; }

    override async createDatabase(): Promise<void> {
        await super.createDatabase();
        let tableItem = `
        CREATE TABLE if not exists ${this.name}.item(
            id int not null auto_increment primary key,
            fileName varchar(120),
            mimetype varchar(50),
            uploadDate datetime default now(),
            useDate datetime
        );
    `;
        // await this.sql(sql, undefined);
        let createItem = `
            DROP PROCEDURE IF EXISTS ${this.name}.createItem;
            CREATE PROCEDURE ${this.name}.createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
            BEGIN
                insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
                select last_insert_id() as id;
            END;
        `;
        // await this.sql(proc, undefined);

        let useItem = `
            DROP PROCEDURE IF EXISTS ${this.name}.useItem;
            CREATE PROCEDURE ${this.name}.useItem(_id int)
            BEGIN
                update item set useDate=now() where id=_id;
            END;
        `;
        await Promise.all([tableItem, createItem, useItem].map(v => this.sql(v, undefined)));
    }
}

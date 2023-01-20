"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$Res = void 0;
const tool_1 = require("../../../tool");
const consts_1 = require("../../consts");
const MyDb_1 = require("./MyDb");
class MyDb$Res extends MyDb_1.MyDb {
    constructor() {
        super(consts_1.consts.$res);
    }
    connectionConfig() { return tool_1.env.connection; }
    async createDatabase() {
        await super.createDatabase();
        let sql = `
        CREATE TABLE if not exists ${this.name}.item(
            id int not null auto_increment primary key,
            fileName varchar(120),
            mimetype varchar(50),
            uploadDate datetime default now(),
            useDate datetime
        );
    `;
        await this.sql(sql, undefined);
        let proc = `
            DROP PROCEDURE IF EXISTS ${this.name}.createItem;
            CREATE PROCEDURE ${this.name}.createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
            BEGIN
                insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
                select last_insert_id() as id;
            END;
        `;
        await this.sql(proc, undefined);
        proc = `
            DROP PROCEDURE IF EXISTS ${this.name}.useItem;
            CREATE PROCEDURE ${this.name}.useItem(_id int)
            BEGIN
                update item set useDate=now() where id=_id;
            END;
        `;
        await this.sql(proc, undefined);
    }
}
exports.MyDb$Res = MyDb$Res;
//# sourceMappingURL=MyDb$Res.js.map
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    createDatabase() {
        const _super = Object.create(null, {
            createDatabase: { get: () => super.createDatabase }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.createDatabase.call(this);
            let sql = `
        CREATE TABLE if not exists ${this.name}.item(
            id int not null auto_increment primary key,
            fileName varchar(120),
            mimetype varchar(50),
            uploadDate datetime default now(),
            useDate datetime
        );
    `;
            yield this.sql(sql, undefined);
            let proc = `
            DROP PROCEDURE IF EXISTS ${this.name}.createItem;
            CREATE PROCEDURE ${this.name}.createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
            BEGIN
                insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
                select last_insert_id() as id;
            END;
        `;
            yield this.sql(proc, undefined);
            proc = `
            DROP PROCEDURE IF EXISTS ${this.name}.useItem;
            CREATE PROCEDURE ${this.name}.useItem(_id int)
            BEGIN
                update item set useDate=now() where id=_id;
            END;
        `;
            yield this.sql(proc, undefined);
        });
    }
}
exports.MyDb$Res = MyDb$Res;
//# sourceMappingURL=MyDb$Res.js.map
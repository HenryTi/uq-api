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
exports.MyDb$Site = void 0;
const tool_1 = require("../../../tool");
const consts_1 = require("../../consts");
const MyDb_1 = require("./MyDb");
class MyDb$Site extends MyDb_1.MyDb {
    constructor(myDbs) {
        super(myDbs, consts_1.consts.$site);
    }
    initConfig(dbName) { return tool_1.env.connection; }
    createDatabase() {
        const _super = Object.create(null, {
            createDatabase: { get: () => super.createDatabase }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                _super.createDatabase.call(this),
                this.buildProcSaveAtom(),
            ]);
        });
    }
    buildProcSaveAtom() {
        return __awaiter(this, void 0, void 0, function* () {
            const { $site } = consts_1.consts;
            const sql = `
        DROP PROCEDURE IF EXISTS ${$site}.saveAtom;
        CREATE PROCEDURE ${$site}.saveAtom(db VARCHAR(200), site BIGINT, atomPhrase VARCHAR(200), base BIGINT, keys0 VARCHAR(500), ex VARCHAR(200))
BEGIN
    IF EXISTS(SELECT routine_name
        FROM information_schema.routines 
        WHERE routine_schema='${$site}' AND routine_name=CONCAT(site, '$SaveAtom'))
    THEN
        SET @sql=CONCAT('${$site}.', site, '$');
    ELSE
        SET @sql=CONCAT(db, '.');
    END IF;
	SET @sql = concat('call ', @sql, 'SaveAtom(?,?,?,?)');
    PREPARE stmt FROM @sql;
    SET @atomPhrase=atomPhrase;
    SET @base=base;
    SET @keys0=keys0;
    SET @ex=ex;
    EXECUTE stmt USING @atomPhrase, @base, @keys0, @ex;
    DEALLOCATE PREPARE stmt;
END;
`;
            this.sql(sql, undefined);
        });
    }
}
exports.MyDb$Site = MyDb$Site;
//# sourceMappingURL=MyDb$Site.js.map
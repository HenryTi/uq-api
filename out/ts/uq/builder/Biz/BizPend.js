"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizPend = void 0;
const il_1 = require("../../il");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const BizEntity_1 = require("./BizEntity");
const sheetId = 'sheet';
const s = 's';
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const i = 'i';
const x = 'x';
const value = 'value';
const amount = 'amount';
const price = 'price';
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';
class BBizPend extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procQuery = this.createProcedure(`${this.context.site}.${id}gp`);
        this.buildQueryProc(procQuery);
    }
    buildQueryProc(proc) {
        let { pendQuery } = this.bizEntity;
        if (pendQuery === undefined) {
            proc.dropOnly = true;
            return;
        }
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push((0, il_1.bigIntField)('pendPhrase'));
        parameters.push((0, il_1.jsonField)('params'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_1.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
    }
}
exports.BBizPend = BBizPend;
//# sourceMappingURL=BizPend.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTextStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
class BTextStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { textVar, tableVar, sep, ln } = this.istatement;
        let { name, fields } = tableVar;
        let factory = this.context.factory;
        let dec = factory.createDeclare();
        sqls.push(dec);
        let vp = name + '#p';
        let vc = name + '#c';
        let vLen = name + '#len';
        dec.vars((0, il_1.intField)(vp), (0, il_1.intField)(vc), (0, il_1.intField)(vLen), (0, il_1.intField)('$row'));
        for (let f of fields) {
            dec.var(name + '##' + f.name, f.dataType);
        }
        let setP = factory.createSet();
        sqls.push(setP);
        setP.equ(vp, sql_1.ExpVal.num1);
        let setLen = factory.createSet();
        sqls.push(setLen);
        setLen.equ(vLen, new sql_1.ExpFunc(factory.func_length, new sql_1.ExpVar(textVar)));
        let loop = factory.createWhile();
        sqls.push(loop);
        loop.no = this.istatement.no;
        loop.cmp = new sql_1.ExpGT(new sql_1.ExpVar(vLen), sql_1.ExpVal.num0);
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let delimiter;
            let iff = undefined;
            if (i === len - 1) {
                delimiter = ln || '\\n';
                iff = factory.createIf();
                iff.cmp = new sql_1.ExpLT(new sql_1.ExpVar(vc), sql_1.ExpVal.num1);
                let setPC = factory.createSet();
                iff.then(setPC);
                setPC.equ(vc, new sql_1.ExpAdd(new sql_1.ExpVar(vLen), sql_1.ExpVal.num1));
            }
            else {
                delimiter = sep || '\\t';
            }
            let setC = factory.createSet();
            loop.statements.add(setC);
            setC.equ(vc, new sql_1.ExpFunc(factory.func_charindex, new sql_1.ExpStr(delimiter), new sql_1.ExpVar(textVar), new sql_1.ExpVar(vp)));
            if (iff !== undefined)
                loop.statements.add(iff);
            let setF = factory.createSet();
            loop.statements.add(setF);
            let field = fields[i];
            setF.equ(name + '##' + field.name, new sql_1.ExpFunc('NULLIF', new sql_1.ExpFunc(factory.func_substr, new sql_1.ExpVar(textVar), new sql_1.ExpVar(vp), new sql_1.ExpSub(new sql_1.ExpVar(vc), new sql_1.ExpVar(vp))), new sql_1.ExpStr('')));
            let setPAhead = factory.createSet();
            loop.statements.add(setPAhead);
            setPAhead.equ(vp, new sql_1.ExpAdd(new sql_1.ExpVar(vc), sql_1.ExpVal.num1));
        }
        let insert = factory.createInsert();
        loop.statements.add(insert);
        insert.table = new statementWithFrom_1.VarTable(name);
        for (let f of fields) {
            insert.cols.push({
                col: f.name,
                val: new sql_1.ExpVar(name + '##' + f.name)
            });
        }
        let iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new sql_1.ExpGT(new sql_1.ExpVar(vc), new sql_1.ExpVar(vLen));
        let leave = factory.createBreak();
        iffExit.then(leave);
        leave.no = this.istatement.no;
    }
}
exports.BTextStatement = BTextStatement;
//# sourceMappingURL=text.js.map
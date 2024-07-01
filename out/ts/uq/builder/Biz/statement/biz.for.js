"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFor = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement");
class BBizFor extends bstatement_1.BStatement {
    body(sqls) {
        this.buildForSelect(sqls);
    }
    buildForSelect(sqls) {
        const { statements } = this.istatement;
        this.createDeclareVars(sqls);
        let { no } = this.istatement;
        let { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        // 暂时都按inProc处理，所有的for 临时表都不删
        let varTable = factory.createForTable(true);
        sqls.push(varTable);
        let vt = varTable.name = '$for_' + no;
        let vtKey = '$tbl_' + vt;
        declare.var(vtKey, new il_1.Int());
        let setAtTblKey = factory.createSet();
        sqls.push(setAtTblKey);
        setAtTblKey.equ(vtKey, new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpAtVar(vtKey), sql_1.ExpNum.num0), sql_1.ExpNum.num1));
        setAtTblKey.isAtVar = true;
        let setTblKey = factory.createSet();
        sqls.push(setTblKey);
        setTblKey.equ(vtKey, new sql_1.ExpAtVar(vtKey));
        let tblField = (0, il_1.intField)('$tbl');
        tblField.nullable = false;
        let idField = (0, il_1.intField)('$id');
        idField.autoInc = true;
        idField.nullable = false;
        let fields = varTable.fields = [tblField, idField];
        varTable.keys = [tblField, idField];
        let intoFields = [];
        /*
        for (let v of this.forSelect.vars) {
            let f = new Field();
            f.name = v.name;
            f.dataType = v.dataType;
            f.nullable = true;
            fields.push(f);
            intoFields.push(f);
        }
        */
        intoFields.push(tblField);
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.col('a', 'a');
        select.where(this.context.expCmp(this.istatement.where));
        /*
        let selState = convertSelect(this.context, select);
        selState.column(new ExpVar(vtKey), '$tbl');
        let vtName = varTable.name;
        selState.into = {
            name: vtName,
            jName: vtName,
            sName: vtName,
            fields: intoFields,
            needTable: true
        };
        sqls.push(selState);
        */
        let row = '$row_' + no;
        let row_ok = '$row_ok_' + no;
        declare.vars((0, il_1.intField)(row));
        declare.vars((0, il_1.tinyIntField)(row_ok));
        let set = factory.createSet();
        sqls.push(set);
        set.equ(row, sql_1.ExpVal.num0);
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        let rowOkNull = factory.createSet();
        forS.push(rowOkNull);
        rowOkNull.equ(row_ok, sql_1.ExpVal.null);
        let incRow = factory.createSet();
        forS.push(incRow);
        incRow.equ(row, new sql_1.ExpAdd(new sql_1.ExpVar(row), sql_1.ExpVal.num1));
        let selInto = factory.createSelect();
        selInto.toVar = true;
        forS.push(selInto);
        selInto.column(sql_1.ExpNum.num1, row_ok);
        /*
        for (let v of this.forSelect.vars) {
            let n = v.name;
            selInto.col(n, v.pointer.varName(n));
        }
        */
        let fromVarTable = new statementWithFrom_1.VarTable(varTable.name);
        selInto.from(fromVarTable);
        let expWhere = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('$id'), new sql_1.ExpVar(row)), new sql_1.ExpEQ(new sql_1.ExpField('$tbl'), new sql_1.ExpVar(vtKey)));
        selInto.where(expWhere);
        let iff = factory.createIf();
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(row_ok));
        forS.push(iff);
        let leave = factory.createBreak();
        leave.no = no;
        iff.then(leave);
        let forSqls = new bstatement_1.Sqls(sqls.context, forS);
        forSqls.body(statements.statements);
    }
    createDeclareVars(sqls) {
        let declare = this.context.factory.createDeclare();
        sqls.push(declare);
        const { forCols } = this.istatement;
        for (let forCol of forCols) {
            declare.var(forCol.pointer.varName(forCol.name), forCol.dataType);
        }
    }
}
exports.BBizFor = BBizFor;
//# sourceMappingURL=biz.for.js.map
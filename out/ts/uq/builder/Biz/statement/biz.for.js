"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFor = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement");
const biz_select_1 = require("./biz.select");
class BBizFor extends biz_select_1.BBizSelect {
    body(sqls) {
        this.buildForSelect(sqls);
    }
    head(sqls) {
        const { statements } = this.istatement;
        sqls.head(statements.statements);
    }
    foot(sqls) {
        const { statements } = this.istatement;
        sqls.foot(statements.statements);
    }
    buildForSelect(sqls) {
        const { ids, values, vars, statements, fromEntity, where, isGroup, orderBys, limit } = this.istatement;
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
        for (let [n] of ids) {
            let vr = vars[n];
            let f = new il_1.Field();
            f.name = vr.name;
            f.dataType = vr.dataType;
            f.nullable = true;
            fields.push(f);
        }
        for (let [n] of values) {
            let vr = vars[n];
            let f = new il_1.Field();
            f.name = vr.name;
            f.dataType = vr.dataType;
            f.nullable = true;
            fields.push(f);
        }
        let insertFor = factory.createInsert();
        sqls.push(insertFor);
        const { cols: insertForCols } = insertFor;
        insertFor.table = new sql_1.SqlVarTable(varTable.name);
        let select = factory.createSelect();
        insertFor.select = select;
        const collField = {};
        insertForCols.push({ col: tblField.name, val: undefined });
        select.column(new sql_1.ExpVar(vtKey), tblField.name);
        for (let [n, idCol] of ids) {
            let expVal = idCol.fromEntity.expIdCol(); // new ExpField('id', idCol.fromEntity.alias);
            select.column(expVal, n);
            insertForCols.push({ col: n, val: undefined });
            collField[n] = expVal;
        }
        for (let [n, val] of values) {
            let expVal = this.context.expVal(val);
            if (isGroup === true) {
                expVal = new sql_1.ExpFunc(factory.func_sum, expVal);
            }
            select.column(expVal, n);
            insertForCols.push({ col: n, val: undefined });
            collField[n] = expVal;
        }
        this.buildSelectFrom(select, fromEntity);
        this.buildSelectJoin(select, fromEntity, undefined);
        select.where(this.context.expCmp(where), sql_1.EnumExpOP.and);
        if (isGroup === true) {
            for (let [, idCol] of ids) {
                //select.group(new ExpField('id', idCol.fromEntity.alias));
                select.group(idCol.fromEntity.expIdCol());
            }
        }
        if (orderBys.length > 0) {
            for (let { fieldName, asc } of orderBys) {
                let expVal = collField[fieldName];
                if (expVal === undefined)
                    debugger;
                select.order(expVal, asc === il_1.EnumAsc.desc ? 'desc' : 'asc');
            }
        }
        if (limit !== undefined) {
            select.limit(this.context.atomVal(limit));
        }
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
        for (let [n,] of ids) {
            let vr = vars[n];
            let vn = vr.varName();
            selInto.col(n, vn);
        }
        for (let [n,] of values) {
            let vr = vars[n];
            let vn = vr.varName();
            selInto.col(n, vn);
        }
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
        const { vars } = this.istatement;
        for (let i in vars) {
            let { name, pointer, dataType } = vars[i];
            declare.var(pointer.varName(name), dataType);
        }
    }
}
exports.BBizFor = BBizFor;
//# sourceMappingURL=biz.for.js.map
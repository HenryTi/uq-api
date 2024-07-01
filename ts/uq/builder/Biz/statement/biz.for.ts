import { EnumAsc, Field, Int, intField, tinyIntField } from '../../../il';
import { ExpIsNull, ExpNum, ExpVar, ExpEQ, ExpFunc, ExpVal, ExpAdd, ExpField, ExpAnd, ExpAtVar, VarTable, SqlVarTable } from '../../sql';
import { VarTable as FromVarTable } from '../../sql/statementWithFrom';

import { BizFor } from "../../../il";
import { Sqls } from "../../bstatement";
import { BBizSelect } from './biz.select';

export class BBizFor extends BBizSelect<BizFor> {
    body(sqls: Sqls): void {
        this.buildForSelect(sqls);
    }

    private buildForSelect(sqls: Sqls) {
        const { ids, values, vars, statements, fromEntity, where } = this.istatement;
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
        declare.var(vtKey, new Int());
        let setAtTblKey = factory.createSet();
        sqls.push(setAtTblKey);
        setAtTblKey.equ(vtKey,
            new ExpAdd(
                new ExpFunc(factory.func_ifnull, new ExpAtVar(vtKey), ExpNum.num0),
                ExpNum.num1
            )
        );
        setAtTblKey.isAtVar = true;

        let setTblKey = factory.createSet();
        sqls.push(setTblKey);
        setTblKey.equ(vtKey, new ExpAtVar(vtKey));

        let tblField = intField('$tbl');
        tblField.nullable = false;
        let idField = intField('$id');
        idField.autoInc = true;
        idField.nullable = false;

        let fields = varTable.fields = [tblField, idField];
        varTable.keys = [tblField, idField];
        for (let [n] of ids) {
            let vr = vars[n];
            let f = new Field();
            f.name = vr.name;
            f.dataType = vr.dataType;
            f.nullable = true;
            fields.push(f);
        }
        for (let [n] of values) {
            let vr = vars[n];
            let f = new Field();
            f.name = vr.name;
            f.dataType = vr.dataType;
            f.nullable = true;
            fields.push(f);
        }

        let insertFor = factory.createInsert();
        sqls.push(insertFor);
        insertFor.table = new SqlVarTable(varTable.name);
        let select = factory.createSelect();
        insertFor.select = select;
        for (let [n, idCol] of ids) {
            select.column(new ExpField('id', idCol.fromEntity.alias), n);
            insertFor.cols.push({ col: n, val: undefined });
        }
        for (let [n, val] of values) {
            let expVal = new ExpFunc(factory.func_sum, this.context.expVal(val));
            select.column(expVal, n);
            insertFor.cols.push({ col: n, val: undefined });
        }
        let entityTable = this.buildEntityTable(fromEntity);
        select.from(entityTable);
        this.buildSelectFrom(select, fromEntity);
        select.where(this.context.expCmp(where));
        for (let [, idCol] of ids) {
            select.group(new ExpField('id', idCol.fromEntity.alias));
        }
        for (let [, idCol] of ids) {
            select.order(new ExpField('id', idCol.fromEntity.alias), idCol.asc === EnumAsc.asc ? 'asc' : 'desc');
        }

        let row = '$row_' + no;
        let row_ok = '$row_ok_' + no;
        declare.vars(intField(row));
        declare.vars(tinyIntField(row_ok));
        let set = factory.createSet();
        sqls.push(set);
        set.equ(row, ExpVal.num0);
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);

        let rowOkNull = factory.createSet();
        forS.push(rowOkNull);
        rowOkNull.equ(row_ok, ExpVal.null);
        let incRow = factory.createSet();
        forS.push(incRow);
        incRow.equ(row, new ExpAdd(new ExpVar(row), ExpVal.num1));

        let selInto = factory.createSelect();
        selInto.toVar = true;
        forS.push(selInto);
        selInto.column(ExpNum.num1, row_ok);
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
        let fromVarTable = new FromVarTable(varTable.name);
        selInto.from(fromVarTable);
        let expWhere = new ExpAnd(
            new ExpEQ(new ExpField('$id'), new ExpVar(row)),
            new ExpEQ(new ExpField('$tbl'), new ExpVar(vtKey)),
        );
        selInto.where(expWhere);

        let iff = factory.createIf();
        iff.cmp = new ExpIsNull(new ExpVar(row_ok));
        forS.push(iff);
        let leave = factory.createBreak();
        leave.no = no;
        iff.then(leave);

        let forSqls = new Sqls(sqls.context, forS);
        forSqls.body(statements.statements);
    }

    protected createDeclareVars(sqls: Sqls) {
        let declare = this.context.factory.createDeclare();
        sqls.push(declare);
        const { vars } = this.istatement;
        for (let i in vars) {
            let { name, pointer, dataType } = vars[i];
            declare.var(pointer.varName(name), dataType);
        }
    }
}

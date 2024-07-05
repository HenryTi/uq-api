import { EnumAsc, Field, Int, intField, tinyIntField } from '../../../il';
import { ExpIsNull, ExpNum, ExpVar, ExpEQ, ExpFunc, ExpVal, ExpAdd, ExpField, ExpAnd, ExpAtVar, SqlVarTable } from '../../sql';
import { VarTable as FromVarTable } from '../../sql/statementWithFrom';

import { BizFor } from "../../../il";
import { Sqls } from "../../bstatement";
import { BBizSelect } from './biz.select';

export class BBizFor extends BBizSelect<BizFor> {
    override body(sqls: Sqls): void {
        this.buildForSelect(sqls);
    }

    override head(sqls: Sqls) {
        const { statements } = this.istatement;
        sqls.head(statements.statements);
    }

    override foot(sqls: Sqls) {
        const { statements } = this.istatement;
        sqls.foot(statements.statements);
    }

    private buildForSelect(sqls: Sqls) {
        const { ids, values, vars, statements, fromEntity, where, isGroup, orderBys } = this.istatement;
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
        const { cols: insertForCols } = insertFor;
        insertFor.table = new SqlVarTable(varTable.name);
        let select = factory.createSelect();
        insertFor.select = select;

        const collField: { [name: string]: ExpVal } = {};
        insertForCols.push({ col: tblField.name, val: undefined });
        select.column(new ExpVar(vtKey), tblField.name);
        for (let [n, idCol] of ids) {
            let expVal = new ExpField('id', idCol.fromEntity.alias);
            select.column(expVal, n);
            insertForCols.push({ col: n, val: undefined });
            collField[n] = expVal;
        }
        for (let [n, val] of values) {
            let expVal = this.context.expVal(val);
            if (isGroup === true) {
                expVal = new ExpFunc(factory.func_sum, expVal);
            }
            select.column(expVal, n);
            insertForCols.push({ col: n, val: undefined });
            collField[n] = expVal;
        }
        let entityTable = this.buildEntityTable(fromEntity);
        select.from(entityTable);
        this.buildSelectFrom(select, fromEntity);
        select.where(this.context.expCmp(where));
        if (isGroup === true) {
            for (let [, idCol] of ids) {
                select.group(new ExpField('id', idCol.fromEntity.alias));
            }
        }
        if (orderBys.length > 0) {
            for (let { fieldName, asc } of orderBys) {
                let expVal = collField[fieldName];
                if (expVal === undefined) debugger;
                select.order(expVal, asc === EnumAsc.desc ? 'desc' : 'asc');
            }
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

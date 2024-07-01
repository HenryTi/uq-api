import { Field, Int, intField, tinyIntField } from '../../../il';
import { ExpIsNull, ExpNum, ExpVar, ExpEQ, ExpFunc, ExpVal, ExpAdd, ExpField, ExpAnd, ExpAtVar } from '../../sql';
import { VarTable as FromVarTable } from '../../sql/statementWithFrom';

import { BizFor } from "../../../il";
import { BStatement, Sqls } from "../../bstatement";

export class BBizFor extends BStatement<BizFor> {
    body(sqls: Sqls): void {
        this.buildForSelect(sqls);
    }

    private buildForSelect(sqls: Sqls) {
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
        let intoFields: Field[] = [];
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
        /*
        for (let v of this.forSelect.vars) {
            let n = v.name;
            selInto.col(n, v.pointer.varName(n));
        }
        */
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
        const { forCols } = this.istatement;
        for (let forCol of forCols) {
            declare.var(forCol.pointer.varName(forCol.name), forCol.dataType);
        }
    }
}

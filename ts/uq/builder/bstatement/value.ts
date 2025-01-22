import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, Char, JoinType, Text, ValueStatement, ValueXi } from '../../il';
import { ExpVal, ExpVar, ExpAtVar, ExpEQ, ExpField, ExpStr, ExpFunc, convertExp } from '../sql';
import { EntityTable } from "../sql/statementWithFrom";
import { sysTable } from "../dbContext";

export class BValueStatement extends BStatement<ValueStatement> {
    override head(sqls: Sqls) {
        let { factory } = this.context;
        let { no } = this.istatement;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(`$type_${no}`, new Char(100));
        declare.var(`$sql_${no}`, new Text());
    }
    override body(sqls: Sqls) {
        let { valueXi } = this.istatement;
        if (valueXi !== undefined) {
            this.buildValueXi(sqls, valueXi);
            return;
        }
    }

    private buildValueXi(sqls: Sqls, valueXi: ValueXi) {
        let { no } = this.istatement;
        let { IX, xi, varType, varValue, typePointer, valuePointer } = valueXi;
        let { x: xiField } = IX;
        let { idType } = xiField;
        let { factory } = this.context;
        let selectType = factory.createSelect();
        sqls.push(selectType);
        selectType.toVar = true;
        let idRootTable: string;
        switch (idType) {
            case '$global': idRootTable = '$id'; break;
            case '$local': idRootTable = '$id_local'; break;
            case '$minute': idRootTable = '$id_minute'; break;
        }
        let expId = convertExp(this.context, xi) as ExpVal;
        selectType.column(new ExpField('name', 'b'), `$type_${no}`);
        selectType.from(new EntityTable(idRootTable, false, 'a'));
        selectType.join(JoinType.join, sysTable(EnumSysTable.entity, 'b'))
            .on(new ExpEQ(new ExpField('entity', 'a'), new ExpField('id', 'b')));
        selectType.where(new ExpEQ(new ExpField('id', 'a'), expId));

        let setAtId = factory.createSet();
        sqls.push(setAtId);
        setAtId.isAtVar = true;
        setAtId.equ(`id_${no}`, expId);

        let setSql = factory.createSet();
        sqls.push(setSql);
        setSql.equ(
            `$sql_${no}`,
            new ExpFunc(
                factory.func_concat,
                new ExpStr('select ' + this.context.twProfix),
                new ExpVar(`$type_${no}`),
                new ExpStr(`$value(@id_${no}) into @value_${no}`)
            )
        );
        let execSql = factory.createExecSql();
        sqls.push(execSql);
        execSql.no = no;
        execSql.sql = new ExpVar(`$sql_${no}`);

        if (varType) {
            let setType = factory.createSet();
            sqls.push(setType);
            setType.equ(typePointer.varName(varType), new ExpVar(`$type_${no}`));
        }
        if (varValue) {
            let setValue = factory.createSet();
            sqls.push(setValue);
            setValue.equ(valuePointer.varName(varValue), new ExpAtVar(`value_${no}`));
        }
    }
}


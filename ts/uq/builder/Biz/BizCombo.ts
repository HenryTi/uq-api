import { BigInt, BizCombo, EnumSysTable, Field, Index, bigIntField, tinyIntField } from "../../il";
import { $site } from "../consts";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpFuncDb, ExpIsNull, ExpNE, ExpNull, ExpNum, ExpSelect, ExpStr, ExpVar, Procedure } from "../sql";
import { EntityTable, GlobalTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizCombo extends BBizEntity<BizCombo> {
    override async buildTables(): Promise<void> {
        const { id, keys, indexes } = this.bizEntity;
        let table = this.createTable(`${this.context.site}.${id}`);
        let keyFields = keys.map(v => bigIntField(v.name));
        let idField = bigIntField('id');
        table.keys = [idField];
        table.fields = [idField, ...keyFields];
        let keyIndex = new Index('$key', true);
        keyIndex.fields.push(...keyFields);
        table.indexes.push(keyIndex);
    }

    override async buildProcedures(): Promise<void> {
        const { id } = this.bizEntity;
        const funcId = this.createFunction(`${this.context.site}.${id}.ID`, new BigInt());
        this.buildFuncId(funcId);
    }

    private buildFuncId(funcId: Procedure) {
        const { factory, dbName } = this.context;
        const { parameters, statements } = funcId;
        const { id, keys } = this.bizEntity;
        parameters.push(
            tinyIntField('new'),
            ...keys.map(v => v.createField())
        );
        const vId = '$id';
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(vId, new BigInt());

        let tbl = new GlobalTable($site, `${this.context.site}.${id}`);
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new ExpField('id'), vId);
        select.from(tbl);
        select.where(new ExpAnd(
            ...keys.map(v => {
                const { name } = v;
                return new ExpEQ(new ExpField(name), new ExpVar(name));
            })
        ));

        const iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpAnd(
            new ExpIsNull(new ExpVar(vId)),
            new ExpNE(new ExpVar('new'), ExpNum.num0),
        );
        const newId = factory.createSet();
        iff.then(newId);
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(new EntityTable(EnumSysTable.entity, false));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr('duo')));
        newId.equ(vId, new ExpFuncDb(dbName, '$IDMU', new ExpSelect(selectEntity), ExpNull.null));

        const insert = factory.createInsert();
        iff.then(insert);
        insert.table = tbl;
        insert.cols = [
            { col: 'id', val: new ExpVar(vId) },
            ...keys.map(v => ({ col: v.name, val: new ExpVar(v.name) })),
        ];

        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = vId;
    }
}

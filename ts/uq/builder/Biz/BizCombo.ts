import { BigInt, BizBud, BizCombo, EnumSysTable, Index, JoinType, bigIntField, tinyIntField } from "../../il";
import {
    ExpAnd, ExpDatePart, ExpEQ, ExpField, ExpFuncCustom, ExpFuncDb
    , ExpIsNull, ExpNE, ExpNull, ExpNum, ExpSelect, ExpStr, ExpVar, Procedure,
    Select
} from "../sql";
import { EntityTable, GlobalSiteTable, VarTable } from "../sql/statementWithFrom";
import { buildInsertIdTable } from "../tools";
import { BBizEntity } from "./BizEntity";

const a = 'a', b = 'b', c = 'c';

export class BBizCombo extends BBizEntity<BizCombo> {
    override async buildTables(): Promise<void> {
        const { id, keys, indexes } = this.bizEntity;
        let table = this.createSiteTable(id);
        let keyFields = keys.map(v => {
            let ret = bigIntField(String(v.id));
            ret.nullable = false;
            return ret;
        });
        let idField = bigIntField('id');
        table.keys = [idField];
        table.fields = [idField, ...keyFields];
        let keyIndex = new Index('$key', true);
        keyIndex.fields.push(...keyFields);
        table.indexes.push(keyIndex);
        for (let buds of indexes) {
            let name = buds.map(v => v.id).join('_');
            let index = new Index(name);
            table.indexes.push(index);
            index.fields = buds.map(v => v.createField());
        }
    }

    override async buildProcedures(): Promise<void> {
        // const { id } = this.bizEntity;
        const funcId = this.createSiteEntityFunction(new BigInt(), '.ID');
        this.buildFuncId(funcId);
        const toIdTable = this.createSiteEntityProcedure('ids');
        this.buildIdTable(toIdTable);
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

        let tbl = new GlobalSiteTable(this.context.site, id);
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new ExpField('id'), vId);
        select.from(tbl);
        select.where(new ExpAnd(
            ...keys.map(v => {
                const { id } = v;
                const name = String(id);
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
        // selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr('combo')));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr('spec')));  // 没有combo表,存放spec $id_u
        newId.equ(vId, new ExpFuncDb(dbName, '$IDMU', new ExpSelect(selectEntity), ExpNull.null));

        const insert = factory.createInsert();
        iff.then(insert);
        insert.table = tbl;
        insert.cols = [
            { col: 'id', val: new ExpVar(vId) },
            ...keys.map(v => {
                const name = String(v.id);
                return {
                    col: name,
                    val: new ExpVar(name),
                };
            }),
        ];

        const insertIDU = factory.createInsert();
        iff.then(insertIDU);
        insertIDU.ignore = true;
        insertIDU.table = new EntityTable(EnumSysTable.idu, false);
        insertIDU.cols = [
            { col: 'id', val: new ExpVar(vId) },
            { col: 'base', val: new ExpNum(id) },
        ];

        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = vId;
    }

    private buildIdTable(proc: Procedure) {
        const { keys } = this.bizEntity;
        const { statements } = proc;
        for (let key of keys) {
            statements.push(this.buildInsertProp(key));
            statements.push(this.buildInsertKey(key));
        }
    }

    private buildInsertProp(key: BizBud) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ]
        const { id: keyId } = key;
        const expValue = new ExpField(String(keyId), a);
        const select = factory.createSelect();
        insert.select = select;
        select.column(new ExpField('id', a), 'id');
        select.column(new ExpNum(keyId), 'phrase');
        select.column(new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('JSON')), 'value');
        select.from(new GlobalSiteTable(this.context.site, this.bizEntity.id, a))
            .join(JoinType.join, new VarTable('$page', b))
            .on(new ExpEQ(new ExpField('i', b), new ExpField('id', a)));
        return insert;
    }

    private buildInsertKey(key: BizBud) {
        const expId = new ExpField(String(key.id), a);
        const buildFrom = (select: Select): void => {
            select.from(new GlobalSiteTable(this.context.site, this.bizEntity.id, a))
                .join(JoinType.join, new VarTable('$page', b))
                .on(new ExpEQ(new ExpField('i', b), new ExpField('id', a)))
        }
        let insert = buildInsertIdTable(this.context, expId, false, buildFrom);
        /*
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTable('idtable');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'seed', val: undefined },
            { col: 'show', val: undefined },
        ]
        const expId = new ExpField(String(key.id), a);
        const select = factory.createSelect();
        insert.select = select;
        select.column(expId, 'id');
        select.column(new ExpField('base', c), 'phrase');
        select.column(ExpNum.num0, 'seed');
        select.column(ExpNum.num0, 'show');
        select.from(new GlobalSiteTable(this.context.site, this.bizEntity.id, a))
            .join(JoinType.join, new VarTable('$page', b))
            .on(new ExpEQ(new ExpField('i', b), new ExpField('id', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, c))
            .on(new ExpEQ(new ExpField('id', c), expId));
        */
        return insert;
    }
}

import {
    EnumSysTable, BigInt, BizStatementPend, SetEqu, BizBinAct, BizAct, BizInAct, JoinType, JsonDataType
} from "../../../il";
import { ExpAdd, ExpAnd, ExpCmp, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIsNotNull, ExpIsNull, ExpNE, ExpNull, ExpNum, ExpStr, ExpSub, ExpVal, ExpVar, Statement } from "../../sql";
import { EntityTable, GlobalSiteTable } from "../../sql/statementWithFrom";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";


const a = 'a', b = 'b';
const pendFrom = '$pend';
const binId = '$bin';
export abstract class BBizStatementPend<T extends BizAct> extends BStatement<BizStatementPend<T>> {
    // 可以发送sheet主表，也可以是Detail
    body(sqls: Sqls) {
        const { context } = this;
        const { factory, varSite, varUser } = context;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Pend';

        const a = 'a';
        let declare = factory.createDeclare();
        sqls.push(declare);
        let { pend, no, val, setEqu, sets, keys, setI, setX } = this.istatement;

        function buildUpdatePoke(): Statement[] {
            let updatePoke = factory.createUpdate();
            updatePoke.table = new EntityTable(EnumSysTable.userSite, false);
            updatePoke.cols = [
                { col: 'poke', val: ExpNum.num1 },
            ];
            updatePoke.where = new ExpEQ(
                new ExpField('site'), new ExpVar('$site'),
            );
            return [updatePoke];
        }

        function buildChangePendFrom() {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new EntityTable(EnumSysTable.pend, false, a);
            update.where = new ExpEQ(
                new ExpField('id', a), new ExpVar(pendFrom)
            );
            let cols = update.cols = [];
            let expValueField = new ExpField('value', a);
            switch (setEqu) {
                case SetEqu.equ: break;
                case SetEqu.add: expValue = new ExpAdd(expValueField, expValue); break;
                case SetEqu.sub: expValue = new ExpSub(expValueField, expValue); break;
            }
            cols.push({ col: 'value', val: expValue });
            let del = factory.createDelete();
            sqls.push(del);
            del.tables = [a];
            del.from(new EntityTable(EnumSysTable.pend, false, a));
            del.where(new ExpAnd(
                new ExpEQ(new ExpField('id', a), new ExpVar(pendFrom)),
                new ExpEQ(new ExpField('value', a), ExpNum.num0),
            ))
            sqls.push(...buildUpdatePoke());
        }

        const buildWritePend = () => {
            let pendId = '$pendId_' + no;
            declare.var(pendId, new BigInt());
            let mid = '$mid_' + no;
            declare.var(mid, new JsonDataType());

            if (val === undefined) {
                expValue = new ExpVar('value');
            }
            let ifValue = factory.createIf();
            sqls.push(ifValue);
            ifValue.cmp = new ExpNE(expValue, ExpNum.num0);

            let setPendId = factory.createSet();
            setPendId.equ(pendId,
                new ExpFuncInUq(
                    'pend$id',
                    [varSite, varUser, ExpNum.num1, ExpVal.null, new ExpNum(pend.id)],
                    true
                )
            );

            if (keys === undefined) {
                ifValue.then(setPendId);
            }
            else {
                let setPendIdNull = factory.createSet();
                ifValue.then(setPendIdNull);
                setPendIdNull.equ(pendId, ExpNull.null);

                // let pendKeyTableName = `${this.context.site}.${pend.id}`;
                let pendKeyTable = new GlobalSiteTable(this.context.site, pend.id, a);
                let selectPendId = factory.createSelect();
                ifValue.then(selectPendId);
                selectPendId.toVar = true;
                selectPendId.column(new ExpField('id', a), pendId);
                selectPendId.from(pendKeyTable)
                    .join(JoinType.join, new EntityTable(EnumSysTable.pend, false, b))
                    .on(new ExpEQ(new ExpField('id', b), new ExpField('id', a)));
                let wheres: ExpCmp[] = [];
                for (let [bud, val] of this.istatement.keys) {
                    wheres.push(new ExpEQ(new ExpField(String(bud.id), a), this.context.expVal(val)));
                }
                selectPendId.where(new ExpAnd(...wheres));

                let ifKeyedId = factory.createIf();
                ifValue.then(ifKeyedId);
                ifKeyedId.cmp = new ExpIsNull(new ExpVar(pendId));
                ifKeyedId.then(setPendId);
                let upsertPendKey = factory.createInsertOnDuplicate();
                ifKeyedId.then(upsertPendKey);
                let pendKeyTableInsert = new GlobalSiteTable(this.context.site, pend.id);
                upsertPendKey.table = pendKeyTableInsert;
                const { cols, keys } = upsertPendKey;
                cols.push({ col: 'id', val: new ExpVar(pendId) });
                for (let [bud, val] of this.istatement.keys) {
                    keys.push({ col: String(bud.id), val: this.context.expVal(val) });
                }
            }

            let setMid = factory.createSet();
            ifValue.then(setMid);
            setMid.equ(mid, new ExpFunc('JSON_OBJECT'));
            // let selectMids: Select[] = [];
            let vMid = new ExpVar(mid);
            function buildMidProp(prop: string, exp: ExpVal) {
                let iff = factory.createIf();
                ifValue.then(iff);
                iff.cmp = new ExpIsNotNull(exp);
                let setProp = factory.createSet();
                iff.then(setProp);
                setProp.equ(mid, new ExpFunc(
                    'JSON_SET', vMid, new ExpStr(`$."${prop}"`), exp
                ));
            }
            // let expMids: ExpVal[] = [];
            for (let s of sets) {
                let [bud, val] = s;
                buildMidProp(String(bud.id), context.expVal(val));
            }
            const { i, x } = pend;
            if (i !== undefined) {
                let val = setI === undefined ? new ExpVar(i.name) : context.expVal(setI);
                buildMidProp(String(i.id), val);
            }
            if (x !== undefined) {
                let val = setX === undefined ? new ExpVar(x.name) : context.expVal(setX);
                buildMidProp(String(x.id), val);
            }

            let update = factory.createUpdate();
            ifValue.then(update);

            update.table = new EntityTable(EnumSysTable.pend, false);
            update.cols = [
                { col: 'base', val: new ExpNum(pend.id) },
                { col: 'bin', val: new ExpVar(binId) },
                { col: 'value', val: expValue, setEqu },
                { col: 'mid', val: new ExpVar(mid) },
            ];
            update.where = new ExpEQ(
                new ExpField('id'), new ExpVar(pendId)
            );

            ifValue.then(...buildUpdatePoke());
        }

        let expValue = this.context.expVal(val);
        if (pend === undefined) {
            buildChangePendFrom();
        }
        else {
            buildWritePend();
        }
    }
}

export class BBizStatementBinPend extends BBizStatementPend<BizBinAct> {
    override foot(sqls: Sqls): void {
        const { factory } = this.context;
        let { pend } = this.istatement;
        if (pend !== undefined) return;

        const { bizBin } = this.istatement.bizStatement.bizAct;
        const { pend: binPend } = bizBin;
        const { keys } = binPend;
        if (keys !== undefined && keys.length > 0) {
            let del = factory.createDelete();
            sqls.push(del);
            del.tables = [a];
            del.from(new EntityTable(EnumSysTable.pend, false, a));
            del.join(JoinType.join, new GlobalSiteTable(this.context.site, binPend.id, b))
                .on(new ExpEQ(new ExpField('id', b), new ExpField('id', a)))
            del.where(new ExpAnd(
                new ExpEQ(new ExpField('id', a), new ExpVar(pendFrom)),
                new ExpEQ(new ExpField('value', a), ExpNum.num0),
            ));
        }
    }
}

export class BBizStatementInPend extends BBizStatementPend<BizInAct> {
    override foot(sqls: Sqls): void {
        // 这个没有在bizscript中定义
    }
}

import { EnumSysTable, JoinType, BizFromEntity, IdColumn, BizIDExtendable } from "../../../il";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpIn, ExpNum, ExpOr, ExpVal, Select,
} from "../../sql";
import { EntityTable, GlobalTable, Table } from "../../sql/statementWithFrom";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { BizSelectStatement } from "../../../il";
import { BStatement } from "../../bstatement";

export abstract class BBizSelect<T extends BizSelectStatement> extends BStatement<T> {
    protected buildSelectJoin(select: Select, fromEntity: BizFromEntity) {
        const { bizEntityArr, ofIXs, ofOn, alias, subs } = fromEntity;
        let expPrev = new ExpField('id', alias);
        if (ofIXs !== undefined) {
            let len = ofIXs.length;
            for (let i = 0; i < len; i++) {
                let ix = ofIXs[i];
                let tOf = 'of' + i;
                let tBud = 'bud' + i;

                let fieldBase = new ExpField('base', alias);
                let expBase = bizEntityArr.length === 1 ?
                    new ExpEQ(fieldBase, new ExpNum(bizEntityArr[0].id))
                    :
                    new ExpIn(
                        fieldBase,
                        ...bizEntityArr.map(v => new ExpNum(v.id))
                    );
                let wheres: ExpCmp[] = [
                    expBase,
                    new ExpEQ(new ExpField('id', tBud), new ExpField('i', tOf)),
                    new ExpEQ(new ExpField('base', tBud), new ExpNum(ix.id)),
                ];
                if (ofOn !== undefined) {
                    wheres.push(new ExpEQ(expPrev, this.context.expVal(ofOn)));
                }

                select.join(JoinType.join, new EntityTable(EnumSysTable.ixBud, false, tOf))
                    .on(new ExpEQ(new ExpField('x', tOf), expPrev))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, tBud))
                    .on(new ExpAnd(...wheres));
                expPrev = new ExpField('ext', tBud);
            }
        }
        if (subs !== undefined) {
            for (let sub of subs) {
                const { field, fromEntity: subFromEntity, isSpecBase } = sub;
                const { alias: subAlias, bizPhraseType, bizEntityArr } = subFromEntity;
                let entityIds: number[] = [];
                if (bizEntityArr.length > 0) {
                    let set = new Set<BizIDExtendable>();
                    for (let be of bizEntityArr) {
                        (be as BizIDExtendable).decendants(set);
                    }
                    entityIds.push(...[...set].map(v => v.id));
                }
                let entityIdsLength = entityIds.length;
                const entityTable = this.buildEntityTable(subFromEntity);
                let joinAtom: JoinType;
                let $idu = '$idu';
                let aliasIDU = subAlias + $idu;
                let expOnEQAtom = new ExpEQ(new ExpField('id', subAlias), new ExpField('id', aliasIDU));
                let expOn$Atom: ExpCmp;
                if (isSpecBase === true) {
                    joinAtom = JoinType.left;
                    expOn$Atom = new ExpOr(
                        expOnEQAtom,
                        new ExpEQ(new ExpField('id', subAlias), new ExpField('id', alias + $idu)),
                    );
                }
                else {
                    joinAtom = JoinType.join;
                    expOn$Atom = expOnEQAtom;
                }
                function buildExpOn(expAlias: ExpVal, expEQIdField: ExpCmp): ExpCmp {
                    let expEntities = entityIdsLength === 1 ?
                        new ExpEQ(expAlias, new ExpNum(entityIds[0]))
                        :
                        new ExpIn(expAlias, ...entityIds.map(v => new ExpNum(v)));
                    return entityIdsLength === 0 ?
                        expEQIdField
                        :
                        new ExpAnd(expEQIdField, expEntities);
                }
                switch (bizPhraseType) {
                    default:
                        select
                            .join(joinAtom, entityTable)
                            .on(new ExpEQ(new ExpField('id', subAlias), new ExpField(field, alias)));
                        break;
                    case BizPhraseType.atom:
                        let expOnAtom = buildExpOn(
                            new ExpField('base', aliasIDU), // expSubAlias, 
                            new ExpEQ(new ExpField('id', aliasIDU), new ExpField(field, alias)),
                        );
                        select
                            .join(joinAtom, entityTable)
                            .on(expOnAtom)
                            .join(JoinType.left, new EntityTable(EnumSysTable.atom, false, subAlias))
                            .on(expOn$Atom);
                        break;
                    case BizPhraseType.fork:
                        let expOnFork = buildExpOn(
                            new ExpField('base', aliasIDU),
                            new ExpEQ(new ExpField('id', subAlias), new ExpField('id', aliasIDU))
                        );
                        select
                            .join(JoinType.join, entityTable)
                            .on(new ExpEQ(new ExpField('id', aliasIDU), new ExpField(field, alias)))
                            .join(JoinType.left, new EntityTable(EnumSysTable.spec, false, subAlias))
                            .on(expOnFork)
                            ;
                        break;
                }
                this.buildSelectJoin(select, subFromEntity);
            }
        }
    }

    protected buildEntityTable(fromEntity: BizFromEntity) {
        let { bizEntityArr, bizEntityTable, alias: t0, bizPhraseType } = fromEntity;
        if (bizEntityTable !== undefined) {
            switch (bizPhraseType) {
                case BizPhraseType.atom:
                case BizPhraseType.fork: t0 += '$idu'; break;
            }
            let ret = new EntityTable(bizEntityTable, false, t0);
            return ret;
        }
        if (bizEntityArr.length === 0) {
            let ret = new EntityTable(EnumSysTable.idu, false, t0);
            return ret;
        }
        let ret = new GlobalTable('$site', `${this.context.site}.${bizEntityArr[0].id}`, t0);
        return ret;
    }

    protected buildSelectFrom(select: Select, fromEntity: BizFromEntity) {
        let table: Table;
        let { bizEntityArr, bizEntityTable, alias, bizPhraseType } = fromEntity;
        let t0 = alias;
        let t0$idu = alias + '$idu';
        let joinTable: EnumSysTable;
        if (bizEntityTable !== undefined) {
            switch (bizPhraseType) {
                case BizPhraseType.atom:
                    t0 = t0$idu;
                    joinTable = EnumSysTable.atom;
                    break;
                case BizPhraseType.fork:
                    t0 = t0$idu;
                    joinTable = EnumSysTable.spec;
                    break;
            }
            table = new EntityTable(bizEntityTable, false, t0);
        }
        else {
            table = new GlobalTable('$site', `${this.context.site}.${bizEntityArr[0].id}`, t0);
        }
        select.from(table);
        if (joinTable !== undefined) {
            let expIdEQ = new ExpEQ(new ExpField('id', alias), new ExpField('id', t0));
            let expBase = new ExpField('base', alias + '$idu');
            let expOn: ExpCmp;
            switch (bizEntityArr.length) {
                case 0:
                    expOn = expIdEQ;
                    break;
                case 1:
                    let e0 = bizEntityArr[0];
                    expOn = new ExpAnd(
                        expIdEQ,
                        new ExpEQ(expBase, new ExpNum(e0.id))
                    );
                    break;
                default:
                    expOn = new ExpAnd(
                        expIdEQ,
                        new ExpIn(expBase, ...bizEntityArr.map(v => new ExpNum(v.id))),
                    );
                    break;
            }
            select.join(JoinType.left, new EntityTable(joinTable, false, alias))
                .on(expOn);
        }
    }
}

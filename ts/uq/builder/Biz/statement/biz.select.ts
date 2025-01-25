import { EnumSysTable, JoinType, BizFromEntity, IdColumn, BizIDExtendable, BizEntity } from "../../../il";
import {
    EnumExpOP,
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpIn, ExpNE, ExpNum, ExpOr, ExpVal, Select,
} from "../../sql";
import { EntityTable, GlobalSiteTable, GlobalTable, Table } from "../../sql/statementWithFrom";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { BizSelectStatement } from "../../../il";
import { BStatement } from "../../bstatement";

export const $idu = ''; // '$idu';
export const $atom = '$atom';
export abstract class BBizSelect<T extends BizSelectStatement> extends BStatement<T> {
    protected buildSelectJoin(select: Select, fromEntity: BizFromEntity, excludeSub: (sub: BizFromEntity) => boolean) {
        this.buildSelectJoinIXs(select, fromEntity);
        this.buildSelectJoinSubs(select, fromEntity, excludeSub);
    }

    protected buildSelectJoinIXs(select: Select, fromEntity: BizFromEntity) {
        const { bizEntityArr, ofIXs, ofOn, alias } = fromEntity;
        let expPrev = new ExpField('id', alias);
        if (ofIXs === undefined) return;
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

            select.join(JoinType.join, new EntityTable(EnumSysTable.ix, false, tOf))
                .on(new ExpEQ(new ExpField('x', tOf), expPrev))
                .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, tBud))
                .on(new ExpAnd(...wheres));
            expPrev = new ExpField('ext', tBud);
        }
    }

    // 如果已经在$pageGroupBy表里面，有ids，则不要join sub
    protected buildSelectJoinSubs(select: Select, fromEntity: BizFromEntity, excludeSub: (sub: BizFromEntity) => boolean) {
        const { alias, subs } = fromEntity;
        if (subs === undefined) return;
        for (let sub of subs) {
            const { fromEntity: subFromEntity } = sub;
            if (excludeSub === undefined || excludeSub(sub.fromEntity) !== true) {
                const { field, fieldBud, isForkBase } = sub;
                const { alias: subAlias, bizPhraseType, bizEntityArr } = subFromEntity;
                let entityIds: number[] = [];
                if (bizEntityArr.length > 0) {
                    let set = new Set<BizEntity>();
                    for (let be of bizEntityArr) {
                        be.decendants(set);
                    }
                    entityIds.push(...[...set].map(v => v.id));
                }
                let entityIdsLength = entityIds.length;
                const entityTable = this.buildEntityTable(subFromEntity);
                let joinAtom: JoinType;
                let subAliasIDU = subAlias + $idu;
                let subAliasAtom = subAlias + $atom;
                let expOnEQAtom = new ExpEQ(new ExpField('id', subAliasAtom), new ExpField('id', subAliasIDU));
                let expOn$Atom: ExpCmp;
                if (isForkBase === true) {
                    // isForkBase
                    joinAtom = JoinType.left;
                    expOn$Atom = new ExpOr(
                        expOnEQAtom,
                        new ExpEQ(new ExpField('id', subAliasAtom), new ExpField('id', alias + $idu)),
                    );
                }
                else {
                    joinAtom = JoinType.join;
                    expOn$Atom = expOnEQAtom;
                }
                const buildExpOn = (expAlias: ExpVal, expEQIdField: ExpCmp): ExpCmp => {
                    let expCmpBase = this.buildExpCmpBase(subFromEntity, expAlias);
                    return entityIdsLength === 0 ?
                        expEQIdField
                        :
                        new ExpAnd(expEQIdField, expCmpBase);
                }
                const expMainField = fieldBud === undefined ?
                    new ExpField(field, alias + $idu)
                    :
                    new ExpField(String(fieldBud.id), alias);
                switch (bizPhraseType) {
                    default:
                        select
                            .join(joinAtom, entityTable)
                            .on(new ExpEQ(
                                new ExpField('id', subAlias),
                                expMainField
                            ));
                        break;
                    case BizPhraseType.bin:
                        let expBinOn: ExpCmp = new ExpEQ(
                            new ExpField(field, subAlias),
                            new ExpField('id', alias)
                        );
                        if (field === 'sheet') {
                            // 表示是明细，要去掉主表join
                            expBinOn = new ExpAnd(expBinOn, new ExpNE(
                                new ExpField('id', subAlias),
                                new ExpField('id', alias)
                            ));
                        }
                        select
                            .join(joinAtom, entityTable)
                            .on(expBinOn);
                        break;
                    case BizPhraseType.atom:
                        let expOnAtom = buildExpOn(
                            new ExpField('base', subAliasIDU), // expSubAlias, 
                            new ExpEQ(new ExpField('id', subAliasIDU), expMainField),
                        );
                        select
                            .join(joinAtom, entityTable)
                            .on(expOnAtom)
                            .join(JoinType.left, new EntityTable(EnumSysTable.atom, false, subAliasAtom))
                            .on(expOn$Atom);
                        break;
                    case BizPhraseType.fork:
                        select
                            .join(JoinType.join, entityTable)
                            .on(new ExpEQ(new ExpField('id', subAliasIDU), expMainField));
                        break;
                }
            }
            this.buildSelectJoinSubs(select, subFromEntity, excludeSub);
        }
    }

    protected buildExpCmpBase(fromEntity: BizFromEntity, expField: ExpVal): ExpCmp {
        const { bizEntityArr } = fromEntity;
        return bizEntityArr.length === 1 ?
            new ExpEQ(expField, new ExpNum(bizEntityArr[0].id))
            :
            new ExpIn(expField, ...bizEntityArr.map(v => new ExpNum(v.id)));
    }

    protected buildEntityTable(fromEntity: BizFromEntity) {
        let { bizEntityArr, bizEntityTable, alias: t0, bizPhraseType } = fromEntity;
        if (bizEntityTable !== undefined) {
            switch (bizPhraseType) {
                case BizPhraseType.atom:
                case BizPhraseType.fork: t0 += $idu; break;
            }
            let ret = new EntityTable(bizEntityTable, false, t0);
            return ret;
        }
        if (bizEntityArr.length === 0) {
            let ret = new EntityTable(EnumSysTable.idu, false, t0);
            return ret;
        }
        let ret = new GlobalSiteTable(this.context.site, bizEntityArr[0].id, t0);
        return ret;
    }

    protected buildSelectFrom(select: Select, fromEntity: BizFromEntity) {
        let table: Table;
        let { bizEntityArr, bizEntityTable, alias, bizPhraseType } = fromEntity;
        let t0 = alias;
        let joinTable: EnumSysTable;
        if (bizEntityTable !== undefined) {
            let t0$idu = alias + $idu;
            switch (bizPhraseType) {
                case BizPhraseType.atom:
                    t0 = t0$idu;
                    joinTable = EnumSysTable.atom;
                    break;
                case BizPhraseType.fork:
                    t0 = t0$idu;
                    // joinTable = EnumSysTable.fork;
                    break;
            }
            table = new EntityTable(bizEntityTable, false, t0);
            let expBaseEQ: ExpCmp;
            switch (bizEntityArr.length) {
                case 0:
                    break;
                case 1:
                    if (fromEntity.isExtended() === false) {
                        expBaseEQ = new ExpEQ(new ExpField('base', t0), new ExpNum(bizEntityArr[0].id))
                    }
                    break;
                default:
                    expBaseEQ = new ExpIn(new ExpField('base', t0), ...bizEntityArr.map(v => new ExpNum(v.id)))
                    break;
            }
            if (expBaseEQ !== undefined) {
                select.where(expBaseEQ, EnumExpOP.and);
            }
        }
        else {
            table = new GlobalSiteTable(this.context.site, bizEntityArr[0].id, t0);
        }
        select.from(table);
        if (joinTable !== undefined) {
            let aliasAtom = alias + $atom;
            let expIdEQ = new ExpEQ(new ExpField('id', aliasAtom), new ExpField('id', t0));
            let expOn: ExpCmp = expIdEQ;
            /*
            switch (bizEntityArr.length) {
                case 0:
                    expOn = expIdEQ;
                    break;
                case 1:
                    if (fromEntity.isExtended() === false) {
                        expOn = new ExpAnd(
                            expIdEQ,
                            new ExpEQ(new ExpField('base', t0), new ExpNum(bizEntityArr[0].id))
                        );
                    }
                    break;
                default:
                    expOn = new ExpAnd(
                        expIdEQ,
                        new ExpIn(new ExpField('base', t0), ...bizEntityArr.map(v => new ExpNum(v.id)))
                    )
                    break;
            }
            */
            select.join(JoinType.left, new EntityTable(joinTable, false, aliasAtom))
                .on(expOn);
        }
    }
}

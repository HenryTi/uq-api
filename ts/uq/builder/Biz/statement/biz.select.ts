import { EnumSysTable, JoinType, FromEntity, IdColumn, BizIDExtendable } from "../../../il";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpIn, ExpNum, ExpVal, Select
} from "../../sql";
import { EntityTable, GlobalTable } from "../../sql/statementWithFrom";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { BizSelectStatement } from "../../../il";
import { BStatement } from "../../bstatement";

export abstract class BBizSelect<T extends BizSelectStatement> extends BStatement<T> {
    protected buildSelectFrom(select: Select, fromEntity: FromEntity) {
        const { bizPhraseType, alias, bizEntityArr } = fromEntity;
        if (bizPhraseType === BizPhraseType.fork) {
            let budAlias = alias + '$bud';
            select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, budAlias))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('id', budAlias), new ExpField('base', alias)),
                    new ExpEQ(new ExpField('ext', budAlias), new ExpNum(bizEntityArr[0].id)),
                ));
        }
        this.buildSelectFromInternal(select, fromEntity);
    }

    private buildSelectFromInternal(select: Select, fromEntity: FromEntity) {
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
                let budAlias = alias + '$bud';
                let subBudAlias = subAlias + '$bud';
                let prevAlias = isSpecBase === true ? budAlias : alias;
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
                    case BizPhraseType.atom:
                        // let expEQIdField = new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias));
                        // let expSubAlias = new ExpField('base', subAlias);
                        let expOnAtom = buildExpOn(
                            new ExpField('base', subAlias), // expSubAlias, 
                            new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias)), // expEQIdField
                        );
                        /*
                        let expAtoms = entityIdsLength === 1 ?
                            new ExpEQ(expSubAlias, new ExpNum(entityIds[0]))
                            :
                            new ExpIn(expSubAlias, ...entityIds.map(v => new ExpNum(v)));
                        let expOnAtom = entityIdsLength === 0 ?
                            expEQIdField
                            :
                            new ExpAnd(expEQIdField, expAtoms);
                        */
                        select
                            .join(JoinType.join, entityTable)
                            .on(expOnAtom);
                        break;
                    case BizPhraseType.fork:
                        // let expEQSubIdBase = new ExpEQ(new ExpField('id', subBudAlias), new ExpField('base', subAlias));
                        // let expSubBudAlias = new ExpField('ext', subBudAlias);
                        /*
                        let expForks = entityIdsLength === 1 ?
                            new ExpEQ(expSubBudAlias, new ExpNum(entityIds[0]))
                            :
                            new ExpIn(expSubBudAlias, ...entityIds.map(v => new ExpNum(v)));
                        let expOnFork = entityIdsLength === 0 ?
                            expEQSubIdBase
                            :
                            new ExpAnd(expEQSubIdBase, expForks);
                        */
                        let expOnFork = buildExpOn(
                            new ExpField('ext', subBudAlias),
                            new ExpEQ(new ExpField('id', subBudAlias), new ExpField('base', subAlias))
                        );
                        select
                            .join(JoinType.join, entityTable)
                            .on(new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias)))
                            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, subBudAlias))
                            .on(expOnFork);
                        break;
                }
                this.buildSelectFromInternal(select, subFromEntity);
            }
        }
    }

    protected buildEntityTable(fromEntity: FromEntity) {
        const { bizEntityArr, bizEntityTable, alias: t0 } = fromEntity;
        if (bizEntityTable !== undefined) {
            let ret = new EntityTable(bizEntityTable, false, t0);
            return ret;
        }
        else {
            let ret = new GlobalTable('$site', `${this.context.site}.${bizEntityArr[0].id}`, t0);
            return ret;
        }
    }
}

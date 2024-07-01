import { EnumSysTable, JoinType, FromEntity } from "../../../il";
import {
    ExpAnd, ExpCmp, ExpEQ, ExpField, ExpIn, ExpNum, Select
} from "../../sql";
import { EntityTable, GlobalTable } from "../../sql/statementWithFrom";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { BizSelectStatement } from "../../../il";
import { BStatement } from "../../bstatement";

export abstract class BBizSelect<T extends BizSelectStatement> extends BStatement<T> {
    protected buildSelectFrom(select: Select, fromEntity: FromEntity) {
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
                const { alias: subAlias, bizPhraseType } = subFromEntity;
                let { id } = subFromEntity.bizEntityArr[0];
                const entityTable = this.buildEntityTable(subFromEntity);
                let budAlias = alias + '$bud';
                let subBudAlias = subAlias + '$bud';
                let prevAlias = isSpecBase === true ? budAlias : alias;
                switch (bizPhraseType) {
                    case BizPhraseType.atom:
                        select
                            .join(JoinType.join, entityTable)
                            .on(new ExpAnd(
                                new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias)),
                                new ExpEQ(new ExpField('base', subAlias), new ExpNum(id)),
                            ));
                        break;
                    case BizPhraseType.fork:
                        select
                            .join(JoinType.join, entityTable)
                            .on(new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias)));
                        select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, subBudAlias))
                            .on(new ExpAnd(
                                new ExpEQ(new ExpField('id', subBudAlias), new ExpField('base', subAlias)),
                                new ExpEQ(new ExpField('ext', subBudAlias), new ExpNum(id)),
                            ));
                        break;
                }
                this.buildSelectFrom(select, subFromEntity);
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

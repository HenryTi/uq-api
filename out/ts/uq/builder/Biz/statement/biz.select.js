"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizSelect = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const bstatement_1 = require("../../bstatement");
class BBizSelect extends bstatement_1.BStatement {
    buildSelectFrom(select, fromEntity) {
        const { bizPhraseType, alias, bizEntityArr } = fromEntity;
        if (bizPhraseType === BizPhraseType_1.BizPhraseType.fork) {
            let budAlias = alias + '$bud';
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, budAlias))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', budAlias), new sql_1.ExpField('base', alias)), new sql_1.ExpEQ(new sql_1.ExpField('ext', budAlias), new sql_1.ExpNum(bizEntityArr[0].id))));
        }
        this.buildSelectFromInternal(select, fromEntity);
    }
    buildSelectFromInternal(select, fromEntity) {
        const { bizEntityArr, ofIXs, ofOn, alias, subs } = fromEntity;
        let expPrev = new sql_1.ExpField('id', alias);
        if (ofIXs !== undefined) {
            let len = ofIXs.length;
            for (let i = 0; i < len; i++) {
                let ix = ofIXs[i];
                let tOf = 'of' + i;
                let tBud = 'bud' + i;
                let fieldBase = new sql_1.ExpField('base', alias);
                let expBase = bizEntityArr.length === 1 ?
                    new sql_1.ExpEQ(fieldBase, new sql_1.ExpNum(bizEntityArr[0].id))
                    :
                        new sql_1.ExpIn(fieldBase, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
                let wheres = [
                    expBase,
                    new sql_1.ExpEQ(new sql_1.ExpField('id', tBud), new sql_1.ExpField('i', tOf)),
                    new sql_1.ExpEQ(new sql_1.ExpField('base', tBud), new sql_1.ExpNum(ix.id)),
                ];
                if (ofOn !== undefined) {
                    wheres.push(new sql_1.ExpEQ(expPrev, this.context.expVal(ofOn)));
                }
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false, tOf))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('x', tOf), expPrev))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, tBud))
                    .on(new sql_1.ExpAnd(...wheres));
                expPrev = new sql_1.ExpField('ext', tBud);
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
                    case BizPhraseType_1.BizPhraseType.atom:
                        select
                            .join(il_1.JoinType.join, entityTable)
                            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField(field, prevAlias)), new sql_1.ExpEQ(new sql_1.ExpField('base', subAlias), new sql_1.ExpNum(id))));
                        break;
                    case BizPhraseType_1.BizPhraseType.fork:
                        select
                            .join(il_1.JoinType.join, entityTable)
                            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField(field, prevAlias)));
                        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, subBudAlias))
                            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', subBudAlias), new sql_1.ExpField('base', subAlias)), new sql_1.ExpEQ(new sql_1.ExpField('ext', subBudAlias), new sql_1.ExpNum(id))));
                        break;
                }
                this.buildSelectFromInternal(select, subFromEntity);
            }
        }
    }
    buildEntityTable(fromEntity) {
        const { bizEntityArr, bizEntityTable, alias: t0 } = fromEntity;
        if (bizEntityTable !== undefined) {
            let ret = new statementWithFrom_1.EntityTable(bizEntityTable, false, t0);
            return ret;
        }
        else {
            let ret = new statementWithFrom_1.GlobalTable('$site', `${this.context.site}.${bizEntityArr[0].id}`, t0);
            return ret;
        }
    }
}
exports.BBizSelect = BBizSelect;
//# sourceMappingURL=biz.select.js.map
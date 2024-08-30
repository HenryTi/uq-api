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
                const { alias: subAlias, bizPhraseType, bizEntityArr } = subFromEntity;
                let entityIds = [];
                if (bizEntityArr.length > 0) {
                    let set = new Set();
                    for (let be of bizEntityArr) {
                        be.decendants(set);
                    }
                    entityIds.push(...[...set].map(v => v.id));
                }
                let entityIdsLength = entityIds.length;
                const entityTable = this.buildEntityTable(subFromEntity);
                let budAlias = alias + '$bud';
                let subBudAlias = subAlias + '$bud';
                let prevAlias = isSpecBase === true ? budAlias : alias;
                function buildExpOn(expAlias, expEQIdField) {
                    let expEntities = entityIdsLength === 1 ?
                        new sql_1.ExpEQ(expAlias, new sql_1.ExpNum(entityIds[0]))
                        :
                            new sql_1.ExpIn(expAlias, ...entityIds.map(v => new sql_1.ExpNum(v)));
                    return entityIdsLength === 0 ?
                        expEQIdField
                        :
                            new sql_1.ExpAnd(expEQIdField, expEntities);
                }
                switch (bizPhraseType) {
                    case BizPhraseType_1.BizPhraseType.atom:
                        // let expEQIdField = new ExpEQ(new ExpField('id', subAlias), new ExpField(field, prevAlias));
                        // let expSubAlias = new ExpField('base', subAlias);
                        let expOnAtom = buildExpOn(new sql_1.ExpField('base', subAlias), // expSubAlias, 
                        new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField(field, prevAlias)));
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
                            .join(il_1.JoinType.join, entityTable)
                            .on(expOnAtom);
                        break;
                    case BizPhraseType_1.BizPhraseType.fork:
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
                        let expOnFork = buildExpOn(new sql_1.ExpField('ext', subBudAlias), new sql_1.ExpEQ(new sql_1.ExpField('id', subBudAlias), new sql_1.ExpField('base', subAlias)));
                        select
                            .join(il_1.JoinType.join, entityTable)
                            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField(field, prevAlias)))
                            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, subBudAlias))
                            .on(expOnFork);
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
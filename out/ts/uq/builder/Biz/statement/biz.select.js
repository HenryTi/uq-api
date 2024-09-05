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
        // const { bizPhraseType, alias, bizEntityArr } = fromEntity;
        /*
        if (bizPhraseType === BizPhraseType.fork) {
            let budAlias = alias + '$bud';
            select.join(JoinType.join, new EntityTable(EnumSysTable.bud, false, budAlias))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('id', budAlias), new ExpField('base', alias)),
                    new ExpEQ(new ExpField('ext', budAlias), new ExpNum(bizEntityArr[0].id)),
                ));
        }
        */
        this.buildSelectFromInternal(select, fromEntity);
    }
    buildSelectFromInternal(select, fromEntity) {
        const { bizEntityArr, ofIXs, ofOn, alias, subs, bizPhraseType: prevBizPhraseType } = fromEntity;
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
                let joinAtom;
                let $idu = '$idu';
                let aliasIDU = subAlias + $idu;
                let expOnEQAtom = new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField('id', aliasIDU));
                let expOn$Atom;
                if (isSpecBase === true) {
                    joinAtom = il_1.JoinType.left;
                    expOn$Atom = new sql_1.ExpOr(expOnEQAtom, new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField('id', alias + $idu)));
                }
                else {
                    joinAtom = il_1.JoinType.join;
                    expOn$Atom = expOnEQAtom;
                }
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
                        let expOnAtom = buildExpOn(new sql_1.ExpField('base', aliasIDU), // expSubAlias, 
                        new sql_1.ExpEQ(new sql_1.ExpField('id', aliasIDU), new sql_1.ExpField(field, alias)));
                        select
                            .join(joinAtom, entityTable)
                            .on(expOnAtom)
                            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, subAlias))
                            .on(expOn$Atom);
                        break;
                    case BizPhraseType_1.BizPhraseType.fork:
                        let expOnFork = buildExpOn(new sql_1.ExpField('base', aliasIDU), new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), new sql_1.ExpField('id', aliasIDU)));
                        select
                            .join(il_1.JoinType.join, entityTable)
                            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', aliasIDU), new sql_1.ExpField(field, alias)))
                            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, subAlias))
                            .on(expOnFork);
                        break;
                }
                this.buildSelectFromInternal(select, subFromEntity);
            }
        }
    }
    buildEntityTable(fromEntity) {
        let { bizEntityArr, bizEntityTable, alias: t0, bizPhraseType } = fromEntity;
        if (bizEntityTable !== undefined) {
            switch (bizPhraseType) {
                case BizPhraseType_1.BizPhraseType.atom:
                case BizPhraseType_1.BizPhraseType.fork:
                    t0 += '$idu';
                    break;
            }
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
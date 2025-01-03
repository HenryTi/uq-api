"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizSelect = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const bstatement_1 = require("../../bstatement");
class BBizSelect extends bstatement_1.BStatement {
    buildSelectJoin(select, fromEntity) {
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
                const { field, fieldBud, fromEntity: subFromEntity, isSpecBase } = sub;
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
                const buildExpOn = (expAlias, expEQIdField) => {
                    let expCmpBase = this.buildExpCmpBase(subFromEntity, expAlias);
                    return entityIdsLength === 0 ?
                        expEQIdField
                        :
                            new sql_1.ExpAnd(expEQIdField, expCmpBase);
                };
                const expMainField = new sql_1.ExpField(fieldBud === undefined ? field : String(fieldBud.id), alias);
                switch (bizPhraseType) {
                    default:
                        select
                            .join(joinAtom, entityTable)
                            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', subAlias), expMainField));
                        break;
                    case BizPhraseType_1.BizPhraseType.atom:
                        let expOnAtom = buildExpOn(new sql_1.ExpField('base', aliasIDU), // expSubAlias, 
                        new sql_1.ExpEQ(new sql_1.ExpField('id', aliasIDU), expMainField));
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
                            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', aliasIDU), expMainField))
                            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.fork, false, subAlias))
                            .on(expOnFork);
                        break;
                }
                this.buildSelectJoin(select, subFromEntity);
            }
        }
    }
    buildExpCmpBase(fromEntity, expField) {
        const { bizEntityArr } = fromEntity;
        return bizEntityArr.length === 1 ?
            new sql_1.ExpEQ(expField, new sql_1.ExpNum(bizEntityArr[0].id))
            :
                new sql_1.ExpIn(expField, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
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
        if (bizEntityArr.length === 0) {
            let ret = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, t0);
            return ret;
        }
        let ret = new statementWithFrom_1.GlobalSiteTable(this.context.site, bizEntityArr[0].id, t0);
        return ret;
    }
    buildSelectFrom(select, fromEntity) {
        let table;
        let { bizEntityArr, bizEntityTable, alias, bizPhraseType } = fromEntity;
        let t0 = alias;
        let joinTable;
        if (bizEntityTable !== undefined) {
            let t0$idu = alias + '$idu';
            switch (bizPhraseType) {
                case BizPhraseType_1.BizPhraseType.atom:
                    t0 = t0$idu;
                    joinTable = il_1.EnumSysTable.atom;
                    break;
                case BizPhraseType_1.BizPhraseType.fork:
                    t0 = t0$idu;
                    joinTable = il_1.EnumSysTable.fork;
                    break;
            }
            table = new statementWithFrom_1.EntityTable(bizEntityTable, false, t0);
        }
        else {
            table = new statementWithFrom_1.GlobalSiteTable(this.context.site, bizEntityArr[0].id, t0);
        }
        select.from(table);
        if (joinTable !== undefined) {
            let expIdEQ = new sql_1.ExpEQ(new sql_1.ExpField('id', alias), new sql_1.ExpField('id', t0));
            let expOn = expIdEQ;
            switch (bizEntityArr.length) {
                case 0:
                    expOn = expIdEQ;
                    break;
                case 1:
                    if (fromEntity.isExtended() === false) {
                        expOn = new sql_1.ExpAnd(expIdEQ, new sql_1.ExpEQ(new sql_1.ExpField('base', t0), new sql_1.ExpNum(bizEntityArr[0].id)));
                    }
                    break;
                default:
                    expOn = new sql_1.ExpAnd(expIdEQ, new sql_1.ExpIn(new sql_1.ExpField('base', t0), ...bizEntityArr.map(v => new sql_1.ExpNum(v.id))));
                    break;
            }
            select.join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(joinTable, false, alias))
                .on(expOn);
        }
    }
}
exports.BBizSelect = BBizSelect;
//# sourceMappingURL=biz.select.js.map
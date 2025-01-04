"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizCheckBud = exports.BBizFieldOperand = exports.BBizExp = void 0;
const il_1 = require("../../il");
const exp_1 = require("../sql/exp");
const BBudSelect_1 = require("./BBudSelect");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const consts_1 = require("../consts");
let bizEpxTblNo = 0;
class BBizExp {
    constructor() {
        ++bizEpxTblNo;
        this.ta = '$a' + bizEpxTblNo;
        this.tb = '$b' + bizEpxTblNo;
        this.tt = '$t' + bizEpxTblNo;
    }
    to(sb) {
        sb.l();
        if (this.expSelect !== undefined) {
            sb.exp(this.expSelect);
        }
        else {
            sb.append('SELECT ');
            const { bizEntity, expIDType } = this.bizExp;
            if (bizEntity !== undefined) {
                const { bizPhraseType } = bizEntity;
                switch (bizPhraseType) {
                    default:
                        debugger;
                        throw new Error(`not implemented bizPhraseType ${this.bizExp.bizEntity}`);
                    case BizPhraseType_1.BizPhraseType.bin:
                        this.bin(sb);
                        break;
                    case BizPhraseType_1.BizPhraseType.book:
                        this.book(sb);
                        break;
                    case BizPhraseType_1.BizPhraseType.tie:
                        this.tie(sb);
                        break;
                    case BizPhraseType_1.BizPhraseType.duo:
                        this.duo(sb);
                        break;
                    case BizPhraseType_1.BizPhraseType.combo:
                        this.combo(sb);
                        break;
                }
            }
            else {
                switch (expIDType) {
                }
                debugger;
            }
        }
        sb.r();
    }
    convertFrom(context, bizExp) {
        this.db = context.dbName;
        this.bizExp = bizExp;
        if (bizExp === undefined)
            return;
        const { param } = bizExp;
        if (param !== undefined) {
            const { params } = param;
            this.params = params.map(v => context.expVal(v));
        }
        const { in: inVar } = bizExp;
        if (inVar !== undefined) {
            const { val: inVal, spanPeiod } = inVar;
            this.inVal = new exp_1.ExpInterval(spanPeiod, context.expVal(inVal));
        }
        const { bizEntity } = this.bizExp;
        if (bizEntity !== undefined) {
            const { bizPhraseType } = bizEntity;
            switch (bizPhraseType) {
                case BizPhraseType_1.BizPhraseType.atom:
                case BizPhraseType_1.BizPhraseType.fork:
                    let bBudSelect = new BBudSelect_1.BBudSelect(context, this);
                    this.expSelect = bBudSelect.build();
                    break;
            }
        }
        else {
            let bBudSelect = new BBudSelect_1.BBudSelect(context, this);
            this.expSelect = bBudSelect.build();
        }
    }
    bin(sb) {
        const { budProp, sysBud } = this.bizExp;
        if (sysBud !== undefined)
            this.binSheetProp(sb);
        else if (budProp !== undefined)
            this.binBud(sb);
        else
            this.binField(sb);
    }
    binSheetProp(sb) {
        const { bizEntity, sysBud, isParent } = this.bizExp;
        const { ta, tb, tt } = this;
        const tSheet = '$tsheet';
        let col = tSheet + '.';
        switch (sysBud) {
            case il_1.EnumSysBud.sheetNo:
                col += 'no';
                break;
            case il_1.EnumSysBud.sheetOperator:
                col += 'operator';
                break;
        }
        let joinBud = `JOIN \`${this.db}\`.bud as ${tb} ON ${tb}.id=${ta}.id AND ${tb}.ext=${bizEntity.id}`;
        let sql, ttBin;
        if (isParent === true) {
            sql = `${col} 
                FROM \`${this.db}\`.detail as ${tt}
                    JOIN \`${this.db}\`.bin as ${ta} ON ${ta}.id=${tt}.base
                    ${joinBud} `;
            // WHERE ${tt}.id=`;
            ttBin = tt;
        }
        else {
            sql = `${col} 
                FROM \`${this.db}\`.detail as ${ta} ${joinBud} `;
            // WHERE ${ta}.id=`;
            ttBin = ta;
        }
        sql += ` JOIN \`${this.db}\`.sheet as ${tSheet} ON $tsheet.id=${tb}.base `;
        sql += ` WHERE ${ttBin}.id = `;
        sb.append(sql);
        sb.exp(this.params[0]);
    }
    binField(sb) {
        const { bizEntity, prop, isParent } = this.bizExp;
        const { ta, tb, tt } = this;
        let col = `${ta}.${prop !== null && prop !== void 0 ? prop : 'id'} `;
        let joinBud = `JOIN ${this.db}.bud as ${tb} ON ${tb}.id = ${ta}.id AND ${tb}.ext = ${bizEntity.id} `;
        let sql;
        if (isParent === true) {
            sql = `${col} 
                FROM \`${this.db}\`.detail as ${tt}
                    JOIN \`${this.db}\`.bin as ${ta} ON ${ta}.id=${tt}.base
                    ${joinBud} 
                WHERE ${tt}.id=`;
        }
        else {
            sql = `${col} 
                FROM \`${this.db}\`.detail as ${ta} ${joinBud} 
                WHERE ${ta}.id=`;
        }
        sb.append(sql);
        sb.exp(this.params[0]);
    }
    binBud(sb) {
        const { budProp, isParent } = this.bizExp;
        const { ta, tt } = this;
        let tbl;
        switch (budProp.dataType) {
            default:
                tbl = il_1.EnumSysTable.ixBudInt;
                break;
            case BizPhraseType_1.BudDataType.char:
            case BizPhraseType_1.BudDataType.str:
                tbl = il_1.EnumSysTable.ixBudStr;
                break;
            case BizPhraseType_1.BudDataType.dec:
                tbl = il_1.EnumSysTable.ixBudDec;
                break;
            case BizPhraseType_1.BudDataType.fork:
                tbl = il_1.EnumSysTable.ixBudJson;
                break;
        }
        sb.append(`${tt}.value FROM \`${this.db}\`.${tbl} as ${tt}
            WHERE ${tt}.x=${budProp.id} AND ${tt}.i=`);
        if (isParent === true) {
            sb.l();
            sb.append(`SELECT ${ta}.base FROM \`${this.db}\`.detail as ${ta} WHERE `);
            sb.append(ta).dot().append('id=');
            sb.exp(this.params[0]);
            sb.r();
        }
        else {
            sb.exp(this.params[0]);
        }
    }
    tie(sb) {
        const { bizEntity } = this.bizExp;
        const { ta, tb } = this;
        sb.append(`${ta}.x
        FROM ${this.db}.ixbud as ${ta} JOIN ${this.db}.bud as ${tb} ON ${tb}.id=${ta}.i AND ${tb}.base=${bizEntity.id} 
            WHERE ${tb}.ext=`)
            .exp(this.params[0]);
    }
    duo(sb) {
        const { isReadonly, prop } = this.bizExp;
        const { ta } = this;
        let param = this.params[0];
        let param2 = this.params[1];
        if (param2 !== undefined) {
            let w = isReadonly === true ? 0 : 1;
            sb.dbName().dot().name('duo$id').append(`(_$site,_$user,${w},null,`).exp(param).comma().exp(param2).r();
        }
        else {
            sb.append(`${ta}.${prop} FROM ${this.db}.duo as ${ta} WHERE ${ta}.id=`)
                .exp(param);
        }
    }
    combo(sb) {
        const { bizEntity, isReadonly, prop } = this.bizExp;
        const { ta } = this;
        const { site } = sb.factory.dbContext;
        const db = `${consts_1.$site}.${site}`;
        const siteEntityId = bizEntity.id;
        if (prop !== undefined) {
            sb.append(`${ta}.${prop} FROM `)
                .name(db).dot()
                .name(String(siteEntityId))
                .append(` as ${ta} WHERE ${ta}.id=`)
                .exp(this.params[0]);
        }
        else {
            let w = isReadonly === true ? 0 : 1;
            sb.name(db).dot();
            sb.fld(siteEntityId + '.ID');
            sb.l().append(w);
            for (let p of this.params) {
                sb.comma().exp(p);
            }
            sb.r();
        }
    }
    book(sb) {
        const { prop, in: inVar, param, combo } = this.bizExp;
        if (combo !== undefined) {
            this.bookCombo(sb);
            return;
        }
        const { paramType } = param;
        if (inVar === undefined || prop === 'value') {
            let titleValue;
            switch (paramType) {
                case il_1.BizExpParamType.scalar:
                    titleValue = new TitleValue(sb, this);
                    break;
                case il_1.BizExpParamType.spec:
                    titleValue = new TitleSpecSum(sb, this);
                    break;
                case il_1.BizExpParamType.ix:
                    titleValue = new TitleIxSum(sb, this);
                    break;
            }
            titleValue.sql();
        }
        else {
            let titleHistory;
            switch (paramType) {
                case il_1.BizExpParamType.scalar:
                    titleHistory = new TitleHistory(sb, this);
                    break;
                case il_1.BizExpParamType.spec:
                    titleHistory = new TitleSpecHistory(sb, this);
                    break;
                case il_1.BizExpParamType.ix:
                    titleHistory = new TitleIxHistory(sb, this);
                    break;
            }
            titleHistory.sql();
        }
    }
    bookCombo(sb) {
        const { budEntitySub, combo, comboParams } = this.bizExp;
        const { dbContext } = sb.factory;
        sb.append('SUM(bcb.value) FROM ')
            .name(`${consts_1.$site}.${dbContext.site}`).dot().name(`${combo.id}`).append(' AS bca JOIN ')
            .dbName().dot().name(il_1.EnumSysTable.ixBudDec)
            .append(` AS bcb ON bcb.x=${budEntitySub.id} AND bcb.i=bca.id WHERE 1=1`);
        const { length } = comboParams;
        const { keys } = combo;
        for (let i = 0; i < length; i++) {
            let cp = comboParams[i];
            if (cp === undefined)
                continue;
            let ck = keys[i];
            sb.append(' AND bca.').name(String(ck.id)).append('=').exp(dbContext.expVal(cp));
        }
    }
}
exports.BBizExp = BBizExp;
class TitleExpBase {
    constructor(sb, bBizExp) {
        this.sb = sb;
        this.bBizExp = bBizExp;
    }
}
class TitleValueBase extends TitleExpBase {
    ixBudTbl() {
        const { budEntitySub: bud } = this.bBizExp.bizExp;
        let ixBudTbl;
        switch (bud.dataType) {
            default:
                ixBudTbl = il_1.EnumSysTable.ixBudInt;
                break;
            case BizPhraseType_1.BudDataType.dec:
                ixBudTbl = il_1.EnumSysTable.ixBudDec;
                break;
        }
        return ixBudTbl;
    }
}
class TitleValue extends TitleValueBase {
    sql() {
        const { bizExp, ta, db, params: [param] } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        let tblBudValue = this.ixBudTbl();
        this.sb.append(`${ta}.value FROM ${db}.${tblBudValue} as ${ta} WHERE ${ta}.i=`);
        this.sb.exp(param);
        this.sb.append(` AND ${ta}.x=${bud.id}`);
    }
}
class TitleSum extends TitleValueBase {
    sql() {
        const { bizExp, ta, tt, db, inVal, params: [param] } = this.bBizExp;
        const { budEntitySub: bud, prop, in: ilInVar } = bizExp;
        const { sb } = this;
        sb.append(`sum(${ta}.value) `);
        this.from();
        sb.exp(param);
        sb.append(` AND ${ta}.x=${bud.id}`);
    }
}
class TitleSpecSum extends TitleSum {
    from() {
        const { ta, tt, db } = this.bBizExp;
        //this.titleValueSum(sb, 'spec', 'id', 'base');
        let tblBudValue = this.ixBudTbl();
        this.sb.append(`
        FROM ${db}.spec as ${tt}
        JOIN ${db}.${tblBudValue} as ${ta} ON ${ta}.i=${tt}.id
    WHERE ${tt}.base=`);
    }
}
class TitleIxSum extends TitleSum {
    from() {
        const { ta, tt, db } = this.bBizExp;
        // this.titleValueSum(sb, 'ixbud', 'x', 'i');
        let tblBudValue = this.ixBudTbl();
        this.sb.append(`
        FROM ${db}.ixbud as ${tt}
        JOIN ${db}.${tblBudValue} as ${ta} ON ${ta}.i=${tt}.x
    WHERE ${tt}.i=`);
    }
}
class TitleHistoryBase extends TitleExpBase {
    sql() {
        const { bizExp, ta, db, inVal } = this.bBizExp;
        const { budEntitySub: bud, prop, in: ilInVar } = bizExp;
        const { varTimeSpan: timeSpan, op, statementNo } = ilInVar;
        this.sb.append(`${prop}(${ta}.value) FROM ${db}.history as ${ta} `);
        this.from();
        this.sb.append(`${ta}.id>=_${timeSpan}_${statementNo}$start`);
        if (op !== undefined) {
            this.sb.append(op).exp(inVal);
        }
        this.sb.append(` AND ${ta}.id<_${timeSpan}_${statementNo}$end`);
        if (op !== undefined) {
            this.sb.append(op).exp(inVal);
        }
    }
}
class TitleHistory extends TitleHistoryBase {
    from() {
        const { bizExp, ta, db, params: [param] } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`
WHERE ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, `).exp(param);
        this.sb.append(`,${bud.id}) AND `);
    }
}
class TitleSpecHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, params: [param] } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`JOIN ${db}.spec as ${tt} ON ${tt}.base=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.id, ${bud.id}) WHERE `);
    }
}
class TitleIxHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, params: [param] } = this.bBizExp;
        const { budEntitySub: bud } = bizExp;
        this.sb.append(`JOIN ${db}.ixbud as ${tt} ON ${tt}.i=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.x, ${bud.id}) WHERE `);
    }
}
class BBizFieldOperand extends exp_1.ExpVal {
    constructor(bBizField) {
        super();
        this.bBizField = bBizField;
    }
    to(sb) {
        if (this.bBizField === undefined) {
            return;
        }
        this.bBizField.to(sb);
    }
}
exports.BBizFieldOperand = BBizFieldOperand;
class BBizCheckBud extends exp_1.ExpVal {
    constructor(expOptionId, bExp1, bExp2, bizField, items) {
        super();
        this.expOptionId = expOptionId;
        this.bExp1 = bExp1;
        this.bExp2 = bExp2;
        this.bizField = bizField;
        this.items = items;
    }
    to(sb) {
        let t = '$check';
        if (this.expOptionId !== undefined) {
            sb.exp(this.expOptionId);
            this.buildIn(sb);
        }
        else {
            sb.append('EXISTS(SELECT ').append(t).dot().append('value FROM ');
            if (this.bExp1 !== undefined) {
                sb.l();
                this.bExp1.to(sb);
                sb.r();
            }
            else {
                this.buildValExp(sb);
            }
            sb.append(' AS ').append(t)
                .append(' WHERE ').append(t).dot().alias('value ');
            this.buildIn(sb);
            sb.r();
        }
    }
    buildIn(sb) {
        sb.append(' IN (');
        if (this.items !== undefined) {
            sb.append(this.items.map(v => v.id).join(','));
        }
        else {
            this.bExp2.to(sb);
        }
        sb.r();
    }
    buildValExp(sb) {
        // sb.append('JSON_TABLE(');
        this.bizField.to(sb);
        // sb.append(`,'$[*]' COLUMNS(id INT PATH '$')`);
    }
}
exports.BBizCheckBud = BBizCheckBud;
/*
mysql：
SELECT EXISTS(
    SELECT a.c
        FROM (SELECT c
        FROM
            JSON_TABLE('[1, 2]', '$[*]' COLUMNS(c INT PATH '$')) as jt
        ) AS a
        WHERE a.c IN (SELECT c
        FROM
            JSON_TABLE('[1, 2, 3, 4]', '$[*]' COLUMNS(c INT PATH '$')) as jt)
    ) AS b;

bzscript 源码
    CHECK (#zz(%id).dd) ON (#bb(%id).ee)
    CHECK (#zz(%id).dd) = OPTIONS.a)
    CHECK %field = OPTIONS.a
    -- CHECK %field in (OPTIONS.a, OPTIONS.b) 未实现
*/
//# sourceMappingURL=BizExp.js.map
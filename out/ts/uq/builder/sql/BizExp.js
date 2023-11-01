"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFieldOperand = exports.BBizExp = void 0;
const il_1 = require("../../il");
const exp_1 = require("./exp");
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
        sb.append('SELECT ');
        const { bizPhraseType } = this.bizExp.bizEntity;
        switch (bizPhraseType) {
            default:
                debugger;
                throw new Error(`not implemented bizPhraseType ${this.bizExp.bizEntity}`);
            case il_1.BizPhraseType.atom:
                this.atom(sb);
                break;
            case il_1.BizPhraseType.spec:
                this.spec(sb);
                break;
            case il_1.BizPhraseType.bin:
                this.bin(sb);
                break;
            case il_1.BizPhraseType.title:
                this.title(sb);
                break;
        }
        sb.r();
    }
    convertFrom(context, bizExp) {
        this.db = context.dbName;
        this.bizExp = bizExp;
        const { param } = bizExp.param;
        this.param = context.expVal(param);
        const { in: inVar } = bizExp;
        if (inVar !== undefined) {
            const { val: inVal, spanPeiod } = inVar;
            this.inVal = new exp_1.ExpInterval(spanPeiod, context.expVal(inVal));
        }
    }
    atom(sb) {
        const { bizEntity, prop } = this.bizExp;
        let bud = bizEntity.props.get(prop);
        sb.append(' FROM atom WHERE id=');
        sb.exp(this.param);
        sb.append(' AND base=');
        sb.append(bizEntity.id);
    }
    spec(sb) {
    }
    bin(sb) {
        const { bizEntity, prop } = this.bizExp;
        const { ta, tb } = this;
        sb.append(`${ta}.${prop !== null && prop !== void 0 ? prop : 'id'}
        FROM ${this.db}.bin as ${ta} JOIN ${this.db}.bud as ${tb} ON ${tb}.id=${ta}.id AND ${tb}.ext=${bizEntity.id} 
            WHERE ${ta}.id=`)
            .exp(this.param);
    }
    title(sb) {
        const { prop, in: inVar, param: { paramType } } = this.bizExp;
        if (inVar === undefined || prop === 'value') {
            switch (paramType) {
                case il_1.BizExpParamType.scalar:
                    this.titleValue(sb);
                    break;
                case il_1.BizExpParamType.spec:
                    this.titleSpecSum(sb);
                    break;
                case il_1.BizExpParamType.ix:
                    this.titleIxSum(sb);
                    break;
            }
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
    ixBudTbl() {
        const { bud } = this.bizExp;
        let ixBudTbl;
        switch (bud.dataType) {
            default:
                ixBudTbl = 'ixbudint';
                break;
            case il_1.BudDataType.dec:
                ixBudTbl = 'ixbuddec';
                break;
        }
        return ixBudTbl;
    }
    titleValue(sb) {
        const { bud } = this.bizExp;
        let tblBudValue = this.ixBudTbl();
        const { ta } = this;
        sb.append(`${ta}.value FROM ${this.db}.${tblBudValue} as ${ta} WHERE ${ta}.i=`);
        sb.exp(this.param);
        sb.append(` AND ${ta}.x=${bud.id}`);
    }
    titleValueSum(sb, ttTbl, ttField, ttOut) {
        const { bud } = this.bizExp;
        let tblBudValue = this.ixBudTbl();
        const { ta, tt } = this;
        sb.append(`sum(${ta}.value) 
FROM ${this.db}.${ttTbl} as ${tt}
    JOIN ${this.db}.${tblBudValue} as ${ta} ON ${ta}.i=${tt}.${ttField}
WHERE ${tt}.${ttOut}=`);
        sb.exp(this.param);
        sb.append(` AND ${ta}.x=${bud.id}`);
    }
    titleSpecSum(sb) {
        this.titleValueSum(sb, 'spec', 'id', 'base');
    }
    titleIxSum(sb) {
        this.titleValueSum(sb, 'ixbud', 'x', 'i');
    }
}
exports.BBizExp = BBizExp;
class TitleHistoryBase {
    constructor(sb, bBizExp) {
        this.sb = sb;
        this.bBizExp = bBizExp;
    }
    sql() {
        const { bizExp, ta, db, inVal } = this.bBizExp;
        const { bud, prop, in: ilInVar } = bizExp;
        const { varTimeSpan: timeSpan, op, statementNo } = ilInVar;
        this.sb.append(`${prop}(${ta}.value) FROM ${db}.history as ${ta} `);
        this.from();
        //        this.sb.append(`
        // WHERE ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, `);
        //this.budIdP1();
        //this.sb.append(`,${bud.id})
        //AND 
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
        const { bizExp, ta, db, param } = this.bBizExp;
        const { bud } = bizExp;
        this.sb.append(`
WHERE ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, `).exp(param);
        this.sb.append(`,${bud.id}) AND `);
    }
}
class TitleSpecHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, param } = this.bBizExp;
        const { bud } = bizExp;
        this.sb.append(`JOIN ${db}.spec as ${tt} ON ${tt}.base=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.id, ${bud.id}) WHERE `);
    }
}
class TitleIxHistory extends TitleHistoryBase {
    from() {
        const { ta, tt, db, bizExp, param } = this.bBizExp;
        const { bud } = bizExp;
        this.sb.append(`JOIN ${db}.ixbud as ${tt} ON ${tt}.i=`).exp(param)
            .append(` AND ${ta}.bud=${db}.bud$id(_$site,_$user, 0, null, ${tt}.x, ${bud.id}) WHERE `);
    }
}
class BBizFieldOperand extends exp_1.ExpVal {
    constructor(bizField) {
        super();
        this.bizField = bizField;
    }
    to(sb) {
        const { bizBud, fieldName } = this.bizField;
        if (fieldName) {
            sb.append('t1.').append(fieldName);
        }
        else {
            function buildSelectValue(tbl) {
                sb.l().append('select value from ').dbName().dot().append(tbl)
                    .append(' where i=t1.id and x=').append(bizBud.id)
                    .r();
            }
            function buildSelectMulti() {
                sb.l().append('select JSON_ARRAYAGG(x1.ext) from ')
                    .dbName().dot().append(il_1.EnumSysTable.ixBud).append(' AS x0 JOIN ')
                    .dbName().dot().append(il_1.EnumSysTable.bud).append(' AS x1 ON x1.id=x0.x ')
                    .append(' where x0.i=t1.id AND x1.base=').append(bizBud.id)
                    .r();
            }
            switch (bizBud.dataType) {
                default:
                    buildSelectValue(il_1.EnumSysTable.ixBudInt);
                    return;
                case il_1.BudDataType.str:
                case il_1.BudDataType.char:
                    buildSelectValue(il_1.EnumSysTable.ixBudStr);
                    return;
                case il_1.BudDataType.dec:
                    buildSelectValue(il_1.EnumSysTable.ixBudDec);
                    return;
                case il_1.BudDataType.radio:
                case il_1.BudDataType.check:
                    buildSelectMulti();
                    return;
            }
        }
    }
}
exports.BBizFieldOperand = BBizFieldOperand;
//# sourceMappingURL=BizExp.js.map
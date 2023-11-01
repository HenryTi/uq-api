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
        const { bud } = this.bBizExp.bizExp;
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
}
class TitleValue extends TitleValueBase {
    sql() {
        const { bizExp, ta, db, param } = this.bBizExp;
        const { bud } = bizExp;
        let tblBudValue = this.ixBudTbl();
        this.sb.append(`${ta}.value FROM ${db}.${tblBudValue} as ${ta} WHERE ${ta}.i=`);
        this.sb.exp(param);
        this.sb.append(` AND ${ta}.x=${bud.id}`);
    }
}
class TitleSum extends TitleValueBase {
    sql() {
        const { bizExp, ta, tt, db, inVal, param } = this.bBizExp;
        const { bud, prop, in: ilInVar } = bizExp;
        const { sb } = this;
        sb.append(`sum(${ta}.value) `);
        this.from();
        sb.exp(param);
        sb.append(` AND ${ta}.x=${bud.id}`);
    }
}
class TitleSpecSum extends TitleSum {
    from() {
        const { bizExp, ta, tt, db, inVal, param } = this.bBizExp;
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
        const { bizExp, ta, tt, db, inVal, param } = this.bBizExp;
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
        const { bud, prop, in: ilInVar } = bizExp;
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
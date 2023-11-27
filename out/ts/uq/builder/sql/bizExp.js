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
            case il_1.BizPhraseType.tie:
                this.tie(sb);
                break;
            case il_1.BizPhraseType.duo:
                this.duo(sb);
                break;
        }
        sb.r();
    }
    convertFrom(context, bizExp) {
        this.db = context.dbName;
        this.bizExp = bizExp;
        const { param, param2 } = bizExp.param;
        this.param = context.expVal(param);
        this.param2 = context.expVal(param2);
        const { in: inVar } = bizExp;
        if (inVar !== undefined) {
            const { val: inVal, spanPeiod } = inVar;
            this.inVal = new exp_1.ExpInterval(spanPeiod, context.expVal(inVal));
        }
    }
    atom(sb) {
        const { bizEntity, prop } = this.bizExp;
        let bud = bizEntity.props.get(prop);
        if (bud === undefined) {
            sb.append(prop);
        }
        else {
            debugger;
        }
        sb.append(' FROM ').dbName().append('.`atom` WHERE id=');
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
    tie(sb) {
        const { bizEntity } = this.bizExp;
        const { ta, tb } = this;
        sb.append(`${ta}.x
        FROM ${this.db}.ixbud as ${ta} JOIN ${this.db}.bud as ${tb} ON ${tb}.id=${ta}.i AND ${tb}.base=${bizEntity.id} 
            WHERE ${tb}.ext=`)
            .exp(this.param);
    }
    duo(sb) {
        const { bizEntity, prop } = this.bizExp;
        const { ta } = this;
        if (this.param2 !== undefined) {
            sb.append(`${this.db}.duo$id(_$site,_$user,1,null,`).exp(this.param).comma().exp(this.param2).r();
        }
        else {
            sb.append(`${ta}.${prop} FROM ${this.db}.duo as ${ta} WHERE ${ta}.id=`)
                .exp(this.param);
        }
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
    constructor(bBizField) {
        super();
        this.bBizField = bBizField;
    }
    to(sb) {
        this.bBizField.to(sb);
    }
}
exports.BBizFieldOperand = BBizFieldOperand;
//# sourceMappingURL=BizExp.js.map
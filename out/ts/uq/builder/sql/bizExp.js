"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizExp = void 0;
const il_1 = require("../../il");
const exp_1 = require("./exp");
let bizEpxTblNo = 0;
class BBizExp {
    constructor() {
        ++bizEpxTblNo;
        this.ta = '$a' + bizEpxTblNo;
        this.tb = '$b' + bizEpxTblNo;
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
        this.param = context.expVal(bizExp.param);
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
        const { bizEntity, bud, prop, in: inVar } = this.bizExp;
        const title = bizEntity;
        let tblBudValue;
        switch (bud.dataType) {
            default:
                tblBudValue = 'ixbudint';
                break;
            case il_1.BudDataType.dec:
                tblBudValue = 'ixbuddec';
                break;
        }
        const { ta } = this;
        if (inVar === undefined || prop === 'value') {
            sb.append(`${ta}.value FROM ${this.db}.${tblBudValue} as ${ta} WHERE ${ta}.i=`);
            sb.exp(this.param);
            sb.append(` AND ${ta}.x=${bud.id}`);
        }
        else {
            const { varTimeSpan: timeSpan, op, statementNo, spanPeiod } = inVar;
            sb.append(`${prop}(${ta}.value) FROM ${this.db}.history as ${ta} 
        WHERE ${ta}.bud=${this.db}.bud$id(_$site,_$user, 0, null, `).exp(this.param).append(`,${bud.id})
            AND ${ta}.id>=_${timeSpan}_${statementNo}$start`);
            if (op !== undefined) {
                sb.append(op).exp(this.inVal);
            }
            sb.append(` AND ${ta}.id<_${timeSpan}_${statementNo}$end`);
            if (op !== undefined) {
                sb.append(op).exp(this.inVal);
            }
        }
    }
}
exports.BBizExp = BBizExp;
//# sourceMappingURL=bizExp.js.map
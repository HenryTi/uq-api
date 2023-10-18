"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizExp = void 0;
const il_1 = require("../../il");
class BBizExp {
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
        this.bizExp = bizExp;
        this.param = context.expVal(bizExp.param);
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
        sb.append('a.');
        sb.append(prop !== null && prop !== void 0 ? prop : 'id');
        sb.append(' FROM bin as a JOIN bud as b ON b.id=a.id AND b.ext=');
        sb.append(bizEntity.id);
        sb.append(' WHERE a.id=');
        sb.exp(this.param);
    }
    title(sb) {
        sb.append(1);
    }
}
exports.BBizExp = BBizExp;
//# sourceMappingURL=bizExp.js.map
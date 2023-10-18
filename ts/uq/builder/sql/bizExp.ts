import { BizExp, BizPhraseType } from "../../il";
import { DbContext } from "../dbContext";
import { ExpVal } from "./exp";
import { SqlBuilder } from "./sqlBuilder";

export class BBizExp {
    db: string;
    bizExp: BizExp;
    param: ExpVal;
    to(sb: SqlBuilder): void {
        sb.l();
        sb.append('SELECT ');
        const { bizPhraseType } = this.bizExp.bizEntity;
        switch (bizPhraseType) {
            default: debugger; throw new Error(`not implemented bizPhraseType ${this.bizExp.bizEntity}`);
            case BizPhraseType.atom: this.atom(sb); break;
            case BizPhraseType.spec: this.spec(sb); break;
            case BizPhraseType.bin: this.bin(sb); break;
            case BizPhraseType.title: this.title(sb); break;
        }
        sb.r();
    }
    convertFrom(context: DbContext, bizExp: BizExp) {
        this.bizExp = bizExp;
        this.param = context.expVal(bizExp.param);
    }

    private atom(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        let bud = bizEntity.props.get(prop);
        sb.append(' FROM atom WHERE id=');
        sb.exp(this.param);
        sb.append(' AND base=');
        sb.append(bizEntity.id);
    }

    private spec(sb: SqlBuilder) {

    }

    private bin(sb: SqlBuilder) {
        const { bizEntity, prop } = this.bizExp;
        sb.append('a.');
        sb.append(prop ?? 'id');
        sb.append(' FROM bin as a JOIN bud as b ON b.id=a.id AND b.ext=');
        sb.append(bizEntity.id);
        sb.append(' WHERE a.id=');
        sb.exp(this.param);
    }

    private title(sb: SqlBuilder) {
        sb.append(1);
    }
}

import { BinInput, BinInputAtom, BinInputSpec, BizAtom, BizSpec, BizEntity, BizPhraseType, ValueExpression } from "../../../il";
import { Token } from "../../tokens";
import { BizEntitySpace } from "../Biz";
import { PBizBud } from "../Bud";

abstract class PBinInput<T extends BinInput> extends PBizBud<T> {
}

export class PBinInputSpec extends PBinInput<BinInputSpec> {
    private spec: string;

    protected override _parse(): void {
        this.spec = this.ts.passVar();
        this.ts.passKey('base');
        this.ts.passToken(Token.EQU);
        this.element.baseValue = new ValueExpression();
        const { baseValue } = this.element;
        this.context.parseElement(baseValue);
        this.ts.passToken(Token.SEMICOLON);
    }

    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        let ret = space.getBizEntity(this.spec);
        if (ret?.bizPhraseType !== BizPhraseType.spec) {
            this.log(`${this.spec} is not SPEC`);
            ok = false;
        }
        else {
            this.element.spec = ret as BizSpec;
            let { baseValue } = this.element;
            if (baseValue.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

export class PBinInputAtom extends PBinInput<BinInputAtom> {
    private atom: string;
    protected override _parse(): void {
        this.atom = this.ts.passVar();
        this.ts.passToken(Token.SEMICOLON);
    }

    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        let ret = space.getBizEntity(this.atom);
        if (ret?.bizPhraseType !== BizPhraseType.atom) {
            this.log(`${this.atom} is not ATOM`);
            ok = false;
        }
        this.element.atom = ret as BizAtom;
        return ok;
    }
}

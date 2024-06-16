import { BinInput, BinInputAtom, BinInputSpec, BizAtom, BizSpec, BizEntity, ValueExpression } from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
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
        let val = this.element.baseValue = new ValueExpression();
        this.context.parseElement(val);
        this.ts.passToken(Token.SEMICOLON);
    }

    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        let { bizEntityArr: [ret] } = space.getBizFromEntityArrFromName(this.spec);
        if (ret?.bizPhraseType !== BizPhraseType.fork) {
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
        let { bizEntityArr: [ret] } = space.getBizFromEntityArrFromName(this.atom);
        if (ret?.bizPhraseType !== BizPhraseType.atom) {
            this.log(`${this.atom} is not ATOM`);
            ok = false;
        }
        this.element.atom = ret as BizAtom;
        return ok;
    }
}

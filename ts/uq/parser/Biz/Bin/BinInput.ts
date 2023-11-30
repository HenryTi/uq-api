import { BinInput, BinInputAtom, BinInputSpec, BizEntity, ValueExpression } from "../../../il";
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
        return ok;
    }
}

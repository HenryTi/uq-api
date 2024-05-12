import { BinInput, BinInputAtom, BinInputSpec, BizAtom, BizSpec, BizEntity, BizPhraseType, ValueExpression } from "../../../il";
import { Token } from "../../tokens";
import { BizEntitySpace } from "../Biz";
import { PBizBud } from "../Bud";

abstract class PBinInput<T extends BinInput> extends PBizBud<T> {
}

export class PBinInputSpec extends PBinInput<BinInputSpec> {
    private spec: string;
    // private equBud: string;

    protected override _parse(): void {
        this.spec = this.ts.passVar();
        this.ts.passKey('base');
        /*
        if (this.ts.token === Token.EQU) {
            this.ts.passToken(Token.EQU);
            this.element.baseValue = new ValueExpression();
            const { baseValue } = this.element;
            this.context.parseElement(baseValue);
        }
        else {
        */
        this.ts.passToken(Token.EQU);
        let val = this.element.baseValue = new ValueExpression();
        this.context.parseElement(val);
        // this.ts.passKey('on');
        /*
        let v = this.ts.passVar();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.ts.passKey('base');
            switch (v) {
                default: this.ts.expect('I or X'); break;
                case 'i': this.equBud = '.i'; break;
                case 'x': this.equBud = '.x'; break;
            }
        }
        else {
            this.equBud = v;
        }
        */
        // }
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
            /*
            if (this.equBud !== undefined) {
                let bud = this.element.bin.getBud(this.equBud);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${this.equBud} not exists`);
                }
                else {
                    this.element.baseBud = bud;
                }
            }
            else {
            */
            let { baseValue } = this.element;
            if (baseValue.pelement.scan(space) === false) {
                ok = false;
            }
            // }
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

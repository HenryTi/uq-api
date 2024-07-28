import { BinInput, BinInputAtom, BinInputSpec, BizAtom, BizFork, BizEntity, ValueExpression } from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Token } from "../../tokens";
import { BizEntitySpace } from "../Biz";
import { PBizBud } from "../Bud";

abstract class PBinInput<T extends BinInput> extends PBizBud<T> {
}

export class PBinInputSpec extends PBinInput<BinInputSpec> {
    private spec: string;
    private readonly params: [string, ValueExpression][] = [];

    protected override _parse(): void {
        this.spec = this.ts.passVar();
        this.ts.passKey('base');
        this.ts.passToken(Token.EQU);
        let val = this.element.baseValue = new ValueExpression();
        this.context.parseElement(val);
        for (; ;) {
            if (this.ts.token !== Token.COMMA) break;
            this.ts.readToken();
            let p = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let pv = new ValueExpression();
            this.context.parseElement(pv);
            this.params.push([p, pv]);
        }
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
            let fork = this.element.fork = ret as BizFork;
            let { baseValue } = this.element;
            if (baseValue.pelement.scan(space) === false) {
                ok = false;
            }
            else {
                const { params } = this.element;
                for (let [name, v] of this.params) {
                    let bud = fork.getBud(name);
                    if (bud === undefined) {
                        ok = false;
                        this.log(`${name} is not a bud of ${fork.getJName()}`);
                        continue;
                    }
                    if (v.pelement.scan(space) === false) {
                        ok = false;
                    }
                    params.push([bud, v]);
                }
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

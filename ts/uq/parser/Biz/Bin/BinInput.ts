import { BinInput, BinInputAtom, BinInputFork, BizAtom, BizFork, BizEntity, ValueExpression, BudValueSetType, BizBud } from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Token } from "../../tokens";
import { BizEntitySpace } from "../Biz";
import { PBizBud } from "../Bud";

abstract class PBinInput<T extends BinInput> extends PBizBud<T> {
}

export class PBinInputFork extends PBinInput<BinInputFork> {
    private spec: string;
    private readonly params: [string, ValueExpression, BudValueSetType][] = [];

    protected override _parse(): void {
        if (this.ts.isKeywords('of') === false) {
            this.spec = this.ts.passVar();
        }
        this.ts.passKey('of');
        // this.ts.passToken(Token.EQU);
        let val = this.element.baseValue = new ValueExpression();
        this.context.parseElement(val);
        switch (this.ts.passKey()) {
            case 'param':
                let valueSetType: BudValueSetType = this.parseBudEqu();
                let valParam = new ValueExpression();
                this.context.parseElement(valParam);
                this.params.push([undefined, valParam, valueSetType]);
                break;
            case 'set':
                for (; ;) {
                    let p = this.ts.passVar();
                    let valueSetType: BudValueSetType = this.parseBudEqu();
                    let pv = new ValueExpression();
                    this.context.parseElement(pv);
                    this.params.push([p, pv, valueSetType]);
                    if (this.ts.token !== Token.COMMA) break;
                    this.ts.readToken();
                }
                break;
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        let { baseValue } = this.element;
        if (baseValue.pelement.scan(space) === false) {
            ok = false;
        }
        if (this.spec !== undefined) {
            let { bizEntityArr: [ret] } = space.getBizFromEntityArrFromName(this.spec);
            if (ret?.bizPhraseType !== BizPhraseType.fork) {
                this.log(`${this.spec} is not SPEC`);
                ok = false;
            }
            else {
                let fork = this.element.fork = ret as BizFork;
                const { params } = this.element;
                for (let [name, v, valueSetType] of this.params) {
                    let bud: BizBud;
                    if (name !== undefined) {
                        bud = fork.getBud(name);
                        if (bud === undefined) {
                            ok = false;
                            this.log(`${name} is not a bud of ${fork.getJName()}`);
                            continue;
                        }
                    }
                    if (v.pelement.scan(space) === false) {
                        ok = false;
                    }
                    params.push([bud, v, valueSetType]);
                }
            }
        }
        else {
            const { params } = this.element;
            switch (this.params.length) {
                default:
                    ok = false;
                    this.log(`Only param can set`);
                    break;
                case 0: break;
                case 1:
                    let [name, v, valueSetType] = this.params[0];
                    if (name !== undefined) {
                        ok = false;
                        this.log(`Only PARAM can set`);
                    }
                    else {
                        if (v.pelement.scan(space) === false) {
                            ok = false;
                        }
                        params.push([undefined, v, valueSetType]);
                    }
                    break;
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

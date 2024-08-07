import {
    BinPick, PickBase, PickAtom
    , BizAtom, PickSpec, BizFork, PickPend, PickQuery, BizQueryTable,
    BudValueSetType,
    ValueExpression,
    PickParam,
    BizEntity,
    Uq
} from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { BizPend } from "../../../il/Biz/Pend";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { BizEntitySpace } from "../Biz";
import { PBizBud, PBizBudValue } from "../Bud";

export class PBinPick extends PBizBud<BinPick> {
    private from: string[] = [];
    private on: string;
    private hides: string[];
    protected _parse(): void {
        this.ts.passKey('from');
        for (; ;) {
            this.from.push(this.ts.passVar());
            if (this.ts.token !== Token.BITWISEOR) break;
            this.ts.readToken();
        }
        if (this.ts.token === Token.LBRACE as any) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('param') === true) {
                    this.ts.readToken();
                    let name = this.ts.passVar();
                    let ui = this.parseUI();
                    let pickParam = new PickParam(this.element.bin, name, ui);
                    this.context.parseElement(pickParam);
                    let { params } = this.element;
                    if (params === undefined) {
                        params = this.element.params = [];
                    }
                    params.push(pickParam);
                }
                else if (this.ts.isKeyword('hide') === true) {
                    this.hides = [];
                    this.ts.readToken();
                    if (this.ts.token === Token.LPARENTHESE) {
                        this.ts.readToken();
                        for (; ;) {
                            this.hides.push(this.ts.passVar());
                            if (this.ts.token === Token.COMMA as any) {
                                this.ts.readToken();
                                continue;
                            }
                            if (this.ts.token === Token.RPARENTHESE as any) {
                                this.ts.readToken();
                                break;
                            }
                            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                        }
                    }
                    else if (this.ts.token === Token.VAR) {
                        this.hides.push(this.ts.lowerVar);
                        this.ts.readToken();
                    }
                }
                else {
                    this.ts.expect('param');
                }
                this.ts.passToken(Token.SEMICOLON);
            }
        }
        if (this.ts.isKeyword('single') === true) {
            this.element.single = true;
            this.ts.readToken();
        }
        if (this.ts.prevToken !== Token.RBRACE) {
            this.ts.passToken(Token.SEMICOLON);
        }
        else {
            if (this.ts.isKeyword('on') === true) {
                this.ts.readToken();
                this.on = this.ts.passVar();
            }
            this.ts.mayPassToken(Token.SEMICOLON);
        }
    }

    scan0(space: Space): boolean {
        if (this.element.pick !== undefined) return true;
        let ok = true;
        const { biz } = space.uq;
        const { entityArr, logs, ok: retOk, bizPhraseType, }
            = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else {
            let pickBase: PickBase;
            let multipleEntity = false;
            const bizEntity0 = entityArr[0];
            switch (bizPhraseType) {
                default:
                    this.log(`Can only pick from ATOM, SPEC, Pend, or Query`);
                    ok = false;
                    break;
                case BizPhraseType.atom:
                    pickBase = new PickAtom(entityArr as BizAtom[]);
                    multipleEntity = true;
                    break;
                case BizPhraseType.fork:
                    pickBase = new PickSpec(bizEntity0 as BizFork);
                    break;
                case BizPhraseType.pend:
                    pickBase = new PickPend(bizEntity0 as BizPend);
                    break;
                case BizPhraseType.query:
                    pickBase = new PickQuery(bizEntity0 as BizQueryTable);
                    break;
            }
            this.element.pick = pickBase;
            if (multipleEntity === false && entityArr.length > 1) {
                this.log('from only one object');
                ok = false;
            }
        }
        if (this.on !== undefined) {
            let on = this.element.bin.getBud(this.on);
            if (on === undefined) {
                ok = false;
                this.log(`${this.on} is not a PROP`);
            }
            else {
                this.element.on = on;
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { biz } = space.uq;
        const { logs, ok: retOk } = biz.sameTypeEntityArr(this.from);
        if (retOk === false) {
            this.log(...logs);
            ok = false;
            return ok;
        }
        let { params, bin, pick: pickBase } = this.element;
        if (params !== undefined) {
            for (let p of params) {
                const { name/*, bud, prop*/ } = p;
                if (pickBase.hasParam(name) === false) {
                    this.log(`PARAM ${name} is not defined`);
                    ok = false;
                }
                if (p.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        if (this.hides !== undefined) {
            this.element.hiddenBuds = [];
            const { hiddenBuds } = this.element;
            const { pick } = this.element;
            for (let h of this.hides) {
                let bud = pick.getBud(h);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${h} not exists`);
                }
                hiddenBuds.push(bud);
            }
        }
        return ok;
    }

    override scan2(uq: Uq): boolean {
        let ok = super.scan2(uq);
        const { on } = this.element;
        if (on !== undefined) {
            if (on.value === undefined) {
                on.value = {
                    exp: undefined, // new ValueExpression(),
                    str: [this.element.name, BudValueSetType.equ],
                    setType: BudValueSetType.equ,
                };
            }
        }
        return ok;
    }
}

export class PPickParam extends PBizBudValue<PickParam> {
    protected override _parse(): void {
        let setType = this.parseBudEqu();
        if (setType === BudValueSetType.show) {
            this.ts.error(': is not valid here');
        }
        if (setType === undefined) return;
        this.ts.readToken();
        let exp = new ValueExpression();
        this.context.parseElement(exp);
        this.element.value = {
            setType,
            exp,
        };
    }

    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

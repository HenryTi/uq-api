import {
    BinPick, PickBase, PickAtom
    , BizAtom, PickFork, BizFork, PickPend, PickQuery, BizQueryTable,
    BudValueSetType,
    ValueExpression,
    PickParam,
    BizEntity,
    Uq,
    PickOptions,
    BizOptions
} from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { BizPend } from "../../../il/Biz/Pend";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { BizEntitySpace } from "../Biz";
import { PBizBud, PBizBudValue } from "../Bud";

export class PBinPick extends PBizBud<BinPick> {
    private from: string[];
    to: [string, string][];
    private hides: string[];
    protected _parse(): void {
        if (this.parseFrom() === false) {
            if (this.ts.prevLowerVar === 'to') {
                this.to = [[this.ts.passVar(), undefined]];
                this.element.name = undefined;
                this.ts.mayPassToken(Token.SEMICOLON);
                return;
            }
        }

        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            this.to = [];
            for (; ;) {
                let to = this.ts.passVar();
                let val: string;
                if (this.ts.token === Token.EQU) {
                    this.ts.readToken();
                    val = this.ts.passVar();
                }
                this.to.push([to, val]);
                if (this.ts.token !== Token.COMMA) break;
                this.ts.readToken();
            }
        }
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    private parseFrom(): boolean {
        if (this.ts.prevLowerVar === 'from') {
            this.element.name = undefined;
        }
        else if (this.ts.isKeyword('from') === true) {
            this.ts.readToken();
        }
        else {
            return false;
        }
        this.from = [];
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
    }

    scan0(space: Space): boolean {
        if (this.element.pick !== undefined) return true;
        let ok = true;
        const { biz } = space.uq;
        if (this.from !== undefined) {
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
                        this.log(`Can only pick from ATOM, FORK, Options, Pend, or Query`);
                        ok = false;
                        break;
                    case BizPhraseType.atom:
                        pickBase = new PickAtom(entityArr as BizAtom[]);
                        multipleEntity = true;
                        break;
                    case BizPhraseType.fork:
                        pickBase = new PickFork(bizEntity0 as BizFork);
                        break;
                    case BizPhraseType.pend:
                        pickBase = new PickPend(bizEntity0 as BizPend);
                        break;
                    case BizPhraseType.query:
                        pickBase = new PickQuery(bizEntity0 as BizQueryTable);
                        break;
                    case BizPhraseType.options:
                        pickBase = new PickOptions(bizEntity0 as BizOptions);
                        break;
                }
                this.element.pick = pickBase;
                if (multipleEntity === false && entityArr.length > 1) {
                    this.log('from only one object');
                    ok = false;
                }
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.from !== undefined) {
            const { biz } = space.uq;
            const { logs, ok: retOk } = biz.sameTypeEntityArr(this.from);
            if (retOk === false) {
                this.log(...logs);
                ok = false;
                return ok;
            }
            let { params, pick: pickBase } = this.element;
            if (pickBase !== undefined) {
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
            }
        }
        return ok;
    }

    override scan2(uq: Uq): boolean {
        let ok = super.scan2(uq);
        if (this.scanPickTo() === false) ok = false;
        return ok;
    }

    private scanPickTo(): boolean {
        if (this.to === undefined) return true;
        const { pick } = this.element;
        if (pick === undefined) {
            if (this.to.length > 1) {
                this.log('not support multiple to');
                return false;
            }
            const [budName, val] = this.to[0];
            if (val !== undefined) {
                this.log('not support to = ');
                return false;
            }
            let bud = this.element.bin.getBud(budName);
            if (bud === undefined) {
                this.log(`${budName} is not defined`);
                return false;
            }
            return true;
        }
        let scanPickTo: ScanPickTo<any>;
        switch (pick.bizPhraseType) {
            default: debugger; break;
            case BizPhraseType.atom:
                scanPickTo = new ScanPickAtomTo(this, pick as PickAtom);
                break;
            case BizPhraseType.query:
                scanPickTo = new ScanPickQueryTo(this, pick as PickQuery);
                break;
            case BizPhraseType.pend:
                scanPickTo = new ScanPickPendTo(this, pick as PickPend);
                break;
            case BizPhraseType.options:
                scanPickTo = new ScanPickOptionsTo(this, pick as PickOptions);
                break;
        }
        return scanPickTo.scan();
    }
}

abstract class ScanPickTo<P extends PickBase> {
    protected readonly pBinPick: PBinPick
    protected readonly pick: P;
    constructor(pBinPick: PBinPick, pick: P) {
        this.pBinPick = pBinPick;
        this.pick = pick;
    }
    scan(): boolean {
        let ok = true;
        const { to: pTos, element } = this.pBinPick;
        if (this.checkToLength(pTos) === false) ok = false;
        element.toArr = [];
        const { toArr, bin } = element;
        for (let [to, col] of pTos) {
            let toBud = bin.getBud(to);
            if (toBud === undefined) {
                this.pBinPick.log(`${to} is not defined`);
                ok = false;
            }
            else {
                if (toBud.value === undefined) {
                    toBud.value = {
                        exp: undefined,
                        str: [element.name, BudValueSetType.init],
                        setType: BudValueSetType.init,
                    }
                }
            }
            if (this.isValidCol(col) === false) ok = false;
            toArr.push([toBud, col]);
            return ok;
        }
    }

    protected checkToLength(pTos: [string, string][]): boolean {
        return true;
    }

    protected isValidCol(col: string) {
        return true;
    }
}
class ScanPickAtomTo extends ScanPickTo<PickAtom> {
}
class ScanPickQueryTo extends ScanPickTo<PickQuery> {
}
class ScanPickPendTo extends ScanPickTo<PickPend> {
}
class ScanPickOptionsTo extends ScanPickTo<PickOptions> {
}

export class PPickParam extends PBizBudValue<PickParam> {
    protected override _parse(): void {
        let setType = this.parseBudEqu();
        if (setType === BudValueSetType.show) {
            this.ts.error(': is not valid here');
        }
        if (setType === undefined) return;
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPickParam = exports.PBinPick = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const tokens_1 = require("../../tokens");
const Bud_1 = require("../Bud");
class PBinPick extends Bud_1.PBizBud {
    _parse() {
        if (this.parseFrom() === false) {
            if (this.ts.prevLowerVar === 'to') {
                this.to = [[this.ts.passVar(), undefined]];
                this.element.name = undefined;
                this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                return;
            }
        }
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            this.to = [];
            for (;;) {
                let to = this.ts.passVar();
                let val;
                if (this.ts.token === tokens_1.Token.EQU) {
                    this.ts.readToken();
                    val = this.ts.passVar();
                }
                this.to.push([to, val]);
                if (this.ts.token !== tokens_1.Token.COMMA)
                    break;
                this.ts.readToken();
            }
        }
        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
    }
    parseFrom() {
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
        for (;;) {
            this.from.push(this.ts.passVar());
            if (this.ts.token !== tokens_1.Token.BITWISEOR)
                break;
            this.ts.readToken();
        }
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('param') === true) {
                    this.ts.readToken();
                    let name = this.ts.passVar();
                    let ui = this.parseUI();
                    let pickParam = new il_1.PickParam(this.element.bin, name, ui);
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
                    if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                        this.ts.readToken();
                        for (;;) {
                            this.hides.push(this.ts.passVar());
                            if (this.ts.token === tokens_1.Token.COMMA) {
                                this.ts.readToken();
                                continue;
                            }
                            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                                this.ts.readToken();
                                break;
                            }
                            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                        }
                    }
                    else if (this.ts.token === tokens_1.Token.VAR) {
                        this.hides.push(this.ts.lowerVar);
                        this.ts.readToken();
                    }
                }
                else {
                    this.ts.expect('param');
                }
                this.ts.passToken(tokens_1.Token.SEMICOLON);
            }
        }
        if (this.ts.isKeyword('single') === true) {
            this.element.single = true;
            this.ts.readToken();
        }
    }
    scan0(space) {
        if (this.element.pick !== undefined)
            return true;
        let ok = true;
        const { biz } = space.uq;
        if (this.from !== undefined) {
            const { entityArr, logs, ok: retOk, bizPhraseType, } = biz.sameTypeEntityArr(this.from);
            if (retOk === false) {
                this.log(...logs);
                ok = false;
            }
            else {
                let pickBase;
                let multipleEntity = false;
                const bizEntity0 = entityArr[0];
                switch (bizPhraseType) {
                    default:
                        this.log(`Can only pick from ATOM, FORK, Options, Pend, or Query`);
                        ok = false;
                        break;
                    case BizPhraseType_1.BizPhraseType.atom:
                        pickBase = new il_1.PickAtom(entityArr);
                        multipleEntity = true;
                        break;
                    case BizPhraseType_1.BizPhraseType.fork:
                        pickBase = new il_1.PickFork(bizEntity0);
                        break;
                    case BizPhraseType_1.BizPhraseType.pend:
                        pickBase = new il_1.PickPend(bizEntity0);
                        break;
                    case BizPhraseType_1.BizPhraseType.query:
                        pickBase = new il_1.PickQuery(bizEntity0);
                        break;
                    case BizPhraseType_1.BizPhraseType.options:
                        pickBase = new il_1.PickOptions(bizEntity0);
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
    scan(space) {
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
                        const { name /*, bud, prop*/ } = p;
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
    scan2(uq) {
        let ok = super.scan2(uq);
        if (this.scanPickTo() === false)
            ok = false;
        return ok;
    }
    scanPickTo() {
        if (this.to === undefined)
            return true;
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
        let scanPickTo;
        switch (pick.bizPhraseType) {
            default:
                debugger;
                break;
            case BizPhraseType_1.BizPhraseType.atom:
                scanPickTo = new ScanPickAtomTo(this, pick);
                break;
            case BizPhraseType_1.BizPhraseType.query:
                scanPickTo = new ScanPickQueryTo(this, pick);
                break;
            case BizPhraseType_1.BizPhraseType.pend:
                scanPickTo = new ScanPickPendTo(this, pick);
                break;
            case BizPhraseType_1.BizPhraseType.options:
                scanPickTo = new ScanPickOptionsTo(this, pick);
                break;
        }
        return scanPickTo.scan();
    }
}
exports.PBinPick = PBinPick;
class ScanPickTo {
    constructor(pBinPick, pick) {
        this.pBinPick = pBinPick;
        this.pick = pick;
    }
    scan() {
        let ok = true;
        const { to: pTos, element } = this.pBinPick;
        if (this.checkToLength(pTos) === false)
            ok = false;
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
                        str: [element.name, il_1.BudValueSetType.init],
                        setType: il_1.BudValueSetType.init,
                    };
                }
            }
            if (this.isValidCol(col) === false)
                ok = false;
            toArr.push([toBud, col]);
            return ok;
        }
    }
    checkToLength(pTos) {
        return true;
    }
    isValidCol(col) {
        return true;
    }
}
class ScanPickAtomTo extends ScanPickTo {
}
class ScanPickQueryTo extends ScanPickTo {
}
class ScanPickPendTo extends ScanPickTo {
}
class ScanPickOptionsTo extends ScanPickTo {
}
class PPickParam extends Bud_1.PBizBudValue {
    _parse() {
        let setType = this.parseBudEqu();
        if (setType === il_1.BudValueSetType.show) {
            this.ts.error(': is not valid here');
        }
        if (setType === undefined)
            return;
        let exp = new il_1.ValueExpression();
        this.context.parseElement(exp);
        this.element.value = {
            setType,
            exp,
        };
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PPickParam = PPickParam;
//# sourceMappingURL=BinPick.js.map
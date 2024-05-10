"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPickParam = exports.PBinPick = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const Bud_1 = require("../Bud");
class PBinPick extends Bud_1.PBizBud {
    constructor() {
        super(...arguments);
        this.from = [];
    }
    _parse() {
        this.ts.passKey('from');
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
                    /*
                    let setType = this.parseBudEqu();
                    if (setType === BudValueSetType.show) {
                        this.ts.error(': is not valid here');
                    }
                    this.ts.readToken();
                    let exp = new ValueExpression();
                    this.context.parseElement(exp);
                    /*
                    this.ts.passToken(Token.EQU);
                    let bud: string;
                    if (this.ts.token === Token.MOD as any) {
                        this.ts.readToken();
                        bud = '%' + this.ts.passVar();
                    }
                    else {
                        bud = this.ts.passVar();
                    }
                    let prop: string;
                    if (this.ts.token === Token.DOT as any) {
                        this.ts.readToken();
                        prop = this.ts.passVar();
                    }
                    */
                    let { params } = this.element;
                    if (params === undefined) {
                        params = this.element.params = [];
                    }
                    params.push(pickParam
                    /*{
                        name,
                        valueSet: {
                            setType,
                            exp,
                        }
                        // bud,
                        // prop,
                    }
                    */
                    );
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
        if (this.ts.prevToken !== tokens_1.Token.RBRACE) {
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
        else {
            this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        }
    }
    scan0(space) {
        if (this.element.pick !== undefined)
            return true;
        let ok = true;
        const { biz } = space.uq;
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
                    this.log(`Can only pick from ATOM, SPEC, Pend, or Query`);
                    ok = false;
                    break;
                case il_1.BizPhraseType.atom:
                    pickBase = new il_1.PickAtom(entityArr);
                    multipleEntity = true;
                    break;
                case il_1.BizPhraseType.spec:
                    pickBase = new il_1.PickSpec(bizEntity0);
                    break;
                case il_1.BizPhraseType.pend:
                    pickBase = new il_1.PickPend(bizEntity0);
                    break;
                case il_1.BizPhraseType.query:
                    pickBase = new il_1.PickQuery(bizEntity0);
                    break;
            }
            this.element.pick = pickBase;
            if (multipleEntity === false && entityArr.length > 1) {
                this.log('from only one object');
                ok = false;
            }
        }
        return ok;
    }
    scan(space) {
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
                const { name /*, bud, prop*/ } = p;
                if (pickBase.hasParam(name) === false) {
                    this.log(`PARAM ${name} is not defined`);
                    ok = false;
                }
                if (p.pelement.scan(space) === false) {
                    ok = false;
                }
                /*
                if (exp.pelement.scan(space) === false) {
                    ok = false;
                }
                if (bud === '%sheet') {
                    const sheetProps = binFieldArr;
                    if (prop === undefined || sheetProps.includes(prop) === true) {
                    }
                    else {
                        let { main } = bin;
                        if (main === undefined) {
                            this.log(`%sheet. can be one of ${sheetProps.join(',')}`);
                            ok = false;
                        }
                        else if (main.props.has(prop) === false) {
                            this.log(`${prop} is not a prop of ${main.getJName()}`);
                            ok = false;
                        }
                    }
                }
                else if (bud === '%user') {
                    let sheet = this.element.bin.sheetArr[0];
                    if (sheet.checkUserDefault(prop) === false) {
                        this.log(`Sheet ${sheet.getJName()} has not user default ${prop}`);
                        ok = false;
                    }
                }
                else {
                    let pick = bin.pickColl[bud];
                    if (pick === undefined) {
                        this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${bud} is not defined`);
                        ok = false;
                    }
                    else {
                        let { pick: pickBase } = pick;
                        if (pickBase !== undefined && pickBase.hasReturn(prop) === false) {
                            this.log(`PARAM ${name} = ${bud}${prop === undefined ? '' : '.' + prop} ${prop} is not defined`);
                            ok = false;
                        }
                    }
                }
                */
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
}
exports.PBinPick = PBinPick;
class PPickParam extends Bud_1.PBizBudValue {
    _parse() {
        let setType = this.parseBudEqu();
        if (setType === il_1.BudValueSetType.show) {
            this.ts.error(': is not valid here');
        }
        if (setType === undefined)
            return;
        this.ts.readToken();
        let exp = new il_1.ValueExpression();
        this.context.parseElement(exp);
        this.element.value = {
            setType,
            exp,
        };
        /*
        this.ts.passToken(Token.EQU);
        let bud: string;
        if (this.ts.token === Token.MOD as any) {
            this.ts.readToken();
            bud = '%' + this.ts.passVar();
        }
        else {
            bud = this.ts.passVar();
        }
        let prop: string;
        if (this.ts.token === Token.DOT as any) {
            this.ts.readToken();
            prop = this.ts.passVar();
        }
        */
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
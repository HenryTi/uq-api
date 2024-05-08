"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBinPick = void 0;
const consts_1 = require("../../../consts");
const il_1 = require("../../../il");
const element_1 = require("../../element");
const tokens_1 = require("../../tokens");
class PBinPick extends element_1.PElement {
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
                    this.ts.passToken(tokens_1.Token.EQU);
                    let bud;
                    if (this.ts.token === tokens_1.Token.MOD) {
                        this.ts.readToken();
                        bud = '%' + this.ts.passVar();
                    }
                    else {
                        bud = this.ts.passVar();
                    }
                    let prop;
                    if (this.ts.token === tokens_1.Token.DOT) {
                        this.ts.readToken();
                        prop = this.ts.passVar();
                    }
                    let { params } = this.element;
                    if (params === undefined) {
                        params = this.element.params = [];
                    }
                    params.push({
                        name,
                        bud,
                        prop,
                    });
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
                const { name, bud, prop } = p;
                if (pickBase.hasParam(name) === false) {
                    this.log(`PARAM ${name} is not defined`);
                    ok = false;
                }
                if (bud === '%sheet') {
                    const sheetProps = consts_1.binFieldArr;
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
                    // ok = true;
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
//# sourceMappingURL=BinPick.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBudCheck = exports.PBizBudRadio = exports.PBizBudPickable = exports.PBizBudBin = exports.PBizBudID = exports.PBizBudIXBase = exports.PBizBudIDIO = exports.PBizBudDate = exports.PBizBudChar = exports.PBinValue = exports.PBizBudJSON = exports.PBizBudDec = exports.PBizBudInt = exports.PBizBudArr = exports.PBizBudAny = exports.PBizBudValue = exports.PBizBud = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizBud extends Base_1.PBizBase {
}
exports.PBizBud = PBizBud;
class PBizBudValue extends PBizBud {
    _parse() {
        this.parseBudEquValue();
    }
    parseBudEquValue() {
        let setType = this.parseBudEqu();
        if (setType === il_1.BudValueSetType.show) {
            this.ts.readToken();
            let varString = [];
            for (;;) {
                varString.push(this.ts.passVar());
                if (this.ts.token !== tokens_1.Token.DOT)
                    break;
                this.ts.readToken();
            }
            this.fieldString = varString;
            return;
        }
        if (setType !== undefined) {
            this.ts.readToken();
            let exp = new il_1.ValueExpression();
            this.context.parseElement(exp);
            this.element.value = {
                exp,
                setType,
            };
            return;
        }
    }
    scan(space) {
        let ok = true;
        let { value } = this.element;
        if (value !== undefined) {
            const { exp } = value;
            if (exp !== undefined) {
                if (exp.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
    getFieldShow(entity, ...parts) {
        let show = [];
        let len = parts.length;
        let name0 = parts[0];
        let bizBud0 = entity.getBud(name0);
        if (bizBud0 === undefined) {
            this.log(`${entity.getJName()} has not ${name0}`);
            return undefined;
        }
        else {
            switch (entity.bizPhraseType) {
                default:
                    this.log('show field can only be in Bin or Pend');
                    return undefined;
                case BizPhraseType_1.BizPhraseType.bin:
                case BizPhraseType_1.BizPhraseType.pend:
                    break;
            }
        }
        show.push(bizBud0);
        let p = bizBud0;
        for (let i = 1; i < len; i++) {
            let { dataType } = p;
            let bizBud = undefined;
            let prop = parts[i];
            switch (dataType) {
                default:
                    this.log(`${p.name} is neither ATOM nor SPEC`);
                    return undefined;
                case BizPhraseType_1.BudDataType.atom:
                    let { ID: atom } = p;
                    if (atom === undefined) {
                        this.log(`${p.name} does not define ATOM or SPEC`);
                        return undefined;
                    }
                    bizBud = atom.getBud(prop);
                    p = bizBud;
                    switch (atom.bizPhraseType) {
                        default:
                            this.log(`${p.name} is neither ATOM nor SPEC`);
                            return undefined;
                        case BizPhraseType_1.BizPhraseType.atom:
                            if (bizBud === undefined) {
                                this.log(`${atom.getJName()} has not ${prop}`);
                                return undefined;
                            }
                            show.push(bizBud);
                            break;
                        case BizPhraseType_1.BizPhraseType.fork:
                            if (bizBud !== undefined) {
                                //show.push(FieldShowItem.createSpecFieldShow(atom as BizSpec, bizBud));
                                show.push(bizBud);
                                break;
                            }
                            const { base } = atom;
                            bizBud = base.getBud(prop);
                            p = bizBud;
                            if (bizBud === undefined) {
                                this.log(`${base.getJName()} has not ${prop}`);
                                return undefined;
                            }
                            // show.push(FieldShowItem.createSpecAtomFieldShow(atom as BizSpec, bizBud));
                            show.push(bizBud);
                            break;
                    }
                    break;
            }
            if (bizBud === undefined)
                break;
        }
        return show;
    }
    bizEntityScan2(bizEntity) {
        let ok = true;
        if (this.fieldString === undefined)
            return ok;
        let len = this.fieldString.length;
        if (len === 1) {
            this.log(`${this.element.name}'s show value can not be one bud`);
            return false;
        }
        let fieldShowItems = this.getFieldShow(bizEntity, ...this.fieldString);
        if (fieldShowItems === undefined) {
            ok = false;
        }
        else {
            let bizBin = bizEntity;
            let { showBuds } = bizBin;
            if (showBuds === undefined) {
                showBuds = bizBin.showBuds = [];
            }
            showBuds.push(fieldShowItems);
            this.element.ui.show = true;
        }
        return ok;
    }
}
exports.PBizBudValue = PBizBudValue;
class PBizBudAny extends PBizBudValue {
}
exports.PBizBudAny = PBizBudAny;
class PBizBudArr extends PBizBudValue {
    _parse() {
        let propArr = this.parsePropArr();
        let { props } = this.element;
        this.parsePropMap(props, propArr);
    }
    getBudClass(budClass) {
        return il_1.budClassesOut[budClass];
    }
    getBudClassKeys() {
        return il_1.budClassKeysOut;
    }
    scan(space) {
        let ok = super.scan(space);
        const { props } = this.element;
        for (let [, bud] of props) {
            if (bud.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizBudArr = PBizBudArr;
class PBizBudValueWithRange extends PBizBudValue {
    parseBudEquValue() {
        super.parseBudEquValue();
        for (;;) {
            const { token } = this.ts;
            if (token === tokens_1.Token.GE) {
                if (this.element.min !== undefined) {
                    this.ts.error(`min can be defined more than once`);
                }
                this.ts.readToken();
                let exp = new il_1.ValueExpression();
                this.context.parseElement(exp);
                this.element.min = { exp };
            }
            else if (token === tokens_1.Token.LE) {
                if (this.element.max !== undefined) {
                    this.ts.error(`min can be defined more than once`);
                }
                this.ts.readToken();
                let exp = new il_1.ValueExpression();
                this.context.parseElement(exp);
                this.element.max = { exp };
            }
            else {
                break;
            }
        }
    }
    scan(space) {
        let ok = super.scan(space);
        let { min, max } = this.element;
        if (min !== undefined) {
            if (min.exp.pelement.scan(space) === ok) {
                ok = false;
            }
        }
        if (max !== undefined) {
            if (max.exp.pelement.scan(space) === ok) {
                ok = false;
            }
        }
        return ok;
    }
}
class PBizBudInt extends PBizBudValueWithRange {
}
exports.PBizBudInt = PBizBudInt;
class PBizBudDec extends PBizBudValueWithRange {
    _parse() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.NUM) {
                this.ts.expectToken(tokens_1.Token.NUM);
            }
            let n = this.ts.dec;
            this.ts.readToken();
            let f = undefined;
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.NUM) {
                    this.ts.expectToken(tokens_1.Token.NUM);
                }
                f = this.ts.dec;
                this.ts.readToken();
            }
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
            if (f !== undefined) {
                if (Number.isInteger(n) === false || Number.isInteger(f) === false) {
                    this.ts.error('must be integer');
                }
                n = f;
            }
            else {
                if (Number.isInteger(n) === false) {
                    this.ts.error('must be integer');
                }
            }
            if (n < 0 || n > 6) {
                this.ts.error('must be a number between 0-6');
            }
            this.element.ui.fraction = n;
        }
        this.parseBudEquValue();
    }
}
exports.PBizBudDec = PBizBudDec;
class PBizBudJSON extends PBizBudValue {
    _parse() {
    }
}
exports.PBizBudJSON = PBizBudJSON;
class PBinValue extends PBizBudDec {
    _parse() {
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
                let name = this.ts.passVar();
                let ui = this.parseUI();
                let bizBudDec = new il_1.BizBudDec(this.element.entity, name, ui);
                bizBudDec.parser(this.context).parse();
                this.element.values.push(bizBudDec);
                this.ts.passToken(tokens_1.Token.SEMICOLON);
            }
        }
        super._parse();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        for (let bud of this.element.values) {
            if (bud.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBinValue = PBinValue;
class PBizBudChar extends PBizBudValue {
}
exports.PBizBudChar = PBizBudChar;
class PBizBudDate extends PBizBudValueWithRange {
}
exports.PBizBudDate = PBizBudDate;
class PBizBudIDIO extends PBizBud {
    _parse() {
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PBizBudIDIO = PBizBudIDIO;
class PBizBudIDBase extends PBizBudValue {
    parseFieldShow() {
        if (this.ts.token !== tokens_1.Token.LBRACE)
            return;
        this.fieldShows = [];
        this.element.fieldShows = [];
        this.ts.readToken();
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COLON) {
                this.ts.readToken();
                switch (this.ts.token) {
                    case tokens_1.Token.BITWISEAND:
                        this.includeTitleBuds = true;
                        this.ts.readToken();
                        this.ts.passToken(tokens_1.Token.SEMICOLON);
                        break;
                    case tokens_1.Token.ADD:
                        this.includePrimeBuds = true;
                        this.ts.readToken();
                        this.ts.passToken(tokens_1.Token.SEMICOLON);
                        break;
                    default:
                        let fieldShow = [];
                        for (;;) {
                            fieldShow.push(this.ts.passVar());
                            if (this.ts.token === tokens_1.Token.SEMICOLON) {
                                this.ts.readToken();
                                break;
                            }
                            if (this.ts.token === tokens_1.Token.DOT) {
                                this.ts.readToken();
                            }
                        }
                        this.fieldShows.push(fieldShow);
                        break;
                }
            }
            else {
                this.ts.expectToken(tokens_1.Token.COLON);
            }
        }
    }
    bizEntityScan2(bizEntity) {
        var _a, _b;
        let ok = super.bizEntityScan2(bizEntity);
        if (this.fieldShows !== undefined) {
            const { fieldShows } = this.element;
            const includeBuds = (bizBuds) => {
                if (bizBuds === undefined)
                    return;
                for (let bud of bizBuds)
                    fieldShows.push([this.element, bud]);
            };
            if (this.includeTitleBuds === true) {
                includeBuds((_a = this.element.ID) === null || _a === void 0 ? void 0 : _a.titleBuds);
            }
            if (this.includePrimeBuds === true) {
                includeBuds((_b = this.element.ID) === null || _b === void 0 ? void 0 : _b.primeBuds);
            }
            for (let fieldShow of this.fieldShows) {
                let show = this.getFieldShow(bizEntity, this.element.name, ...fieldShow);
                if (show === undefined) {
                    ok = false;
                }
                else {
                    fieldShows.push(show);
                }
            }
        }
        return ok;
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.idName !== undefined) {
            let ID = super.scanID(space, this.idName);
            if (ID === undefined) {
                ok = false;
            }
            else {
                this.element.ID = ID;
            }
        }
        return ok;
    }
}
class PBizBudIXBase extends PBizBudIDBase {
    _parse() {
        this.idName = this.ts.mayPassVar();
        this.parseFieldShow();
    }
}
exports.PBizBudIXBase = PBizBudIXBase;
class PBizBudID extends PBizBudIDBase {
    _parse() {
        this.idName = this.ts.mayPassVar();
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            this.ts.passKey('base');
            this.ts.passToken(tokens_1.Token.EQU);
            let setType = il_1.BudValueSetType.equ;
            let exp = new il_1.ValueExpression();
            this.context.parseElement(exp);
            let budValue = {
                exp,
                setType,
            };
            this.element.params['base'] = budValue;
            this.ts.mayPassToken(tokens_1.Token.COMMA);
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
        }
        if (this.ts.isKeyword('required') === true) {
            this.element.required = true;
            this.element.ui.required = true;
            this.ts.readToken();
        }
        this.parseFieldShow();
        this.parseBudEquValue();
    }
    scan(space) {
        let ok = super.scan(space);
        const { params } = this.element;
        for (let i in params) {
            if (params[i].exp.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizBudID = PBizBudID;
class PBizBudBin extends PBizBudValue {
    constructor() {
        super(...arguments);
        this.showBuds = [];
    }
    _parse() {
        this.binName = this.ts.mayPassVar();
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                let showBud;
                if (this.ts.token === tokens_1.Token.XOR) {
                    this.ts.readToken();
                    let bud = this.ts.passVar();
                    showBud = [undefined, bud];
                }
                else {
                    showBud = [this.ts.passVar()];
                }
                this.showBuds.push(showBud);
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
        this.parseBudEquValue();
    }
    scan0(space) {
        let ok = super.scan0(space);
        if (this.binName === undefined) {
            ok = false;
            this.log(`${this.element.getJName()} does not define BIN`);
        }
        else {
            let bin = space.uq.biz.bizEntities.get(this.binName);
            this.element.bin = bin;
            if (bin === undefined || bin.bizPhraseType !== BizPhraseType_1.BizPhraseType.bin) {
                ok = false;
                this.log(`${this.binName} is not a BIN`);
            }
        }
        return ok;
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.showBuds.length === 0) {
            return ok;
        }
        let { bin: bizBin } = this.element;
        this.element.showBuds = [];
        const { showBuds } = this.element;
        for (let showBudName of this.showBuds) {
            let pEntity = bizBin;
            let bud = undefined;
            let arr = [];
            for (let sbn of showBudName) {
                if (pEntity === undefined) {
                    ok = false;
                    this.log(`${bud.getJName()} does not has ${sbn}`);
                    break;
                }
                if (sbn === undefined) {
                    pEntity = pEntity.main;
                    if (pEntity === undefined) {
                        ok = false;
                        this.log(`${bizBin.getJName()} does not has MAIN`);
                        break;
                    }
                    arr.push(undefined);
                    continue;
                }
                bud = pEntity.getBud(sbn);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${pEntity.getJName()} does not has bud ${showBudName}`);
                    break;
                }
                arr.push(bud);
                pEntity = bud.IDEntity;
            }
            ;
            showBuds.push(arr);
        }
        return ok;
    }
}
exports.PBizBudBin = PBizBudBin;
class PBizBudPickable extends PBizBudValue {
    _parse() {
        if (this.ts.token === tokens_1.Token.VAR) {
            if (this.ts.varBrace === false) {
                switch (this.ts.lowerVar) {
                    case 'pick':
                        this.ts.readToken();
                        this.pick = this.ts.passVar();
                        return;
                }
            }
        }
        else {
            this.parseBudEquValue();
        }
        this.ts.expect('Atom', 'Pick', '=', ':=', ':');
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.pick !== undefined) {
            let pick = this.getBizEntity(space, this.pick);
            if (pick !== undefined) {
                let { bizPhraseType } = pick;
                if (bizPhraseType === BizPhraseType_1.BizPhraseType.pick || bizPhraseType === BizPhraseType_1.BizPhraseType.atom) {
                    this.element.pick = pick.name;
                    return ok;
                }
            }
            ok = false;
            this.log(`${this.pick} is not Pick`);
            return ok;
        }
    }
}
exports.PBizBudPickable = PBizBudPickable;
class PBizBudRadioOrCheck extends PBizBudValue {
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            super._parse();
            return;
        }
        this.optionsName = this.ts.lowerVar;
        this.ts.readToken();
        this.parseBudEquValue();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        const { optionsName } = this;
        if (optionsName === undefined)
            return ok;
        let options = space.uq.biz.bizEntities.get(optionsName);
        if (options === undefined) {
            this.log(`Options ${optionsName} not exists`);
            return false;
        }
        if (options.type !== 'options') {
            this.log(`${optionsName} is not an Options`);
            return false;
        }
        this.element.options = options;
        return ok;
    }
}
/*
export class PBizBudIntOf extends PBizBudRadioOrCheck<BizBudIntOf> {
}
*/
class PBizBudRadio extends PBizBudRadioOrCheck {
}
exports.PBizBudRadio = PBizBudRadio;
class PBizBudCheck extends PBizBudRadioOrCheck {
}
exports.PBizBudCheck = PBizBudCheck;
//# sourceMappingURL=Bud.js.map
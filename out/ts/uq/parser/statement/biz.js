"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementOut = exports.PBizStatementSpec = exports.PBizStatementAtom = exports.PBizStatementSheet = exports.PBizStatementTitle = exports.PBizStatementInPend = exports.PBizStatementBinPend = exports.PBizStatementPend = exports.PBizStatementIn = exports.PBizStatementBin = exports.PBizStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const il_2 = require("../../il");
const consts_1 = require("../../consts");
class PBizStatement extends statement_1.PStatement {
    constructor(bizStatement, context) {
        super(bizStatement, context);
        this.bizSubs = {
            title: il_1.BizStatementTitle,
            sheet: il_1.BizStatementSheet,
        };
        this.bizStatement = bizStatement;
        this.init();
    }
    init() {
        let ex = this.getBizSubsEx();
        for (let i in ex) {
            this.bizSubs[i] = ex[i];
        }
    }
    _parse() {
        let key = this.ts.passKey();
        let BizSub = this.bizSubs[key];
        if (BizSub === undefined) {
            this.ts.expect(...Object.keys(this.bizSubs));
        }
        let bizSub = new BizSub(this.bizStatement);
        this.context.parseElement(bizSub);
        this.bizStatement.sub = bizSub;
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan0(space) {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan0(space) == false)
            ok = false;
        return ok;
    }
    scan(space) {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan(space) == false)
            ok = false;
        return ok;
    }
}
exports.PBizStatement = PBizStatement;
class PBizStatementBin extends PBizStatement {
    getBizSubsEx() {
        return {
            pend: il_1.BizStatementBinPend,
            out: il_1.BizStatementOut,
        };
    }
}
exports.PBizStatementBin = PBizStatementBin;
class PBizStatementIn extends PBizStatement {
    getBizSubsEx() {
        return {
            atom: il_1.BizStatementAtom,
            spec: il_1.BizStatementSpec,
        };
    }
}
exports.PBizStatementIn = PBizStatementIn;
class PBizStatementSub extends element_1.PElement {
}
class PBizStatementPend extends PBizStatementSub {
    _parse() {
        let setEqu;
        if (this.ts.token === tokens_1.Token.VAR) {
            this.pend = this.ts.passVar();
            if (this.ts.token === tokens_1.Token.EQU) {
                this.ts.readToken();
                this.element.val = this.context.parse(il_1.ValueExpression);
            }
            if (this.ts.isKeyword('set') === true) {
                this.sets = {};
                this.ts.passKey('set');
                for (;;) {
                    let v = this.ts.passVar();
                    this.ts.passToken(tokens_1.Token.EQU);
                    let exp = this.context.parse(il_1.ValueExpression);
                    this.sets[v] = exp;
                    let { token } = this.ts;
                    if (token === tokens_1.Token.COMMA) {
                        this.ts.readToken();
                        continue;
                    }
                    if (token === tokens_1.Token.SEMICOLON) {
                        break;
                    }
                    this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.SEMICOLON);
                }
            }
        }
        else {
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.EQU, tokens_1.Token.ADDEQU, tokens_1.Token.SUBEQU);
                    break;
                case tokens_1.Token.EQU:
                    setEqu = il_1.SetEqu.equ;
                    break;
                case tokens_1.Token.ADDEQU:
                    setEqu = il_1.SetEqu.add;
                    break;
                case tokens_1.Token.SUBEQU:
                    setEqu = il_1.SetEqu.sub;
                    break;
            }
            this.ts.readToken();
            this.element.setEqu = setEqu;
            this.element.val = this.context.parse(il_1.ValueExpression);
        }
    }
    getPend(space, pendName) {
        let pend = space.uq.biz.bizEntities.get(pendName);
        if (pend === undefined) {
            this.log(`'${this.pend}' is not defined`);
            return undefined;
        }
        if (pend.type !== 'pend') {
            this.log(`'${this.pend}' is not a PEND`);
            return undefined;
        }
        return pend;
    }
    scan0(space) {
        let ok = true;
        let bizBin = space.getBizEntity(undefined);
        if (this.pend !== undefined) {
            let pend = this.getPend(space, this.pend);
            if (pend !== undefined) {
                pend.bizBins.push(bizBin);
            }
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        if (this.pend !== undefined) {
            let pend = this.getPend(space, this.pend);
            if (pend === undefined) {
                ok = false;
            }
            else {
                this.element.pend = pend;
                if (this.sets !== undefined) {
                    let { sets } = this.element;
                    for (let i in this.sets) {
                        let bud = pend.getBud(i);
                        if (bud === undefined) {
                            ok = false;
                            this.log(`There is no ${i.toUpperCase()} in Pend ${pend.jName}`);
                        }
                        else {
                            let exp = this.sets[i];
                            if (exp.pelement.scan(space) === false) {
                                ok = false;
                            }
                            else {
                                sets.push([bud, exp]);
                            }
                        }
                    }
                }
            }
        }
        let { val } = this.element;
        if (val !== undefined) {
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizStatementPend = PBizStatementPend;
class PBizStatementBinPend extends PBizStatementPend {
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { val, bizStatement: { bizAct } } = this.element;
        if (this.pend === undefined) {
            const { bizBin } = bizAct;
            if (bizBin.pend === undefined) {
                this.log(`Biz Pend = can not be used here when ${bizBin.getJName()} has no PEND`);
                ok = false;
            }
            if (val !== undefined) {
                if (val.pelement.scan(space) === false)
                    ok = false;
            }
        }
        return ok;
    }
}
exports.PBizStatementBinPend = PBizStatementBinPend;
class PBizStatementInPend extends PBizStatementPend {
}
exports.PBizStatementInPend = PBizStatementInPend;
class PBizStatementTitle extends PBizStatementSub {
    _parse() {
        this.buds = [];
        for (;;) {
            this.buds.push(this.ts.passVar());
            if (this.ts.token !== tokens_1.Token.DOT)
                break;
            this.ts.readToken();
        }
        this.ts.passKey('of');
        this.element.of = this.context.parse(il_1.ValueExpression);
        switch (this.ts.token) {
            default:
                this.ts.expectToken(tokens_1.Token.ADDEQU, tokens_1.Token.SUBEQU);
                break;
            case tokens_1.Token.EQU:
                this.element.setEqu = il_1.SetEqu.equ;
                break;
            case tokens_1.Token.ADDEQU:
                this.element.setEqu = il_1.SetEqu.add;
                break;
            case tokens_1.Token.SUBEQU:
                this.element.setEqu = il_1.SetEqu.sub;
                break;
        }
        this.ts.readToken();
        this.element.val = this.context.parse(il_1.ValueExpression);
    }
    scan(space) {
        let ok = true;
        let { val, of, setEqu } = this.element;
        let len = this.buds.length;
        let buds0 = this.buds[0];
        let entity = space.uq.biz.bizEntities.get(buds0);
        if (entity === undefined) {
            this.log(`'${buds0}' is not a Biz Entity`);
            ok = false;
            return ok;
        }
        if (len !== 2) {
            this.log(`'There must be a bud of ${buds0}`);
            ok = false;
            return ok;
        }
        let buds1 = this.buds[1];
        let bud = entity.getBud(buds1);
        if (bud === undefined) {
            this.log(`'${buds0}.${buds1}' not defined`);
            ok = false;
            return ok;
        }
        this.element.entity = entity;
        this.element.bud = bud;
        let { dataType } = bud;
        if (setEqu === il_1.SetEqu.add || setEqu === il_1.SetEqu.sub) {
            if (dataType !== il_2.BudDataType.int && dataType !== il_2.BudDataType.dec) {
                this.log('only int or dec support += or -=');
                ok = false;
            }
        }
        if (val !== undefined) {
            if (val.pelement.scan(space) === false)
                ok = false;
        }
        if (of !== undefined) {
            if (of.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBizStatementTitle = PBizStatementTitle;
class PBizStatementSheet extends PBizStatementSub {
    constructor() {
        super(...arguments);
        this.sets = {};
    }
    _parse() {
        this.useSheet = this.ts.passVar();
        if (this.ts.isKeyword('detail') === true) {
            this.ts.readToken();
            this.detail = this.ts.passVar();
        }
        this.parseSet();
    }
    scan(space) {
        let ok = true;
        let useSheet = space.getUse(this.useSheet);
        if (useSheet === undefined || useSheet.obj.type !== 'sheet') {
            ok = false;
            this.log(`${this.useSheet} is not a USE SHEET`);
        }
        else {
            this.element.useSheet = useSheet.obj;
            let { sheet } = this.element.useSheet;
            if (sheet === undefined) {
                ok = false;
            }
            else {
                const detail = sheet.details.find(v => v.bin.name === this.detail);
                if (detail !== undefined) {
                    this.element.bin = this.element.detail = detail.bin;
                }
                else {
                    this.element.bin = sheet.main;
                }
                if (this.scanSets(space) === false)
                    ok = false;
            }
        }
        return ok;
    }
    parseSet() {
        this.ts.passKey('set');
        for (;;) {
            let name = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            this.sets[name] = val;
            if (this.ts.token === tokens_1.Token.SEMICOLON)
                break;
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.SEMICOLON);
        }
    }
    scanSets(space) {
        let ok = true;
        const { bin, fields, buds } = this.element;
        const { props } = bin;
        for (let i in this.sets) {
            let val = this.sets[i];
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            if (consts_1.binFieldArr.findIndex(v => v === i) >= 0) {
                fields[i] = val;
                continue;
            }
            if (props.has(i) === true) {
                buds[i] = val;
                continue;
            }
            ok = false;
            this.log(`${i} is not defined in ${bin.getJName()}`);
        }
        return ok;
    }
}
exports.PBizStatementSheet = PBizStatementSheet;
/*
export class PBizStatementDetail extends PBizStatementSheetBase<BizAct, BizStatementDetail> {
    private sheet: string;
    private detail: string;
    protected _parse(): void {
        this.detail = this.ts.passVar();
        this.ts.passKey('of');
        this.sheet = this.ts.passVar();
        this.ts.passToken(Token.EQU);
        this.element.idVal = new ValueExpression();
        let { idVal } = this.element;
        this.context.parseElement(idVal);
        this.parseSet();
    }

    override scan(space: Space): boolean {
        let ok = true;
        let sheet = space.getBizEntity<BizSheet>(this.sheet);
        if (sheet === undefined || sheet.bizPhraseType !== BizPhraseType.sheet) {
            ok = false;
            this.log(`${this.sheet} is not a SHEET`);
        }
        else {
            this.element.sheet = sheet;
            let getDetail = (): BizBin => {
                let bin = space.getBizEntity<BizBin>(this.detail);
                if (bin === undefined) return;
                for (let detail of sheet.details) {
                    if (detail.bin === bin) return bin;
                }
                return undefined;
            }
            this.element.bin = getDetail();
            let { bin } = this.element;
            if (bin === undefined) {
                ok = false;
                this.log(`${this.detail} is not a detail of SHEET ${this.sheet}`);
            }
        }
        if (this.scanSets(space) === false) ok = false;
        let { idVal } = this.element;
        if (idVal.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
*/
class PBizStatementID extends PBizStatementSub {
    constructor() {
        super(...arguments);
        this.inVals = [];
    }
    _parse() {
        this.entityName = this.ts.passVar();
        this.ts.passKey('in');
        this.ts.passToken(tokens_1.Token.EQU);
        this.parseUnique();
        this.parseTo();
    }
    parseUnique() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                let val = new il_1.ValueExpression();
                this.context.parseElement(val);
                this.inVals.push(val);
                const { token } = this.ts;
                if (token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
            }
        }
        else {
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            this.inVals.push(val);
        }
    }
    parseTo() {
        this.ts.passKey('to');
        this.toVar = this.ts.passVar();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        this.entity = space.getBizEntity(this.entityName);
        if (this.entity === undefined) {
            ok = false;
            this.log(`${this.entityName} is not defined`);
        }
        this.element.toVar = space.varPointer(this.toVar, false);
        if (this.element.toVar === undefined) {
            ok = false;
            this.log(`${this.toVar} is not defined`);
        }
        for (let inVal of this.inVals) {
            if (inVal.pelement.scan(space) === false) {
                ok = false;
            }
        }
        this.element.inVals = this.inVals;
        return ok;
    }
}
class PBizStatementAtom extends PBizStatementID {
    constructor() {
        super(...arguments);
        this.sets = {};
    }
    _parse() {
        this.entityName = this.ts.passVar();
        let key = this.ts.passKey();
        switch (key) {
            case 'no': break;
            case 'unique':
                this.unique = this.ts.passVar();
                break;
            default: this.ts.expect('no', 'unique');
        }
        this.parseUnique();
        this.parseTo();
        this.parseSets();
    }
    parseSets() {
        if (this.ts.token !== tokens_1.Token.VAR)
            return;
        if (this.ts.varBrace === true || this.ts.lowerVar !== 'set') {
            this.ts.expect('set');
        }
        this.ts.readToken();
        for (;;) {
            let bud = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            if (bud === 'ex') {
                this.element.ex = val;
            }
            else {
                this.sets[bud] = val;
            }
            const { token } = this.ts;
            if (token === tokens_1.Token.SEMICOLON) {
                // this.ts.readToken();
                break;
            }
            if (token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.SEMICOLON);
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.entity.bizPhraseType !== il_1.BizPhraseType.atom) {
            ok = false;
            this.log(`${this.entityName} is not ATOM`);
        }
        else {
            this.element.atom = this.entity;
        }
        const { atom, sets, ex } = this.element;
        let { length } = this.inVals;
        if (this.unique === undefined) {
            if (length !== 1) {
                ok = false;
                this.log(`NO ${length} variables, can only have 1 variable`);
            }
        }
        else {
            let unique = this.element.atom.getUnique(this.unique);
            if (unique === undefined) {
                ok = false;
                this.log(`ATOM ${this.entityName} has no UNIQUE ${this.unique}`);
            }
            else {
                this.element.unique = unique;
            }
        }
        if (ex !== undefined) {
            if (ex.pelement.scan(space) === false) {
                ok = false;
            }
        }
        for (let i in this.sets) {
            let val = this.sets[i];
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            let bud = atom.props.get(i);
            if (bud === undefined) {
                ok = false;
                this.log(`ATOM ${this.entityName} has no PROP ${i}`);
            }
            sets.set(bud, val);
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        const { unique } = this.element;
        if (unique.keys.length + 1 !== this.inVals.length) {
            ok = false;
            this.log(`ATOM ${this.entityName} UNIQUE ${this.unique} keys count mismatch`);
        }
        return ok;
    }
}
exports.PBizStatementAtom = PBizStatementAtom;
class PBizStatementSpec extends PBizStatementID {
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.entity.bizPhraseType !== il_1.BizPhraseType.spec) {
            ok = false;
            this.log(`${this.entityName} is not SPEC`);
        }
        else {
            this.element.spec = this.entity;
            let length = this.element.spec.keys.length + 1;
            if (length !== this.inVals.length) {
                ok = false;
                this.log(`IN ${this.inVals.length} variables, must have ${length} variables`);
            }
        }
        return ok;
    }
}
exports.PBizStatementSpec = PBizStatementSpec;
class PBizStatementOut extends PBizStatementSub {
    // private ioSite: string;
    // private ioApp: string;
    _parse() {
        this.outName = this.ts.passVar();
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                this.ts.readToken();
                for (;;) {
                    let to = new il_1.ValueExpression();
                    this.element.tos.push(to);
                    this.context.parseElement(to);
                    if (this.ts.token === tokens_1.Token.COMMA) {
                        this.ts.readToken();
                    }
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                }
            }
            else {
                let to = new il_1.ValueExpression();
                this.element.tos.push(to);
                this.context.parseElement(to);
            }
        }
        else if (this.ts.isKeyword('add') === true) {
            this.ts.readToken();
            this.element.detail = this.ts.passVar();
        }
        else {
            this.ts.expect('to', 'add');
        }
        this.ts.passKey('set');
        for (;;) {
            let name = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            this.element.sets[name] = val;
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token === tokens_1.Token.SEMICOLON) {
                break;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.SEMICOLON);
        }
    }
    scan(space) {
        let ok = true;
        let { tos, detail, sets } = this.element;
        let bizOut = space.getBizEntity(this.outName);
        if (bizOut === undefined || bizOut.bizPhraseType !== il_1.BizPhraseType.out) {
            ok = false;
            this.log(`${this.outName} is not OUT`);
        }
        else {
            let hasTo;
            for (let to of tos) {
                if (to !== undefined) {
                    if (to.pelement.scan(space) === false) {
                        ok = false;
                    }
                    hasTo = true;
                }
                else {
                    hasTo = false;
                }
            }
            this.element.useOut = space.regUseBizOut(bizOut, hasTo);
            let { props } = bizOut;
            if (detail !== undefined) {
                let arr = bizOut.props.get(detail);
                if (arr === undefined || arr.dataType !== il_2.BudDataType.arr) {
                    ok = false;
                    this.log(`${detail} is not a ARR of ${bizOut.getJName()}`);
                }
                else {
                    props = arr.props;
                }
            }
            if (props !== undefined) {
                for (let i in sets) {
                    if (props.has(i) === false) {
                        ok = false;
                        this.log(`${i} is not defined`);
                    }
                    else if (sets[i].pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
        }
        return ok;
    }
}
exports.PBizStatementOut = PBizStatementOut;
//# sourceMappingURL=biz.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementError = exports.PBizStatementBinAct = exports.PBizStatementOut = exports.PBizStatementTie = exports.PBizStatementSheet = exports.PBizStatementBook = exports.PBizStatementInPend = exports.PBizStatementBinPend = exports.PBizStatementPend = exports.PBizStatementIn = exports.PBizStatementBinState = exports.PBizStatementBin = exports.PBizStatement = void 0;
const space_1 = require("../../space");
const il_1 = require("../../../il");
const PStatement_1 = require("../../PStatement");
const tokens_1 = require("../../tokens");
const consts_1 = require("../../../consts");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const biz_statement_sub_1 = require("./biz.statement.sub");
class PBizStatement extends PStatement_1.PStatement {
    constructor(bizStatement, context) {
        super(bizStatement, context);
        this.bizSubs = {
            title: il_1.BizStatementBook,
            book: il_1.BizStatementBook,
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
            atom: il_1.BizStatementAtom,
            spec: il_1.BizStatementFork,
            fork: il_1.BizStatementFork,
            tie: il_1.BizStatementTie,
            error: il_1.BizStatementError,
        };
    }
}
exports.PBizStatementBin = PBizStatementBin;
class PBizStatementBinState extends PBizStatement {
    getBizSubsEx() {
        return {
            state: il_1.BizStatementState,
            binact: il_1.BizStatementBinAct,
        };
    }
}
exports.PBizStatementBinState = PBizStatementBinState;
class PBizStatementIn extends PBizStatement {
    getBizSubsEx() {
        return {
            atom: il_1.BizStatementAtom,
            spec: il_1.BizStatementFork,
            fork: il_1.BizStatementFork,
            tie: il_1.BizStatementTie,
        };
    }
}
exports.PBizStatementIn = PBizStatementIn;
class PBizStatementPend extends biz_statement_sub_1.PBizStatementSub {
    _parse() {
        let setEqu;
        if (this.ts.token === tokens_1.Token.VAR) {
            this.pend = this.ts.passVar();
            switch (this.ts.token) {
                default: break;
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
            if (setEqu !== undefined) {
                this.ts.readToken();
                this.element.setEqu = setEqu;
                this.element.val = this.context.parse(il_1.ValueExpression);
            }
            if (this.ts.isKeyword('key') === true) {
                this.ts.readToken();
                this.keys = new Map();
                // const { keys } = this.element;
                this.ts.passToken(tokens_1.Token.LPARENTHESE);
                for (;;) {
                    let key = this.ts.passVar();
                    if (this.keys.has(key) === true) {
                        this.ts.error(`duplicate ${key}`);
                    }
                    this.ts.passToken(tokens_1.Token.EQU);
                    let val = new il_1.ValueExpression();
                    this.context.parseElement(val);
                    this.keys.set(key, val);
                    if (this.ts.token === tokens_1.Token.COMMA) {
                        this.ts.readToken();
                        if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                            this.ts.readToken();
                            break;
                        }
                    }
                    else if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                }
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
        let { bizEntityArr: [bizBin] } = space.getBizFromEntityArrFromAlias(undefined);
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
                            continue;
                        }
                        let exp = this.sets[i];
                        if (exp.pelement.scan(space) === false) {
                            ok = false;
                            continue;
                        }
                        switch (bud.name) {
                            default:
                                sets.push([bud, exp]);
                                break;
                            case 'value':
                                ok = false;
                                this.log(`VALUE= is no allowed here`);
                                break;
                            case 'i':
                                this.element.setI = exp;
                                break;
                            case 'x':
                                this.element.setX = exp;
                                break;
                        }
                    }
                }
                if (this.keys !== undefined) {
                    let { keys: keyBuds } = pend;
                    if (keyBuds === undefined) {
                        ok = false;
                        this.log(`no keys defined in ${pend.getJName()}`);
                    }
                    else if (this.keys.size !== keyBuds.length) {
                        ok = false;
                        this.log(`keys count here is ${this.keys.size}, PEND ${pend.getJName()} keys count is ${keyBuds.length}. must be equal`);
                    }
                    else {
                        let i = 0;
                        this.element.keys = new Map();
                        const { keys } = this.element;
                        for (let [name, val] of this.keys) {
                            let bud = keyBuds[i];
                            if (bud.name !== name) {
                                ok = false;
                                this.log(`${name} is not align with PEND keys define`);
                            }
                            else {
                                if (val.pelement.scan(space) === false) {
                                    ok = false;
                                }
                                else {
                                    keys.set(bud, val);
                                }
                            }
                            i++;
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
class PBizStatementBook extends biz_statement_sub_1.PBizStatementSub {
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
        space = new BizStatementSubSpace(space, this.element);
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
            if (dataType !== BizPhraseType_1.BudDataType.int && dataType !== BizPhraseType_1.BudDataType.dec) {
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
exports.PBizStatementBook = PBizStatementBook;
class PBizStatementSheet extends biz_statement_sub_1.PBizStatementSub {
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
class PBizStatementTie extends biz_statement_sub_1.PBizStatementSub {
    _parse() {
        this.tieName = this.ts.passVar();
        this.ts.passKey('i');
        this.ts.passToken(tokens_1.Token.EQU);
        let ival = new il_1.ValueExpression();
        this.context.parseElement(ival);
        this.ts.passKey('x');
        this.ts.passToken(tokens_1.Token.EQU);
        let xval = new il_1.ValueExpression();
        this.context.parseElement(xval);
        this.element.i = ival;
        this.element.x = xval;
    }
    scan(space) {
        let ok = true;
        let { bizEntityArr: [tie] } = space.getBizFromEntityArrFromName(this.tieName);
        if (tie === undefined || tie.bizPhraseType !== BizPhraseType_1.BizPhraseType.tie) {
            ok = false;
            this.log(`${this.tieName} is not TIE`);
        }
        else {
            this.element.tie = tie;
        }
        const { i, x } = this.element;
        if (i.pelement.scan(space) === false) {
            ok = false;
        }
        if (x.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizStatementTie = PBizStatementTie;
class PBizStatementOut extends biz_statement_sub_1.PBizStatementSub {
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
        let { bizEntityArr: [bizOut] } = space.getBizFromEntityArrFromName(this.outName);
        if (bizOut === undefined || bizOut.bizPhraseType !== BizPhraseType_1.BizPhraseType.out) {
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
                if (arr === undefined || arr.dataType !== BizPhraseType_1.BudDataType.arr) {
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
class PBizStatementBinAct extends biz_statement_sub_1.PBizStatementSub {
    _parse() {
    }
}
exports.PBizStatementBinAct = PBizStatementBinAct;
class PBizStatementError extends biz_statement_sub_1.PBizStatementSub {
    _parse() {
        let key = this.ts.passKey();
        switch (key) {
            default:
                this.ts.expect('PEND', 'BIN');
                break;
            case 'pend':
                let pendOver = new il_1.ValueExpression();
                this.context.parseElement(pendOver);
                this.element.pendOver = pendOver;
                break;
            case 'bin':
                let message = new il_1.ValueExpression();
                this.context.parseElement(message);
                this.element.message = message;
                break;
        }
    }
    scan(space) {
        let ok = true;
        const { pendOver, message } = this.element;
        if (pendOver !== undefined) {
            if (pendOver.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (message !== undefined) {
            if (message.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizStatementError = PBizStatementError;
class BizStatementSubSpace extends space_1.Space {
    constructor(outer, bizStatementSub) {
        super(outer);
        this.bizStatementSub = bizStatementSub;
    }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        return;
    }
    _varPointer(name, isField) {
        return;
    }
    get isReadonly() {
        return false;
    }
}
//# sourceMappingURL=biz.statement.js.map
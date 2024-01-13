"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementSpec = exports.PBizStatementAtom = exports.PBizStatementDetail = exports.PBizStatementSheet = exports.PBizStatementTitle = exports.PBizStatementInPend = exports.PBizStatementBinPend = exports.PBizStatementPend = exports.PBizStatementIn = exports.PBizStatementBin = exports.PBizStatement = void 0;
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
            detail: il_1.BizStatementDetail,
            atom: il_1.BizStatementAtom,
            spec: il_1.BizStatementSpec,
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
        };
    }
}
exports.PBizStatementBin = PBizStatementBin;
class PBizStatementIn extends PBizStatement {
    getBizSubsEx() {
        return {
        // pend: BizStatementInPend,
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
            if (this.ts.isKeyword('set') === true) {
                this.sets = {};
                this.ts.passKey('set');
                for (;;) {
                    let v = this.ts.passVar();
                    this.ts.passToken(tokens_1.Token.EQU);
                    let exp = new il_1.ValueExpression();
                    this.context.parseElement(exp);
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
class PBizStatementSheetBase extends PBizStatementSub {
    constructor() {
        super(...arguments);
        this.sets = {};
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
class PBizStatementSheet extends PBizStatementSheetBase {
    _parse() {
        this.sheet = this.ts.passVar();
        this.ts.passKey('to');
        this.id = this.ts.passVar();
        this.parseSet();
    }
    scan(space) {
        let ok = true;
        let sheet = space.getBizEntity(this.sheet);
        if (sheet === undefined || sheet.bizPhraseType !== il_1.BizPhraseType.sheet) {
            ok = false;
            this.log(`${this.sheet} is not a SHEET`);
        }
        this.element.sheet = sheet;
        this.element.bin = sheet.main;
        let pointer = space.varPointer(this.id, false);
        if (pointer === undefined) {
            ok = false;
            this.log(`没有定义${this.id}`);
        }
        else {
            pointer.name = this.id;
        }
        this.element.idPointer = pointer;
        if (this.scanSets(space) === false)
            ok = false;
        return ok;
    }
}
exports.PBizStatementSheet = PBizStatementSheet;
class PBizStatementDetail extends PBizStatementSheetBase {
    _parse() {
        this.detail = this.ts.passVar();
        this.ts.passKey('of');
        this.sheet = this.ts.passVar();
        this.ts.passToken(tokens_1.Token.EQU);
        this.element.idVal = new il_1.ValueExpression();
        let { idVal } = this.element;
        this.context.parseElement(idVal);
        this.parseSet();
    }
    scan(space) {
        let ok = true;
        let sheet = space.getBizEntity(this.sheet);
        if (sheet === undefined || sheet.bizPhraseType !== il_1.BizPhraseType.sheet) {
            ok = false;
            this.log(`${this.sheet} is not a SHEET`);
        }
        else {
            this.element.sheet = sheet;
            let getDetail = () => {
                let bin = space.getBizEntity(this.detail);
                if (bin === undefined)
                    return;
                for (let detail of sheet.details) {
                    if (detail.bin === bin)
                        return bin;
                }
                return undefined;
            };
            this.element.bin = getDetail();
            let { bin } = this.element;
            if (bin === undefined) {
                ok = false;
                this.log(`${this.detail} is not a detail of SHEET ${this.sheet}`);
            }
        }
        if (this.scanSets(space) === false)
            ok = false;
        let { idVal } = this.element;
        if (idVal.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizStatementDetail = PBizStatementDetail;
var IDAct;
(function (IDAct) {
    IDAct[IDAct["in"] = 0] = "in";
    IDAct[IDAct["id"] = 1] = "id";
})(IDAct || (IDAct = {}));
class PBizStatementID extends PBizStatementSub {
    constructor() {
        super(...arguments);
        this.vals = [];
    }
    _parse() {
        this.entity = this.ts.passVar();
        this.ts.passKey('to');
        this.toVar = this.ts.passVar();
        let key = this.ts.passKey();
        switch (key) {
            default: this.ts.expect('in', 'id');
            case 'in':
                this.idAct = IDAct.in;
                break;
            case 'id':
                this.idAct = IDAct.id;
                break;
        }
        this.ts.passToken(tokens_1.Token.EQU);
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                let val = new il_1.ValueExpression();
                this.context.parseElement(val);
                this.vals.push(val);
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
            this.vals.push(val);
        }
    }
}
class PBizStatementAtom extends PBizStatementID {
}
exports.PBizStatementAtom = PBizStatementAtom;
class PBizStatementSpec extends PBizStatementID {
}
exports.PBizStatementSpec = PBizStatementSpec;
//# sourceMappingURL=biz.js.map
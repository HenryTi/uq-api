"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBinTitleStatement = exports.PBizBinPendStatement = exports.PBizBinStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const il_2 = require("../../il");
class PBizBinStatement extends statement_1.PStatement {
    constructor(bizStatement, context) {
        super(bizStatement, context);
        this.bizSubs = {
            pend: il_1.BizBinPendStatement,
            title: il_1.BizBinTitleStatement,
        };
        this.bizStatement = bizStatement;
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
exports.PBizBinStatement = PBizBinStatement;
class PBizBinPendStatement extends element_1.PElement {
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
        let { val, bizStatement: { bizDetailAct } } = this.element;
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
        else {
            const { bizBin } = bizDetailAct;
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
exports.PBizBinPendStatement = PBizBinPendStatement;
class PBizBinTitleStatement extends element_1.PElement {
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
exports.PBizBinTitleStatement = PBizBinTitleStatement;
//# sourceMappingURL=biz.js.map
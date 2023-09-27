"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizDetailActSubTab = exports.PBizDetailActSubPend = exports.PBizDetailActStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class PBizDetailActStatement extends statement_1.PStatement {
    constructor(bizStatement, context) {
        super(bizStatement, context);
        this.bizSubs = {
            pend: il_1.BizDetailActSubPend,
            bud: il_1.BizDetailActSubTab,
            tab: il_1.BizDetailActSubTab,
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
    scan(space) {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan(space) == false)
            ok = false;
        return ok;
    }
}
exports.PBizDetailActStatement = PBizDetailActStatement;
class PBizDetailActSubPend extends element_1.PElement {
    _parse() {
        let setEqu;
        if (this.ts.token === tokens_1.Token.VAR) {
            this.pend = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
            setEqu = il_1.SetEqu.equ;
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
        }
        this.element.setEqu = setEqu;
        this.element.val = this.context.parse(il_1.ValueExpression);
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
            }
        }
        else {
            const { bizDetail } = bizDetailAct;
            if (bizDetail.pend === undefined) {
                this.log(`Biz Pend = can not be used here when ${bizDetail.jName} has no PEND`);
                ok = false;
            }
        }
        if (val !== undefined) {
            if (val.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBizDetailActSubPend = PBizDetailActSubPend;
class PBizDetailActSubTab extends element_1.PElement {
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
            if (dataType !== il_1.BudDataType.int && dataType !== il_1.BudDataType.dec) {
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
exports.PBizDetailActSubTab = PBizDetailActSubTab;
//# sourceMappingURL=biz.js.map
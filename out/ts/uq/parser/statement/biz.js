"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizDetailActSubBud = exports.PBizDetailActSubPend = exports.PBizDetailActStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class PBizDetailActStatement extends statement_1.PStatement {
    constructor(bizStatement, context) {
        super(bizStatement, context);
        this.bizSubs = {
            pend: il_1.BizDetailActSubPend,
            bud: il_1.BizDetailActSubBud,
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
        this.pend = this.ts.passVar();
        if (this.ts.isKeyword('id') === true) {
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.EQU) {
                this.ts.readToken();
                this.element.valId = this.context.parse(il_1.ValueExpression);
            }
            else if (this.ts.isKeyword('to') === true) {
                this.ts.readToken();
                this.toVar = this.ts.passVar();
            }
            else {
                this.ts.expect('=', 'TO');
            }
        }
        if (this.ts.isKeyword('detail') === true) {
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.EQU);
            this.element.valDetailId = this.context.parse(il_1.ValueExpression);
        }
        if (this.ts.isKeyword('set') === true) {
            this.ts.readToken();
            this.ts.passKey('value');
            let valueCalc;
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.EQU, tokens_1.Token.ADDEQU, tokens_1.Token.SUBEQU);
                    break;
                case tokens_1.Token.EQU:
                    valueCalc = il_1.PendValueCalc.equ;
                    break;
                case tokens_1.Token.ADDEQU:
                    valueCalc = il_1.PendValueCalc.add;
                    break;
                case tokens_1.Token.SUBEQU:
                    valueCalc = il_1.PendValueCalc.sub;
                    break;
            }
            this.ts.readToken();
            this.element.valueCalc = valueCalc;
            this.element.valValue = this.context.parse(il_1.ValueExpression);
        }
        else if (this.ts.isKeyword('del') === true) {
            this.ts.readToken();
            this.element.pendAct = il_1.PendAct.del;
        }
        else if (this.ts.isKeyword('goto') === true) {
            this.ts.readToken();
            this.element.pendAct = il_1.PendAct.goto;
            this.pendGoTo = this.ts.passVar();
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
    scan(space) {
        let ok = true;
        let { valId, valDetailId, valValue, receiver, bizStatement, pendAct } = this.element;
        // let { bizDetailAct } = bizStatement;
        let pend = this.getPend(space, this.pend);
        if (pend === undefined) {
            ok = false;
        }
        else {
            this.element.pend = pend;
        }
        if (this.pendGoTo !== undefined) {
            let pendGoto = this.getPend(space, this.pendGoTo);
            if (pendGoto === undefined) {
                ok = false;
            }
            else {
                this.element.pendGoto = pendGoto;
            }
        }
        if (this.toVar !== undefined) {
            let vp = space.varPointer(this.toVar, false);
            if (vp === undefined) {
                this.log(`变量 ${this.toVar} 没有定义`);
                ok = false;
            }
            let v = new il_1.Var(this.toVar, undefined, undefined);
            v.pointer = vp;
            this.element.toVar = v;
            let cannotAct;
            switch (pendAct) {
                default: break;
                case il_1.PendAct.goto:
                    cannotAct = 'GOTO';
                    break;
                case il_1.PendAct.del:
                    cannotAct = 'DEL';
                    break;
            }
            if (cannotAct !== undefined) {
                this.log(`Biz Pend ID TO can not ${cannotAct}`);
                ok = false;
            }
            if (valDetailId === undefined) {
                this.log(`Biz Pend ID To must have DETAIL=?`);
                ok = false;
            }
        }
        if (valId !== undefined) {
            if (valId.pelement.scan(space) === false)
                ok = false;
        }
        if (valDetailId !== undefined) {
            if (valDetailId.pelement.scan(space) === false)
                ok = false;
        }
        if (valValue !== undefined) {
            if (valValue.pelement.scan(space) === false)
                ok = false;
        }
        if (receiver !== undefined) {
            if (receiver.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBizDetailActSubPend = PBizDetailActSubPend;
class PBizDetailActSubBud extends element_1.PElement {
    _parse() {
        this.bizEntity = this.ts.passVar();
        this.ts.passToken(tokens_1.Token.DOT);
        this.bud = this.ts.passVar();
        this.ts.passKey('of');
        this.element.obj = this.context.parse(il_1.ValueExpression);
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            this.v = this.ts.lowerVar;
            this.ts.readToken();
            return;
        }
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
        this.element.value = this.context.parse(il_1.ValueExpression);
        if (this.ts.isKeyword('ref') === true) {
            this.ts.readToken();
            this.element.ref = this.context.parse(il_1.ValueExpression);
        }
    }
    scan(space) {
        let ok = true;
        let { value: delta, ref, obj, setEqu } = this.element;
        let entity = space.uq.biz.bizEntities.get(this.bizEntity);
        if (entity === undefined) {
            this.log(`'${this.bizEntity}' is not a Biz Entity`);
            ok = false;
            return ok;
        }
        let bud = entity.getBud(this.bud);
        if (bud === undefined) {
            this.log(`'${this.bizEntity}.${this.bud}' not defined`);
            ok = false;
        }
        else {
            this.element.bud = bud;
            let { dataType, hasHistory } = bud;
            if (setEqu === il_1.SetEqu.add || setEqu === il_1.SetEqu.sub) {
                if (dataType !== il_1.BudDataType.int && dataType !== il_1.BudDataType.dec) {
                    this.log('only int or dec support += or -=');
                    ok = false;
                }
            }
            if (ref !== undefined) {
                if (hasHistory !== true) {
                    this.log(`'${this.bizEntity}.${this.bud}' not support HISTORY`);
                    ok = false;
                }
            }
        }
        if (delta !== undefined) {
            if (delta.pelement.scan(space) === false)
                ok = false;
        }
        if (ref !== undefined) {
            if (ref.pelement.scan(space) === false)
                ok = false;
        }
        if (obj !== undefined) {
            if (obj.pelement.scan(space) === false)
                ok = false;
        }
        if (this.v !== undefined) {
            let vp = space.varPointer(this.v, false);
            if (vp === undefined) {
                this.log(`变量 ${this.v} 没有定义`);
                ok = false;
            }
            let v = new il_1.Var(this.v, undefined, undefined);
            v.pointer = vp;
            this.element.toVar = v;
            return;
        }
        return ok;
    }
}
exports.PBizDetailActSubBud = PBizDetailActSubBud;
//# sourceMappingURL=biz.js.map
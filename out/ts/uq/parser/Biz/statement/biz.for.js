"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizForFieldSpace = exports.BizForSpace = exports.PBizFor = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const BizSelectStatement_1 = require("./BizSelectStatement");
const BizField_1 = require("../../../il/BizField");
class PBizFor extends BizSelectStatement_1.PBizSelectStatement {
    constructor() {
        super(...arguments);
        this.ids = new Map();
    }
    createFromSpace(space) {
        return new BizForSpace(space, this.element);
    }
    _parse() {
        let { values } = this.element;
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        this.ts.passKey('id');
        if (this.ts.isKeyword('group') === true) {
            this.element.isGroup = true;
            this.ts.readToken();
        }
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            let v = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
            let t = this.ts.passVar();
            if (this.ids.has(v) === true) {
                this.ts.error(`duplicate name ${v}`);
            }
            this.ids.set(v, t);
            if (this.ts.token !== tokens_1.Token.COMMA) {
                this.ts.passToken(tokens_1.Token.RPARENTHESE);
                break;
            }
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        this.ts.passKey('value');
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            let v = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            values.set(v, val);
            if (this.ts.token !== tokens_1.Token.COMMA) {
                this.ts.passToken(tokens_1.Token.RPARENTHESE);
                break;
            }
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        if (this.ts.isKeyword('from') === true) {
            this.ts.readToken();
            this.parseFromEntity(this.pFromEntity);
        }
        this.parseWhere();
        this.parseOrder();
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
        let statement = this.element.statements = this.context.createStatements(this.element);
        statement.level = this.element.level;
        let parser = statement.parser(this.context);
        parser.parse();
    }
    parseOrder() {
        if (this.ts.isKeyword('order') === false)
            return;
        this.ts.readToken();
        this.ts.passKey('by');
        const { orderBys } = this.element;
        for (;;) {
            let fieldName = this.ts.passVar();
            let asc = il_1.EnumAsc.asc;
            if (this.ts.token === tokens_1.Token.VAR) {
                if (this.ts.varBrace === false) {
                    switch (this.ts.lowerVar) {
                        case 'asc':
                            asc = il_1.EnumAsc.asc;
                            this.ts.readToken();
                            break;
                        case 'desc':
                            asc = il_1.EnumAsc.desc;
                            this.ts.readToken();
                            break;
                    }
                }
            }
            orderBys.push({ fieldName, asc });
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
        }
    }
    scan(space) {
        let ok = super.scan(space);
        if (ok === false)
            return ok;
        const { ids, values, statements, vars, orderBys } = this.element;
        let theSpace = new BizForSpace(space, this.element);
        for (let [n, [v, asc]] of this.ids) {
            let fromEntity = theSpace.getBizFromEntityArrFromAlias(v);
            if (fromEntity === undefined) {
                ok = false;
                this.log(`${v} not defined`);
                continue;
            }
            vars[n] = new il_1.Var(n, new il_1.BigInt());
            let idCol = {
                name: n,
                fromEntity,
            };
            ids.set(n, idCol);
        }
        for (let [n, val] of values) {
            vars[n] = new il_1.Var(n, il_1.bizDecType);
            if (ids.has(n) === true) {
                ok = false;
                this.log(`duplicate name ${n}`);
                continue;
            }
            if (val.pelement.scan(theSpace) === false) {
                ok = false;
                continue;
            }
        }
        for (let i in vars) {
            let vr = vars[i];
            let vp = vr.pointer = new il_1.VarPointer();
            let no = theSpace.getVarNo();
            vp.no = no;
            theSpace.setVarNo(no + 1);
        }
        for (let { fieldName } of orderBys) {
            if (ids.has(fieldName) === true)
                continue;
            if (values.has(fieldName) === true)
                continue;
            ok = false;
            this.log(`${fieldName} is not defined`);
        }
        if (statements.pelement.scan(theSpace) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizFor = PBizFor;
class BizForSpace extends BizSelectStatement_1.BizSelectStatementSpace {
    get inLoop() { return true; }
    _varPointer(name, isField) {
        let { vars } = this.from;
        let vr = vars[name];
        if (vr === undefined)
            return;
        return vr.pointer;
    }
    createBizFieldSpace(from) {
        return new BizForFieldSpace();
    }
    _getBizFromEntityFromAlias(name) {
        return this.from.getBizFromEntityFromAlias(name);
    }
}
exports.BizForSpace = BizForSpace;
class BizForFieldSpace extends BizField_1.BizFieldSpace {
    buildBizFieldFromDuo(n0, n1) {
        return;
        // throw new Error("Method not implemented.");
    }
}
exports.BizForFieldSpace = BizForFieldSpace;
//# sourceMappingURL=biz.for.js.map
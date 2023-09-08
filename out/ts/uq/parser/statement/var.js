"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PVarStatement = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const statement_1 = require("./statement");
class PVarStatement extends statement_1.PStatement {
    constructor(_var, context) {
        super(_var, context);
        this._var = _var;
    }
    _parse() {
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR)
                this.expect('变量名称');
            let name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.expect('类型');
            }
            let dataType = (0, il_1.createDataType)(this.ts.lowerVar);
            if (dataType === undefined) {
                this.expect('类型');
            }
            this.ts.readToken();
            let parser = dataType.parser(this.context);
            parser.parse();
            let expression = undefined;
            let token = this.ts.token;
            if (token === tokens_1.Token.EQU) {
                this.ts.readToken();
                expression = new il_1.ValueExpression();
                parser = expression.parser(this.context);
                parser.parse();
                token = this.ts.token;
            }
            let v = new il_1.Var(name, dataType, expression);
            this._var.vars.push(v);
            if (this.ts.isKeywords('from') === true) {
                let select = new il_1.Select();
                select.toVar = true;
                select.columns = this._var.vars.map(v => {
                    let { name, exp } = v;
                    return {
                        alias: name,
                        value: exp,
                    };
                });
                this._var.select = select;
                this.context.parseElement(select);
                this.ts.passToken(tokens_1.Token.SEMICOLON);
                return;
            }
            switch (token) {
                case tokens_1.Token.COMMA:
                    this.ts.readToken();
                    continue;
                case tokens_1.Token.SEMICOLON:
                    this.ts.readToken();
                    return;
                default:
                    this.expectToken(tokens_1.Token.COMMA, tokens_1.Token.SEMICOLON);
                    return;
            }
        }
    }
    scan(space) {
        let ok = true;
        let { vars, select } = this._var;
        if (select !== undefined) {
            vars.forEach(v => {
                const { name, dataType } = v;
                const { pelement } = dataType;
                if (pelement !== undefined) {
                    if (pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                let p = space.varPointer(name, undefined);
                if (p !== undefined) {
                    this.log('重复定义变量 ' + name);
                    ok = false;
                }
                let vp = v.pointer = new il_1.VarPointer();
                let no = space.getVarNo();
                vp.no = no;
                space.setVarNo(no + 1);
                let exp = v.exp;
                if (exp === undefined)
                    return;
                // if (exp.pelement.scan(space) === false) ok = false;
            });
            let varSelectSpace = new VarSelectSpace(space, this._var);
            if (select.pelement.scan(varSelectSpace) === false)
                ok = false;
        }
        else {
            vars.forEach(v => {
                const { name, dataType } = v;
                const { pelement } = dataType;
                if (pelement !== undefined) {
                    if (pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                let p = space.varPointer(name, undefined);
                if (p !== undefined) {
                    this.log('重复定义变量 ' + name);
                    ok = false;
                }
                let vp = v.pointer = new il_1.VarPointer();
                let no = space.getVarNo();
                vp.no = no;
                space.setVarNo(no + 1);
                let exp = v.exp;
                if (exp === undefined)
                    return;
                if (exp.pelement.scan(space) === false)
                    ok = false;
            });
        }
        return ok;
    }
}
exports.PVarStatement = PVarStatement;
class VarSelectSpace extends space_1.Space {
    constructor(outer, _var) {
        super(outer);
        this._var = _var;
    }
    _getEntityTable(name) {
        return undefined;
    }
    _getTableByAlias(alias) {
        return undefined;
    }
    _varPointer(name, isField) {
        let v = this._var.getVar(name);
        if (v !== undefined) {
            return v.pointer;
        }
    }
}
//# sourceMappingURL=var.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizExp = exports.PBizExpOperand = exports.PBizSelectInline = exports.PBizSelectOperand = exports.PBizSelect = void 0;
const il_1 = require("../il");
const element_1 = require("./element");
const tokens_1 = require("./tokens");
class PBizSelect extends element_1.PElement {
    parseFrom() {
        let main = this.parseTbl();
        let joins = this.parseJoins();
        this.from = {
            main,
            joins,
        };
    }
    parseTbl() {
        let entityArr = [];
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                entityArr.push(this.ts.passVar());
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                }
            }
        }
        else {
            entityArr.push(this.ts.passVar());
        }
        let alias;
        if (this.ts.token === tokens_1.Token.SubGT || this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            alias = this.ts.passVar();
        }
        return {
            entityArr,
            alias,
        };
    }
    parseJoin() {
        let joinType;
        if (this.ts.token === tokens_1.Token.XOR) {
            joinType = '^';
        }
        else if (this.ts.isKeyword('x') === true) {
            joinType = 'x';
        }
        else if (this.ts.isKeyword('i') === true) {
            joinType = 'i';
        }
        else {
            return;
        }
        let tbl = this.parseTbl();
        return { joinType, tbl };
    }
    parseJoins() {
        let joins = [];
        for (;;) {
            let join = this.parseJoin();
            if (join === undefined)
                break;
            joins.push(join);
        }
        if (joins.length === 0)
            return;
        return joins;
    }
    parseColumn() {
        if (this.ts.token === tokens_1.Token.Exclamation) {
            this.ts.readToken();
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            this.element.column = {
                alias: undefined,
                val,
            };
        }
    }
    scan(space) {
        let ok = true;
        let from = this.scanFrom(space);
        if (from === undefined) {
            ok = false;
        }
        else {
            this.element.from = from;
        }
        let { column } = this.element;
        if (column !== undefined) {
            if (column.val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scanFrom(space) {
        let ok = true;
        let { joins } = this.from;
        let main = this.scanTbl(space, this.from.main);
        if (main === undefined) {
            ok = false;
        }
        let bsJoins;
        if (joins !== undefined) {
            bsJoins = [];
            for (let join of joins) {
                let bsJoin = this.scanJoin(space, join);
                if (bsJoin === undefined) {
                    ok = false;
                }
                else {
                    bsJoins.push(bsJoin);
                }
            }
        }
        if (ok === false)
            return;
        return {
            main,
            joins: bsJoins,
        };
    }
    scanTbl(space, tbl) {
        let ok = true;
        const { entityArr, alias } = tbl;
        const bizEntityArr = [];
        for (let entity of entityArr) {
            let bizEntity = space.getBizEntity(entity);
            if (bizEntity === undefined) {
                this.log(`${entity} is not defined`);
                ok = false;
            }
            // this.element.entity = entity;
            bizEntityArr.push(bizEntity);
        }
        if (ok === false)
            return;
        return {
            entityArr: bizEntityArr,
            alias,
        };
    }
    scanJoin(space, join) {
        let tbl = this.scanTbl(space, join.tbl);
        if (tbl === undefined)
            return undefined;
        return {
            joinType: join.joinType,
            tbl,
        };
    }
}
exports.PBizSelect = PBizSelect;
class PBizSelectOperand extends element_1.PElement {
    _parse() {
        this.element.select = new il_1.BizSelectInline();
        const { select } = this.element;
        this.context.parseElement(select);
    }
    scan(space) {
        let ok = true;
        const { select } = this.element;
        if (select.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizSelectOperand = PBizSelectOperand;
class PBizSelectInline extends PBizSelect {
    _parse() {
        this.parseFrom();
        this.ts.passToken(tokens_1.Token.AT);
        this.element.on = new il_1.ValueExpression();
        const { on } = this.element;
        this.context.parseElement(on);
        this.parseColumn();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let expValue = new il_1.ValueExpression();
        let one = new il_1.VarOperand();
        one._var = ['i'];
        expValue.atoms.push(one);
        let { on } = this.element;
        if (on !== undefined && on.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizSelectInline = PBizSelectInline;
class PBizExpOperand extends element_1.PElement {
    _parse() {
        this.element.bizExp = new il_1.BizExp();
        const { bizExp } = this.element;
        this.context.parseElement(bizExp);
    }
    scan(space) {
        let ok = true;
        const { bizExp } = this.element;
        if (bizExp.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizExpOperand = PBizExpOperand;
class PBizExp extends element_1.PElement {
    _parse() {
        this.bizEntity = this.ts.passVar();
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        this.element.param = new il_1.ValueExpression();
        let { param } = this.element;
        this.context.parseElement(param);
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.XOR) {
                this.element.prop = 'base';
                this.ts.readToken();
            }
            else {
                this.element.prop = this.ts.passVar();
            }
        }
    }
    scan(space) {
        let ok = true;
        let { param } = this.element;
        if (param.pelement.scan(space) === false) {
            ok = false;
        }
        this.element.bizEntity = space.getBizEntity(this.bizEntity);
        const { bizEntity } = this.element;
        if (bizEntity === undefined) {
            this.log(`${this.bizEntity} is not a Biz Entity`);
            ok = false;
        }
        else {
            const { prop } = this.element;
            if (bizEntity.checkName(prop) === false) {
                this.log(`${bizEntity.jName} has not prop ${prop}`);
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizExp = PBizExp;
//# sourceMappingURL=bizSelect.js.map
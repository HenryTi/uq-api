"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizForFieldSpace = exports.BizForSpace = exports.PBizFor = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const BizSelectStatement_1 = require("./BizSelectStatement");
const BizField_1 = require("../../../il/BizField");
class PBizFor extends BizSelectStatement_1.PBizSelectStatement {
    createFromSpace(space) {
        return new BizForSpace(space, this.element);
    }
    _parse() {
        let { forCols } = this.element;
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        this.ts.passKey('var');
        for (;;) {
            let v = this.ts.passVar();
            let d = this.ts.passKey();
            let dataType = (0, il_1.createDataType)(d);
            this.context.parseElement(dataType);
            let vr = new il_1.Var(v, dataType);
            this.ts.passToken(tokens_1.Token.EQU);
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            forCols.push(vr);
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('from') === true) {
            this.ts.readToken();
            this.parseFromEntity(this.pFromEntity);
        }
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
        let statement = this.element.statements = this.context.createStatements(this.element);
        statement.level = this.element.level;
        let parser = statement.parser(this.context);
        parser.parse();
    }
    scan(space) {
        let ok = super.scan(space);
        const { forCols, statements } = this.element;
        let theSpace = new BizForSpace(space, this.element);
        for (let v of forCols) {
            let vp = v.pointer = new il_1.VarPointer();
            let no = theSpace.getVarNo();
            vp.no = no;
            theSpace.setVarNo(no + 1);
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
        let { forCols } = this.from;
        let vr = forCols.find(v => v.name === name);
        if (vr === undefined)
            return;
        return vr.pointer;
    }
    createBizFieldSpace(from) {
        return new BizForFieldSpace();
    }
}
exports.BizForSpace = BizForSpace;
class BizForFieldSpace extends BizField_1.BizFieldSpace {
    buildBizFieldFromDuo(n0, n1) {
        throw new Error("Method not implemented.");
    }
}
exports.BizForFieldSpace = BizForFieldSpace;
//# sourceMappingURL=biz.for.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpAt = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpAt extends element_1.PElement {
    _parse() {
        if (this.ts.token === tokens_1.Token.EQU) {
            this.ts.readToken();
            this.element.bizVal = this.context.parse(il_1.ValueExpression);
        }
        else {
            let bizName = [];
            if (this.ts.token === tokens_1.Token.DOLLARVAR) {
                bizName.push(this.ts.lowerVar);
                this.ts.readToken();
            }
            else {
                for (;;) {
                    let v = this.ts.passVar();
                    bizName.push(v);
                    if (this.ts.token !== tokens_1.Token.DOT)
                        break;
                    this.ts.readToken();
                }
            }
            this.element.bizName = bizName;
        }
    }
    scan(space) {
        let ok = true;
        let { bizName, bizVal } = this.element;
        if (bizName !== undefined) {
            let biz = space.getBizBase(bizName);
            if (biz === undefined) {
                this.log(`unknown biz object '${bizName.join('.')}'`);
                ok = false;
            }
            this.element.biz = biz;
        }
        else {
            bizVal.pelement.scan(space);
        }
        return ok;
    }
}
exports.POpAt = POpAt;
//# sourceMappingURL=opAt.js.map
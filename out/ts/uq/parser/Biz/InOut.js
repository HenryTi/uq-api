"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inPreDefined = exports.PBizInActStatements = exports.PBizInAct = exports.PBizOut = exports.PBizIn = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
const Biz_1 = require("./Biz");
class PBizInOut extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
    parseParam() {
        const { props } = this.element;
        let propArr = this.parsePropArr();
        this.parsePropMap(props, propArr);
        /*
        for (; this.ts.isKeyword('arr') === true;) {
            this.ts.readToken();
            let name = this.ts.passVar();
            propArr = this.parsePropArr();
            let map = new Map<string, BizBudValue>();
            this.parsePropMap(map, propArr);
            arrs[name] = {
                name,
                props: map,
                arrs: undefined,
            }
        }
        */
    }
    parseBody() {
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        const { props } = this.element;
        const nameColl = {};
        if (this.checkBudDuplicate(nameColl, props) === false) {
            ok = false;
        }
        /*
        for (let i in arrs) {
            let arr = arrs[i];
            let { name, props: arrProps } = arr;
            if (props.has(name) === true) {
                this.log(`ARR '${name}' duplicate prop name`);
                ok = false;
            }
            for (let [propName,] of arrProps) {
                if (props.has(propName) === true) {
                    this.log(`ARR prop '${name}' duplicate main prop name`);
                    ok = false;
                }
            }
        }
        */
        return ok;
    }
    checkBudDuplicate(nameColl, props) {
        let ok = true;
        for (let [, bud] of props) {
            let { name, dataType } = bud;
            if (nameColl[name] === true) {
                this.log(`'${name}' duplicate prop name`);
                ok = false;
            }
            else {
                nameColl[name] = true;
            }
            if (dataType === il_1.BudDataType.arr) {
                if (this.checkBudDuplicate(nameColl, bud.props) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
}
class PBizIn extends PBizInOut {
    getBudClass(budClass) {
        return il_1.budClassesIn[budClass];
    }
    getBudClassKeys() {
        return il_1.budClassKeysIn;
    }
    parseBody() {
        if (this.ts.token !== tokens_1.Token.LBRACE) {
            this.ts.expectToken(tokens_1.Token.LBRACE);
        }
        let bizAct = new il_1.BizInAct(this.element.biz, this.element);
        this.context.parseElement(bizAct);
        this.element.act = bizAct;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { act } = this.element;
        if (act.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizIn = PBizIn;
class PBizOut extends PBizInOut {
    getBudClass(budClass) {
        return il_1.budClassesOut[budClass];
    }
    getBudClassKeys() {
        return il_1.budClassKeysOut;
    }
    parseBody() {
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
}
exports.PBizOut = PBizOut;
class PBizInAct extends Base_1.PBizAct {
    createBizActStatements() {
        return new il_1.BizInActStatements(undefined, this.element);
    }
    createBizActSpace(space) {
        return new BizInActSpace(space, this.element.bizIn);
    }
}
exports.PBizInAct = PBizInAct;
class PBizInActStatements extends Base_1.PBizActStatements {
    createBizActStatement(parent) {
        return new il_1.BizStatementIn(parent, this.bizAct);
    }
}
exports.PBizInActStatements = PBizInActStatements;
exports.inPreDefined = [];
class BizInActSpace extends Biz_1.BizEntitySpace {
    _varPointer(name, isField) {
        if (exports.inPreDefined.indexOf(name) >= 0) {
            return new il_1.VarPointer();
        }
    }
    _varsPointer(names) {
        return undefined;
    }
    _getBizEntity(name) {
        switch (name) {
            default:
                return super._getBizEntity(name);
            case 'pend':
                return;
        }
    }
}
//# sourceMappingURL=InOut.js.map
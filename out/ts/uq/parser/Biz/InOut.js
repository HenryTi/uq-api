"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizInActStatements = exports.PBizOut = exports.PBizIn = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizInOut extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseInOutProp = () => {
            this.parsePropMap(this.element.props);
        };
        this.parseArr = () => {
            let name = this.ts.passVar();
            let props = new Map();
            let act;
            this.ts.passToken(tokens_1.Token.LBRACE);
            for (;;) {
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                    break;
                }
                let v = this.ts.passKey();
                switch (v) {
                    default:
                        this.ts.expect('prop', 'act');
                        break;
                    case 'prop':
                        this.parsePropMap(props);
                        break;
                    case 'act':
                        this.parseAct();
                        break;
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
            }
            if (props.size === 0) {
                this.ts.error('no prop defined in ARR');
            }
            let { arrs } = this.element;
            arrs[name] = {
                name,
                props,
                act,
            };
        };
        this.parseAct = () => {
            this.element.act = this.parseActObj();
        };
    }
    parseProps() {
        let budArr = [];
        let name;
        if (this.ts.token === tokens_1.Token.VAR) {
            name = this.ts.passVar();
        }
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            for (;;) {
                let bud = this.parseSubItem();
                this.ts.passToken(tokens_1.Token.SEMICOLON);
                this.checkBudType(bud);
                const { name: budName } = bud;
                if (budArr.findIndex(v => v.name === name) >= 0) {
                    this.ts.error(`duplicate ${budName}`);
                }
                budArr.push(bud);
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
                    break;
                }
            }
        }
        else {
            if (name === undefined) {
                this.ts.expectToken(tokens_1.Token.LBRACE);
            }
            let ui = this.parseUI();
            let bizBud = this.parseBud(name, ui);
            this.checkBudType(bizBud);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
            budArr.push(bizBud);
        }
        return budArr;
    }
    checkBudType(bud) {
        const types = [il_1.BudDataType.int, il_1.BudDataType.char, il_1.BudDataType.date, il_1.BudDataType.dec];
        if (types.indexOf(bud.dataType) < 0) {
            this.ts.error(`IN and OUT support only ${types.map(v => il_1.BudDataType[v]).join(', ')}`);
        }
    }
    parsePropMap(props) {
        let propArr = this.parseProps();
        for (let p of propArr) {
            let { name } = p;
            if (props.has(name) === true) {
                this.ts.error(`duplicate ${name}`);
            }
            props.set(name, p);
        }
    }
    parseActObj() {
        this.ts.passToken(tokens_1.Token.LBRACE);
        this.ts.passToken(tokens_1.Token.RBRACE);
        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
        return;
    }
    scan(space) {
        if (super.scan(space) === false)
            return false;
        let ok = true;
        const { props, arrs } = this.element;
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
        return ok;
    }
}
class PBizIn extends PBizInOut {
    constructor() {
        super(...arguments);
        this.keyColl = {
            prop: this.parseInOutProp,
            arr: this.parseArr,
            act: this.parseAct,
        };
    }
}
exports.PBizIn = PBizIn;
class PBizOut extends PBizInOut {
    constructor() {
        super(...arguments);
        this.keyColl = {
            prop: this.parseInOutProp,
            arr: this.parseArr,
        };
    }
}
exports.PBizOut = PBizOut;
class PBizInActStatements extends Base_1.PBizActStatements {
    scan0(space) {
        return super.scan0(space);
    }
    statementFromKey(parent, key) {
        let ret;
        switch (key) {
            default:
                ret = super.statementFromKey(parent, key);
                break;
            case 'biz':
                ret = new il_1.BizInActStatement(parent, this.bizAct);
                break;
        }
        if (ret !== undefined)
            ret.inSheet = true;
        return ret;
    }
}
exports.PBizInActStatements = PBizInActStatements;
//# sourceMappingURL=InOut.js.map
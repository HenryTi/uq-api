"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizQueryTableInPendStatements = exports.PPendQuery = exports.PBizPend = void 0;
const il_1 = require("../../il");
const Pend_1 = require("../../il/Biz/Pend");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
const Query_1 = require("./Query");
class PBizPend extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseQuery = () => {
            this.element.pendQuery = new Pend_1.PendQuery(this.element);
            let { pendQuery } = this.element;
            this.context.parseElement(pendQuery);
        };
        this.parseI = () => {
            if (this.element.i !== undefined) {
                this.ts.error(`I can only be defined once in Biz Pend`);
            }
            this.element.i = this.parseBudAtom('i');
        };
        this.parseX = () => {
            if (this.element.x !== undefined) {
                this.ts.error(`X can only be defined once in Biz Pend`);
            }
            this.element.x = this.parseBudAtom('x');
        };
        this.parseKeys = () => {
            this.keys = [];
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            for (;;) {
                this.keys.push(this.ts.passVar());
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = (() => {
            let ret = {
                prop: this.parseProp,
                query: this.parseQuery,
                i: this.parseI,
                x: this.parseX,
                key: this.parseKeys,
            };
            const setRet = (n) => {
                ret[n] = () => this.parsePredefined(n);
            };
            Pend_1.BizPend.predefinedId.forEach(setRet);
            Pend_1.BizPend.predefinedValue.forEach(setRet);
            return ret;
        })();
    }
    parsePredefined(name) {
        let caption = this.ts.mayPassString();
        this.element.predefinedFields.push(name);
        let bud = this.element.predefinedBuds[name];
        if (bud === undefined)
            debugger;
        // 有caption值，才会显示
        bud.ui = { caption: caption !== null && caption !== void 0 ? caption : name };
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parseContent() {
        super.parseContent();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { props, pendQuery, i, x } = this.element;
        const predefines = [...Pend_1.BizPend.predefinedId, ...Pend_1.BizPend.predefinedValue];
        if (i !== undefined) {
            if (this.scanBud(space, i) === false) {
                ok = false;
            }
            if (i.value !== undefined) {
                this.log(`I can not =`);
                ok = false;
            }
        }
        else {
            this.log(`I must be defined`);
            ok = false;
        }
        if (x !== undefined) {
            if (this.scanBud(space, x) === false) {
                ok = false;
            }
            if (x.value !== undefined) {
                this.log(`X can not =`);
                ok = false;
            }
        }
        for (let [, bud] of props) {
            if (predefines.includes(bud.name) === true) {
                this.log(`Pend Prop name can not be one of these: ${predefines.join(', ')}`);
                ok = false;
            }
        }
        if (this.keys !== undefined) {
            this.element.keys = [];
            const { keys } = this.element;
            for (let key of this.keys) {
                let bud = this.element.getDefinedBud(key);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${key} is not defined in PEND`);
                }
                else {
                    keys.push(bud);
                }
            }
            if (keys.length < 2) {
                ok = false;
                this.log(`PEND key items count must be at least 2`);
            }
        }
        if (pendQuery !== undefined) {
            if (pendQuery.pelement.scan(space) === false) {
                ok = false;
            }
            for (let param of pendQuery.params) {
                const { name } = param;
                if (this.element.getBud(name) !== undefined) {
                    this.log(`${name} duplicate`);
                    ok = false;
                }
            }
        }
        return ok;
    }
    bizEntityScan2(bizEntity) {
        let ok = super.bizEntityScan2(bizEntity);
        let { i, x } = this.element;
        function check2(bizBud) {
            if (bizBud === undefined)
                return;
            let { pelement } = bizBud;
            if (pelement !== undefined) {
                if (pelement.bizEntityScan2(bizEntity) === false)
                    ok = false;
            }
        }
        check2(i);
        check2(x);
        return ok;
    }
}
exports.PBizPend = PBizPend;
class PPendQuery extends Query_1.PBizQueryTable {
    parseHeader() {
    }
    createStatements() {
        return new Pend_1.BizQueryTableInPendStatements(this.element);
    }
}
exports.PPendQuery = PPendQuery;
class PBizQueryTableInPendStatements extends Query_1.PBizQueryTableStatements {
    statementFromKey(parent, key) {
        let bizQueryTableInPendStatements = this.element;
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'from': return new il_1.FromInPendStatement(parent, bizQueryTableInPendStatements.pendQuery);
        }
    }
}
exports.PBizQueryTableInPendStatements = PBizQueryTableInPendStatements;
//# sourceMappingURL=Pend.js.map
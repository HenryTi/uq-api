"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizAtomState = exports.PBizAtom = exports.PBizSpec = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizSpec extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseKey = () => {
            let key = this.parseSubItem('key');
            this.element.keys.set(key.name, key);
        };
    }
    get defaultName() { return undefined; }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            key: this.parseKey,
            // assign: this.parseAssign,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
        }
    }
    isValidPropName(prop) {
        return true;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        let { keys } = this.element;
        let { size } = keys;
        if (size > 4) {
            this.log(`Spec '${this.element.name}' defined ${size} keys. Can not have more than 4 keys`);
            ok = false;
        }
        this.element.buildFields();
        return ok;
    }
}
exports.PBizSpec = PBizSpec;
class PBizAtom extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseUom = () => {
            if (this.element.uom !== undefined) {
                this.ts.error('UOM can only be defined once');
            }
            /*
            let metric: string;
            if (this.ts.token === Token.VAR) {
                metric = this.ts.lowerVar;
                this.ts.readToken();
            }
            else {
                metric = '*';
            }
            */
            this.element.uom = true;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        /*
        private parseState = () => {
            let state = this.context.parse(BizAtomState);
            this.element.states.set(state.name, state);
        }
        */
        this.parseSpec = () => {
            if (this.specName !== undefined) {
                this.ts.error('SPEC can only be defined once');
            }
            this.ts.assertToken(tokens_1.Token.VAR);
            this.specName = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
    }
    get defaultName() { return undefined; }
    parseParam() {
        if (this.ts.isKeyword('extends') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            this.baseIDName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('uuid') === true) {
            this.element.uuid = true;
            this.ts.readToken();
        }
    }
    parseContent() {
        const keyColl = {
            uom: this.parseUom,
            spec: this.parseSpec,
            prop: this.parseProp,
            // assign: this.parseAssign,
            // state: this.parseState,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false)
            ok = false;
        if (this.baseIDName !== undefined) {
            let atom = this.scanAtom(space, this.baseIDName);
            if (atom === undefined) {
                ok = false;
            }
            else {
                this.element.base = atom;
            }
        }
        if (this.specName !== undefined) {
            let spec = this.scanSpec(space, this.specName);
            if (spec === undefined) {
                ok = false;
            }
            else {
                this.element.spec = spec;
            }
        }
        this.element.setUom();
        /*
        let { uom: metric } = this.element;
        if (metric !== undefined) {
            if (metric !== '*') {
                let enm = space.getEnum('metrictype');
                if (enm === undefined) {
                    this.log('Enum MetricType is not defined');
                    ok = false;
                }
                else {
                    let { keyValues } = enm;
                    let value = keyValues[metric];
                    if (value === undefined) {
                        this.log(`Enum MetricType has not '${metric}'`);
                        ok = false;
                    }
                }
            }
        }
        */
        return ok;
    }
}
exports.PBizAtom = PBizAtom;
class PBizAtomState extends Base_1.PBizBase {
    get defaultName() {
        return undefined;
    }
}
exports.PBizAtomState = PBizAtomState;
//# sourceMappingURL=Atom.js.map
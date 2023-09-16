"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizSpec = void 0;
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
        // this.element.buildFields();
        return ok;
    }
}
exports.PBizSpec = PBizSpec;
//# sourceMappingURL=Spec.js.map
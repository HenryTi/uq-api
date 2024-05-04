"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizRole = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizRole extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.roleNames = [];
        this.parseRole = () => {
            let name = this.ts.passVar();
            if (this.roleNames.includes(name) === true) {
                this.ts.error(`duplicate '${name}'`);
            }
            this.roleNames.push(name);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            role: this.parseRole,
            permit: this.parseRole,
        };
    }
    scan(space) {
        let ok = true;
        let roles = [];
        if (this.checkRecursive(space, this.element, roles) === false)
            ok = false;
        let { bizEntities: bizes } = space.uq.biz;
        for (let name of this.roleNames) {
            let bizBase = bizes.get(name);
            if (bizBase === undefined || bizBase.bizPhraseType !== il_1.BizPhraseType.permit) {
                this.log(`'${name}' is not a PERMIT`);
                ok = false;
            }
            else {
                this.element.roles.set(name, bizBase);
            }
        }
        for (let [, value] of this.element.roles) {
            let roles = [];
            if (this.checkRecursive(space, value, roles) === false)
                ok = false;
        }
        return ok;
    }
    checkRecursive(space, me, roles) {
        let ok = true;
        if (roles.includes(me) === true) {
            this.log(`'${me.name}' is recursively used`);
            return false;
        }
        else {
            roles.push(me);
        }
        for (let [, value] of me.roles) {
            if (this.checkRecursive(space, value, roles) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizRole = PBizRole;
//# sourceMappingURL=Role.js.map
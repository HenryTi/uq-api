"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRole = void 0;
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PRole extends entity_1.PEntity {
    _parse() {
        this.entity.name = '$role';
        this.entity.jName = '$Role';
        this.parseVersion();
        function checkOwnerAdmin(name) {
            switch (name) {
                case 'admin':
                case 'owner':
                    this.ts.error('admin or owner can not be role name');
                    break;
            }
        }
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        let { names } = this.entity;
        let { $ } = names;
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.error('应该是 role 的名称');
            }
            let roleName = this.ts.lowerVar;
            checkOwnerAdmin(roleName);
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                let subs = names[roleName];
                if (!subs) {
                    names[roleName] = subs = new Set();
                }
                else if ($.has(roleName) === true) {
                    this.ts.error(`duplicate role '${roleName}`);
                }
                this.ts.readToken();
                let subName;
                for (;;) {
                    if (this.ts.token !== tokens_1.Token.VAR) {
                        this.ts.expectToken(tokens_1.Token.VAR);
                    }
                    subName = this.ts.lowerVar;
                    checkOwnerAdmin(subName);
                    if (subs.has(subName) === true) {
                        this.ts.error(`duplicate role '${subName}`);
                    }
                    subs.add(subName);
                    this.ts.readToken();
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
                    this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                }
            }
            else {
                if ($.has(roleName) === true) {
                    this.ts.error(`duplicate role '${roleName}`);
                }
                $.add(roleName);
            }
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
                continue;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PRole = PRole;
//# sourceMappingURL=role.js.map
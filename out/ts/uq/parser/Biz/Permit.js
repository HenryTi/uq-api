"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizRole = exports.PBizPermit = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizPermit extends Base_1.PBizBase {
    constructor() {
        super(...arguments);
        this.permits = {};
    }
    get defaultName() { return undefined; }
    parseContent() {
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR)
                break;
            if (this.ts.varBrace === true)
                break;
            switch (this.ts.lowerVar) {
                default:
                    this.ts.expect('permit', 'item');
                    break;
                case 'item':
                    this.parseItem();
                    continue;
                case 'permit':
                    this.parsePermit();
                    continue;
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
    }
    parseItem() {
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR)
            this.expectToken(tokens_1.Token.VAR);
        let { lowerVar: name, _var: jName } = this.ts;
        this.ts.readToken();
        let { items } = this.element;
        if (items.has(name) === true) {
            this.ts.error(`duplicate '${name}'`);
        }
        let caption = this.ts.mayPassVar();
        if (caption === undefined) {
            if (jName !== name)
                caption = jName;
        }
        items.set(name, {
            permit: this.element,
            name,
            caption,
            phrase: undefined,
        });
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parsePermit() {
        this.ts.readToken();
        let name = this.ts.passVar();
        this.permits[name] = true;
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        let permits = [];
        if (this.checkRecursive(space, this.element, permits) === false)
            ok = false;
        let { bizEntities: bizes } = space.uq.biz;
        for (let i in this.permits) {
            let name = i; // this.permits[i];
            let bizBase = bizes.get(name);
            if (bizBase === undefined || bizBase.type !== 'permit') {
                this.log(`'${name}' is not a permit`);
                ok = false;
            }
            else {
                this.element.permits.set(name, bizBase);
            }
        }
        for (let [, value] of this.element.permits) {
            let permits = [];
            if (this.checkRecursive(space, value, permits) === false)
                ok = false;
        }
        return ok;
    }
    checkRecursive(space, me, permits) {
        let ok = true;
        if (permits.includes(me) === true) {
            this.log(`'${me.name}' is recursively used`);
            return false;
        }
        else {
            permits.push(me);
        }
        for (let [, value] of me.permits) {
            if (this.checkRecursive(space, value, permits) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizPermit = PBizPermit;
class PBizRole extends Base_1.PBizBase {
    constructor() {
        super(...arguments);
        this.withs = [];
        this.roleNames = [];
    }
    get defaultName() { return undefined; }
    parseContent() {
        for (;;) {
            if (this.ts.varBrace === true)
                break;
            if (this.ts.token !== tokens_1.Token.VAR)
                break;
            let key = this.ts.passKey();
            switch (key) {
                default:
                    this.ts.expect('permit', 'role');
                    break;
                case 'permit':
                    this.parsePermit();
                    break;
                case 'role':
                    this.parseRole();
                    break;
            }
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        }
    }
    parsePermit() {
        let name = this.ts.passVar();
        let index = this.withs.findIndex(v => v.name === name);
        if (index >= 0) {
            this.ts.error(`duplicate '${name}'`);
        }
        let subs;
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            subs = [];
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                let sub = this.ts.passVar();
                subs.push(sub);
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                this.ts.passToken(tokens_1.Token.RPARENTHESE);
                break;
            }
        }
        this.withs.push({ name, subs });
    }
    parseRole() {
        let name = this.ts.passVar();
        if (this.roleNames.includes(name) === true) {
            this.ts.error(`duplicate '${name}'`);
        }
        this.roleNames.push(name);
    }
    scan(space) {
        let ok = true;
        let roles = [];
        if (this.checkRecursive(space, this.element, roles) === false)
            ok = false;
        let { bizEntities: bizes } = space.uq.biz;
        for (let name of this.roleNames) {
            let bizBase = bizes.get(name);
            if (bizBase === undefined || bizBase.type !== 'role') {
                this.log(`'${name}' is not a role`);
                ok = false;
            }
            else {
                this.element.roles.set(name, bizBase);
            }
        }
        for (let { name, subs } of this.withs) {
            let bizBase = bizes.get(name);
            if (bizBase === undefined || bizBase.type !== 'permit') {
                this.log(`'${name}' is not a permit`);
                ok = false;
                continue;
            }
            let bizPermit = bizBase;
            if (subs === undefined || subs.length === 0) {
                this.element.permits.set(name, bizPermit);
            }
            else {
                for (let sub of subs) {
                    let bizPermitItem = bizPermit.items.get(sub);
                    if (bizPermitItem === undefined) {
                        this.log(`'${sub}' is not in '${name}'`);
                        ok = false;
                        continue;
                    }
                    this.element.permitItems.set(`${name}.${sub}`, bizPermitItem);
                }
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
//# sourceMappingURL=Permit.js.map
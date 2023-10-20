"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizRole = exports.PBizPermitItem = exports.PBizPermit = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
class PBizPermit extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.permits = {};
        /*
        protected parseContent(): void {
            for (; ;) {
                if (this.ts.token !== Token.VAR) break;
                if (this.ts.varBrace === true) break;
                switch (this.ts.lowerVar) {
                    default: this.ts.expect('permit', 'item'); break;
                    case 'item': this.parseItem(); continue;
                    case 'permit': this.parsePermit(); continue;
                }
                this.ts.passToken(Token.SEMICOLON);
            }
        }
        */
        this.parseItem = () => {
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
            let permitItem = new il_1.BizPermitItem(this.element.biz, name, caption);
            items.set(name, permitItem);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.parsePermit = () => {
            let name = this.ts.passVar();
            this.permits[name] = true;
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            item: this.parseItem,
            permit: this.parsePermit,
        };
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
class PBizPermitItem extends Bud_1.PBizBud {
}
exports.PBizPermitItem = PBizPermitItem;
class PBizRole extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        // private readonly permitNames: string[] = [];
        this.roleNames = [];
        /*
        private parsePermit = () => {
            let name = this.ts.passVar();
            let index = this.permitNames.findIndex(v => v === name);
            if (index >= 0) {
                this.ts.error(`duplicate '${name}'`);
            }
            this.permitNames.push(name);
            this.ts.passToken(Token.SEMICOLON);
        }
        */
        this.parseRole = () => {
            let name = this.ts.passVar();
            if (this.roleNames.includes(name) === true) {
                this.ts.error(`duplicate '${name}'`);
            }
            this.roleNames.push(name);
            this.ts.passToken(tokens_1.Token.SEMICOLON);
        };
        this.keyColl = {
            // permit: this.parsePermit,
            role: this.parseRole,
        };
    }
    /*
    protected parseContent(): void {
        for (; ;) {
            if (this.ts.varBrace === true) break;
            if (this.ts.token !== Token.VAR) break;
            let key = this.ts.passKey();
            switch (key) {
                default: this.ts.expect('permit', 'role'); break;
                case 'permit': this.parsePermit(); break;
                case 'role': this.parseRole(); break;
            }
            this.ts.passToken(Token.SEMICOLON);
        }
    }
    */
    parseContent() {
        super.parseContent();
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
        /*
        for (let permitName of this.permitNames) {
            let bizBase = bizes.get(permitName);
            if (bizBase === undefined || bizBase.type !== 'permit') {
                this.log(`'${permitName}' is not a permit`);
                ok = false;
                continue;
            }
            let bizPermit = bizBase as BizPermit;
            this.element.permits.set(permitName, bizPermit);
        }
        */
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
import { BizPermit, BizPermitItem, BizRole, Uq } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";
import { PBizBud } from "./Bud";

export class PBizPermit<P extends BizPermit> extends PBizEntity<P> {
    private readonly permits: { [key: string]: boolean } = {};

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

    private parseItem = () => {
        if (this.ts.token !== Token.VAR) this.expectToken(Token.VAR);
        let { lowerVar: name, _var: jName } = this.ts;
        this.ts.readToken();
        let { items } = this.element;
        if (items.has(name) === true) {
            this.ts.error(`duplicate '${name}'`);
        }
        let caption = this.ts.mayPassVar();
        if (caption === undefined) {
            if (jName !== name) caption = jName;
        }
        let permitItem = new BizPermitItem(name, caption);
        items.set(name, permitItem);
        this.ts.passToken(Token.SEMICOLON);
    }

    private parsePermit = () => {
        let name = this.ts.passVar();
        this.permits[name] = true;
        this.ts.passToken(Token.SEMICOLON);
    }

    protected readonly keyColl = {
        item: this.parseItem,
        permit: this.parsePermit,
    }

    scan(space: Space): boolean {
        let ok = true;
        let permits: BizPermit[] = [];
        if (this.checkRecursive(space, this.element, permits) === false) ok = false;
        let { bizEntities: bizes } = space.uq.biz;

        for (let i in this.permits) {
            let name = i; // this.permits[i];
            let bizBase = bizes.get(name);
            if (bizBase === undefined || bizBase.type !== 'permit') {
                this.log(`'${name}' is not a permit`);
                ok = false;
            }
            else {
                this.element.permits.set(name, bizBase as BizPermit);
            }
        }

        for (let [, value] of this.element.permits) {
            let permits: BizPermit[] = [];
            if (this.checkRecursive(space, value, permits) === false) ok = false;
        }
        return ok;
    }

    private checkRecursive(space: Space, me: BizPermit, permits: BizPermit[]): boolean {
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

export class PBizPermitItem extends PBizBud<BizPermitItem> {
}

export class PBizRole<P extends BizRole> extends PBizEntity<P> {
    // private readonly permitNames: string[] = [];
    private readonly roleNames: string[] = [];
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
    protected override parseContent(): void {
        super.parseContent();
    }
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
    private parseRole = () => {
        let name = this.ts.passVar();
        if (this.roleNames.includes(name) === true) {
            this.ts.error(`duplicate '${name}'`);
        }
        this.roleNames.push(name);
        this.ts.passToken(Token.SEMICOLON);
    }

    protected readonly keyColl = {
        // permit: this.parsePermit,
        role: this.parseRole,
    }

    scan(space: Space): boolean {
        let ok = true;
        let roles: BizRole[] = [];
        if (this.checkRecursive(space, this.element, roles) === false) ok = false;
        let { bizEntities: bizes } = space.uq.biz;

        for (let name of this.roleNames) {
            let bizBase = bizes.get(name);
            if (bizBase === undefined || bizBase.type !== 'role') {
                this.log(`'${name}' is not a role`);
                ok = false;
            }
            else {
                this.element.roles.set(name, bizBase as BizRole);
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
            let roles: BizRole[] = [];
            if (this.checkRecursive(space, value, roles) === false) ok = false;
        }
        return ok;
    }

    private checkRecursive(space: Space, me: BizRole, roles: BizRole[]): boolean {
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

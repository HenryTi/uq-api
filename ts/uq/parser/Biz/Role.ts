import { BizRole } from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizRole<P extends BizRole> extends PBizEntity<P> {
    private readonly roleNames: string[] = [];
    private parseRole = () => {
        let name = this.ts.passVar();
        if (this.roleNames.includes(name) === true) {
            this.ts.error(`duplicate '${name}'`);
        }
        this.roleNames.push(name);
        this.ts.passToken(Token.SEMICOLON);
    }

    protected readonly keyColl = {
        role: this.parseRole,
        permit: this.parseRole,
    }

    scan(space: Space): boolean {
        let ok = true;
        let roles: BizRole[] = [];
        if (this.checkRecursive(space, this.element, roles) === false) ok = false;
        let { bizEntities: bizes } = space.uq.biz;

        for (let name of this.roleNames) {
            let bizBase = bizes.get(name);
            if (bizBase === undefined || bizBase.bizPhraseType !== BizPhraseType.permit) {
                this.log(`'${name}' is not a PERMIT`);
                ok = false;
            }
            else {
                this.element.roles.set(name, bizBase as BizRole);
            }
        }
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

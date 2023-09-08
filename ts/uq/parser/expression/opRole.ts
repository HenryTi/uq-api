import { OpRole, ValueExpression } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class POpRole extends PElement {
    private readonly opRole: OpRole;
    constructor(opRole: OpRole, context: PContext) {
        super(opRole, context);
        this.opRole = opRole;
    }
    _parse() {
        if (this.ts.token !== Token.VAR) {
            this.ts.expect('Role name');
        }
        this.opRole.role = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR as any) {
                this.ts.expect('sub role name')
            }
            this.opRole.roleSub = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
        }
        let valUnit = new ValueExpression();
        valUnit.parser(this.context).parse();
        this.opRole.unit = valUnit;
        if (this.ts.token as any !== Token.RPARENTHESE) {
            this.ts.expectToken(Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space: Space): boolean {
        let ok: boolean = true;
        let { unit, role, roleSub } = this.opRole;
        if (unit.pelement.scan(space) === false) {
            ok = false;
        }
        if (this.isEqu(role, 'admin')) {
            return ok;
        }
        if (this.isEqu(role, 'owner')) {
            return ok;
        }
        let roleObj = space.getRole();
        if (!roleObj) {
            this.log('no role defined');
            ok = false;
        }
        else if (roleObj.isValid(role, roleSub) === false) {
            ok = false;
            this.log(`unknown role "${role}.${roleSub}"`);
        }
        return ok;
    }

    private isEqu(s1: string, s2: string) {
        return s1.localeCompare(s2, undefined, { sensitivity: 'base' }) === 0;
    }
}

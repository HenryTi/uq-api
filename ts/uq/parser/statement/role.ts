import { Space } from '../space';
import { RoleStatement, ValueExpression } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';
import { Token } from '../tokens';

export class PRoleStatement extends PStatement {
    protected roleStatement: RoleStatement;
    private roleVal: ValueExpression[];
    constructor(roleStatement: RoleStatement, context: PContext) {
        super(roleStatement, context);
        this.roleStatement = roleStatement;
    }

    protected _parse() {
        this.parseSite();

        if (this.ts.isKeyword('user') === true) {
            this.parseUser();
            return;
        }
        this.parseAction();
        if (this.roleStatement.action === 'clear') {
            this.ts.error('ROLE Owner Admin can not clear');
        }
        if (this.ts.isKeyword('owner') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
                let valOwner = new ValueExpression();
                valOwner.parser(this.context).parse();
                this.roleStatement.valOwner = valOwner;
            }
            else {
                if (this.roleStatement.action === 'add') {
                    this.ts.expectToken(Token.EQU);
                }
                else {
                    this.roleStatement.valOwner = null;
                }
            }
        }
        else if (this.ts.isKeyword('admin') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.EQU) {
                this.ts.expectToken(Token.EQU);
            }
            this.ts.readToken();
            let valAdmin = new ValueExpression();
            valAdmin.parser(this.context).parse();
            this.roleStatement.valAdmin = valAdmin;
            this.parseSet();
        }
        else {
            this.ts.expect('owner', 'admin');
        }
    }

    protected parseSite() {
        if (this.ts.isKeyword('site') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.EQU) {
                this.ts.readToken();
            }
            this.ts.readToken();
            let valSite = new ValueExpression();
            valSite.parser(this.context).parse();
            this.roleStatement.valSite = valSite;
        }
    }

    private parseUser() {
        this.ts.readToken();
        this.ts.passToken(Token.EQU);
        let valUser = new ValueExpression();
        valUser.parser(this.context).parse();
        this.roleStatement.valUser = valUser;
        if (this.ts.isKeyword('set') === true) {
            this.parseSet();
            this.roleStatement.action = 'add';
            return;
        }
        this.parseAction();
        switch (this.roleStatement.action) {
            case 'add':
            case 'del':
                this.parseRoleName();
                this.parseSet();
                break;
        }
    }

    protected parseRoleName() {
        if (this.ts.token === Token.LPARENTHESE) {
            this.roleVal = [];
            this.ts.readToken();
            for (; ;) {
                let roleVal = new ValueExpression();
                roleVal.parser(this.context).parse();
                this.roleVal.push(roleVal);
                let { token } = this.ts;
                if (token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.RPARENTHESE, Token.COMMA);
            }
            return;
        }
        if (this.ts.token !== Token.VAR) {
            this.ts.expectToken(Token.VAR);
        }
        switch (this.ts.lowerVar) {
            case 'admin':
                this.roleStatement.isAdmin = true;
                this.ts.readToken();
                break;
            case 'owner':
                this.roleStatement.isOwner = true;
                this.ts.readToken();
                break;
            default:
                this.ts.expect('admin', 'owner');
                break;
        }
    }

    private parseAction() {
        let action: 'add' | 'del' | 'clear' | 'assert';
        if (this.ts.isKeyword('add') === true) {
            action = 'add'
        }
        else if (this.ts.isKeywords('del', 'delete') === true) {
            action = 'del'
        }
        else if (this.ts.isKeyword('clear') === true) {
            action = 'clear'
        }
        else {
            this.ts.expect('add', 'del', 'clear', 'assert');
        }
        this.ts.readToken();
        this.roleStatement.action = action;
    }

    private parseSet() {
        if (this.ts.isKeyword('set') === false) {
            return;
        }
        this.ts.readToken();
        this.ts.passKey('assigned');
        this.ts.passToken(Token.EQU);
        this.roleStatement.valAssigned = this.context.parse(ValueExpression);
    }

    scan(space: Space): boolean {
        let ok = true;
        let { action, valSite, valUser, valAdmin, valOwner, valAssigned } = this.roleStatement;
        if (this.roleVal) {
            for (let rv of this.roleVal) {
                if (rv.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            this.roleStatement.roles = this.roleVal;
        }
        if (valSite) {
            if (valSite.pelement.scan(space) === false) ok = false;
        }
        if (valUser) {
            if (valUser.pelement.scan(space) === false) ok = false;
        }
        if (valAdmin) {
            if (valAdmin.pelement.scan(space) === false) ok = false;
        }
        if (valOwner) {
            if (valOwner.pelement.scan(space) === false) ok = false;
        }
        if (valAssigned) {
            if (valAssigned.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}

export class PAssertRoleStatement extends PRoleStatement {
    protected _parse() {
        this.roleStatement.action = 'assert';
        if (this.ts.isKeyword('site') === true) {
            this.parseSite();
            this.parseRoleName();
        }
        else {
            this.parseRoleName();
            this.parseSite();
        }
    }
}

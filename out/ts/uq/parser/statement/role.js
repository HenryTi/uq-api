"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAssertRoleStatement = exports.PRoleStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
const tokens_1 = require("../tokens");
class PRoleStatement extends statement_1.PStatement {
    constructor(roleStatement, context) {
        super(roleStatement, context);
        this.roleStatement = roleStatement;
    }
    _parse() {
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
            if (this.ts.token === tokens_1.Token.EQU) {
                this.ts.readToken();
                let valOwner = new il_1.ValueExpression();
                valOwner.parser(this.context).parse();
                this.roleStatement.valOwner = valOwner;
            }
            else {
                if (this.roleStatement.action === 'add') {
                    this.ts.expectToken(tokens_1.Token.EQU);
                }
                else {
                    this.roleStatement.valOwner = null;
                }
            }
        }
        else if (this.ts.isKeyword('admin') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.EQU) {
                this.ts.expectToken(tokens_1.Token.EQU);
            }
            this.ts.readToken();
            let valAdmin = new il_1.ValueExpression();
            valAdmin.parser(this.context).parse();
            this.roleStatement.valAdmin = valAdmin;
            this.parseSet();
        }
        else {
            this.ts.expect('owner', 'admin');
        }
    }
    parseSite() {
        if (this.ts.isKeyword('site') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.EQU) {
                this.ts.readToken();
            }
            this.ts.readToken();
            let valSite = new il_1.ValueExpression();
            valSite.parser(this.context).parse();
            this.roleStatement.valSite = valSite;
        }
    }
    parseUser() {
        this.ts.readToken();
        this.ts.passToken(tokens_1.Token.EQU);
        let valUser = new il_1.ValueExpression();
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
    parseRoleName() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.roleVal = [];
            this.ts.readToken();
            for (;;) {
                let roleVal = new il_1.ValueExpression();
                roleVal.parser(this.context).parse();
                this.roleVal.push(roleVal);
                let { token } = this.ts;
                if (token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
            }
            return;
        }
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expectToken(tokens_1.Token.VAR);
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
    parseAction() {
        let action;
        if (this.ts.isKeyword('add') === true) {
            action = 'add';
        }
        else if (this.ts.isKeywords('del', 'delete') === true) {
            action = 'del';
        }
        else if (this.ts.isKeyword('clear') === true) {
            action = 'clear';
        }
        else {
            this.ts.expect('add', 'del', 'clear', 'assert');
        }
        this.ts.readToken();
        this.roleStatement.action = action;
    }
    parseSet() {
        if (this.ts.isKeyword('set') === false) {
            return;
        }
        this.ts.readToken();
        this.ts.passKey('assigned');
        this.ts.passToken(tokens_1.Token.EQU);
        this.roleStatement.valAssigned = this.context.parse(il_1.ValueExpression);
    }
    scan(space) {
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
            if (valSite.pelement.scan(space) === false)
                ok = false;
        }
        if (valUser) {
            if (valUser.pelement.scan(space) === false)
                ok = false;
        }
        if (valAdmin) {
            if (valAdmin.pelement.scan(space) === false)
                ok = false;
        }
        if (valOwner) {
            if (valOwner.pelement.scan(space) === false)
                ok = false;
        }
        if (valAssigned) {
            if (valAssigned.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PRoleStatement = PRoleStatement;
class PAssertRoleStatement extends PRoleStatement {
    _parse() {
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
exports.PAssertRoleStatement = PAssertRoleStatement;
//# sourceMappingURL=role.js.map
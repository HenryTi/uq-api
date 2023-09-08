"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSendStatement = void 0;
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const statement_1 = require("./statement");
const __1 = require("..");
const messages = ['email', 'sms'];
const methods = [...messages, 'app'];
class PSendStatement extends statement_1.PStatement {
    constructor(sendStatement, context) {
        super(sendStatement, context);
        this.sendStatement = sendStatement;
    }
    _parse() {
        let { token, varBrace, lowerVar } = this.ts;
        if (token !== tokens_1.Token.VAR || varBrace === true) {
            this.ts.expect('keywords' + methods.join(', '));
        }
        if (lowerVar === 'app') {
            this.ts.readToken();
            this.parseSendApp(this.sendStatement.send = new il_1.SendAppStatement(undefined));
            return;
        }
        let isUser = false;
        if (token === tokens_1.Token.VAR && varBrace === false && lowerVar === 'user') {
            isUser = true;
            this.ts.readToken();
            token = this.ts.token;
            varBrace = this.ts.varBrace;
            lowerVar = this.ts.lowerVar;
        }
        if (token !== tokens_1.Token.VAR || varBrace === true) {
            this.ts.expect(messages.join(', '));
        }
        let sendMsg;
        switch (lowerVar) {
            default:
                this.ts.expect(messages.join(', '));
                break;
            case 'email':
                sendMsg = new il_1.SendEmailStatement(undefined);
                break;
            case 'sms':
                sendMsg = new il_1.SendSmsStatement(undefined);
                break;
        }
        sendMsg.isUser = isUser;
        this.sendStatement.send = sendMsg; //lowerVar as any;
        this.ts.readToken();
        this.parseSendMsg(sendMsg);
    }
    parseSendMsg(sendMsg) {
        if (this.ts.isKeyword('on') === false) {
            this.ts.expect('on');
        }
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expect('templet name');
        }
        sendMsg.templet = this.ts.lowerVar;
        this.ts.readToken();
        for (;;) {
            if (this.ts.isKeyword('to') === true) {
                if (sendMsg.to !== undefined) {
                    this.ts.error('duplicate to in send');
                }
                this.ts.readToken();
                let to = new il_1.ValueExpression();
                to.parser(this.context).parse();
                sendMsg.to = to;
            }
            else if (this.ts.isKeyword('cc') === true) {
                if (sendMsg.cc !== undefined) {
                    this.ts.error('duplicate cc in send');
                }
                this.ts.readToken();
                let cc = new il_1.ValueExpression();
                cc.parser(this.context).parse();
                sendMsg.cc = cc;
            }
            else if (this.ts.isKeyword('bcc') === true) {
                if (sendMsg.bcc !== undefined) {
                    this.ts.error('duplicate bcc in send');
                }
                this.ts.readToken();
                let bcc = new il_1.ValueExpression();
                bcc.parser(this.context).parse();
                sendMsg.bcc = bcc;
            }
            else {
                break;
            }
        }
        if (this.ts.isKeyword('with') === true) {
            this.ts.readToken();
            let sendWith = sendMsg.with = {};
            for (;;) {
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expect('parameter name');
                }
                let pName = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.EQU) {
                    this.ts.expectToken(tokens_1.Token.EQU);
                }
                this.ts.readToken();
                let val = new il_1.ValueExpression();
                val.parser(this.context).parse();
                sendWith[pName] = val;
                let { token } = this.ts;
                if (token === tokens_1.Token.SEMICOLON) {
                    this.ts.readToken();
                    break;
                }
                if (token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
            }
        }
        else {
            this.ts.assertToken(tokens_1.Token.SEMICOLON);
            this.ts.readToken();
        }
    }
    parseSendApp(sendApp) {
        let appVal = sendApp.app = new il_1.ValueExpression();
        appVal.parser(this.context).parse();
        if (this.ts.varBrace === true) {
            this.ts.expect('keyword');
        }
        switch (this.ts.lowerVar) {
            default:
                this.ts.expect('add', 'remove');
                break;
            case 'add':
                sendApp.action = 'add';
                this.ts.readToken();
                break;
            case 'del':
            case 'delete':
            case 'remove':
                sendApp.action = 'remove';
                this.ts.readToken();
                break;
        }
        let userVal = sendApp.user = new il_1.ValueExpression();
        userVal.parser(this.context).parse();
        this.ts.assertToken(tokens_1.Token.SEMICOLON);
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let { send, no } = this.sendStatement;
        send.no = no;
        switch (send.type) {
            default: return false;
            case 'sendMsg':
                if (this.scanSendMsg(space, send) === false)
                    ok = false;
                break;
            case 'sendApp':
                if (this.scanSendApp(space, send) === false)
                    ok = false;
                break;
        }
        let actionBase = space.getActionBase();
        if (actionBase) {
            if (actionBase.type === 'accept') {
                let varOperand = new il_1.VarOperand();
                varOperand._var = ['$importing'];
                varOperand.pelement = new __1.PVarOperand(varOperand, this.context);
                let exp = new il_1.ValueExpression();
                exp.atoms = [varOperand];
                exp.pelement = new __1.PValueExpression(exp, this.context);
                this.sendStatement.send.importing = exp;
                if (exp.pelement.scan(space) === false)
                    ok = false;
            }
        }
        return ok;
    }
    scanSendMsg(space, sendMsg) {
        let ok = true;
        let { templet, to, cc, bcc, with: sendWith } = sendMsg;
        let temp = space.getEntity(templet);
        if (temp === undefined || temp.type !== 'templet') {
            ok = false;
            this.log(`templet ${templet} not exists`);
            temp = undefined;
        }
        if (to === undefined) {
            this.log('to not exists in send');
            ok = false;
        }
        else if (to.pelement.scan(space) === false) {
            ok = false;
        }
        if (cc !== undefined) {
            if (cc.pelement.scan(space) === false)
                ok = false;
        }
        if (bcc !== undefined) {
            if (bcc.pelement.scan(space) === false)
                ok = false;
        }
        if (sendWith !== undefined && temp !== undefined) {
            for (let i in sendWith) {
                let val = sendWith[i];
                if (temp.params.indexOf(i) < 0) {
                    ok = false;
                    this.log(`${i} is not a templet parameter`);
                }
                if (val !== undefined) {
                    if (val.pelement.scan(space) === false)
                        ok = false;
                }
            }
        }
        return ok;
    }
    scanSendApp(space, sendApp) {
        let ok = true;
        let { user, app } = sendApp;
        if (user !== undefined) {
            if (user.pelement.scan(space) === false)
                ok = false;
        }
        if (app !== undefined) {
            if (app.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PSendStatement = PSendStatement;
//# sourceMappingURL=send.js.map
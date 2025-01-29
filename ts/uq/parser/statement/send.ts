import { Space } from '../space';
import { Token } from '../tokens';
import { ValueExpression, SendStatement, Templet, SendEmailStatement, SendSmsStatement, SendMsgStatement, SendAppStatement, VarOperand } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';
import { PValueExpression, PVarOperand } from '..';

const messages = ['email', 'sms'];
const methods = [...messages, 'app'];

export class PSendStatement extends PStatement {
    sendStatement: SendStatement;
    constructor(sendStatement: SendStatement, context: PContext) {
        super(sendStatement, context);
        this.sendStatement = sendStatement;
    }
    protected _parse() {
        let { token, varBrace, lowerVar } = this.ts;
        if (token !== Token.VAR || varBrace === true) {
            this.ts.expect('keywords' + methods.join(', '));
        }
        if (lowerVar === 'app') {
            this.ts.readToken();
            this.parseSendApp(this.sendStatement.send = new SendAppStatement(undefined));
            return;
        }

        let isUser = false;
        if (token === Token.VAR && varBrace === false && lowerVar === 'user') {
            isUser = true;
            this.ts.readToken();
            token = this.ts.token;
            varBrace = this.ts.varBrace;
            lowerVar = this.ts.lowerVar;
        }

        if (token !== Token.VAR || varBrace === true) {
            this.ts.expect(messages.join(', '));
        }

        let sendMsg: SendMsgStatement;
        switch (lowerVar) {
            default:
                this.ts.expect(messages.join(', '));
                break;
            case 'email':
                sendMsg = new SendEmailStatement(undefined);
                break;
            case 'sms':
                sendMsg = new SendSmsStatement(undefined);
                break;
        }
        sendMsg.isUser = isUser;
        this.sendStatement.send = sendMsg; //lowerVar as any;
        this.ts.readToken();
        this.parseSendMsg(sendMsg);
    }

    private parseSendMsg(sendMsg: SendMsgStatement) {
        if (this.ts.isKeyword('on') === false) {
            this.ts.expect('on');
        }
        this.ts.readToken();
        if (this.ts.token !== Token.VAR) {
            this.ts.expect('templet name');
        }
        sendMsg.templet = this.ts.lowerVar;
        this.ts.readToken();

        for (; ;) {
            if (this.ts.isKeyword('to') === true) {
                if (sendMsg.to !== undefined) {
                    this.ts.error('duplicate to in send');
                }
                this.ts.readToken();
                let to = new ValueExpression();
                to.parser(this.context).parse();
                sendMsg.to = to;
            }
            else if (this.ts.isKeyword('cc') === true) {
                if (sendMsg.cc !== undefined) {
                    this.ts.error('duplicate cc in send');
                }
                this.ts.readToken();
                let cc = new ValueExpression();
                cc.parser(this.context).parse();
                sendMsg.cc = cc;
            }
            else if (this.ts.isKeyword('bcc') === true) {
                if (sendMsg.bcc !== undefined) {
                    this.ts.error('duplicate bcc in send');
                }
                this.ts.readToken();
                let bcc = new ValueExpression();
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
            for (; ;) {
                if (this.ts.token !== Token.VAR) {
                    this.ts.expect('parameter name');
                }
                let pName = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token !== Token.EQU) {
                    this.ts.expectToken(Token.EQU);
                }
                this.ts.readToken();
                let val = new ValueExpression();
                val.parser(this.context).parse();
                sendWith[pName] = val;
                let { token } = this.ts;
                if (token === Token.SEMICOLON) {
                    this.ts.readToken();
                    break;
                }
                if (token === Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
            }
        }
        else {
            this.ts.assertToken(Token.SEMICOLON);
            this.ts.readToken();
        }
    }

    private parseSendApp(sendApp: SendAppStatement) {
        let appVal = sendApp.app = new ValueExpression();
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
        let userVal = sendApp.user = new ValueExpression();
        userVal.parser(this.context).parse();
        this.ts.assertToken(Token.SEMICOLON);
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let ok = true;
        let { send, no } = this.sendStatement;
        send.no = no;
        switch (send.type) {
            default: return false;
            case 'sendMsg':
                if (this.scanSendMsg(space, send as SendMsgStatement) === false) ok = false;
                break;
            case 'sendApp':
                if (this.scanSendApp(space, send as SendAppStatement) === false) ok = false;
                break;
        }
        let actionBase = space.getActionBase();
        if (actionBase) {
            if (actionBase.type === 'accept') {
                let varOperand = new VarOperand();
                varOperand._var = ['$importing'];
                varOperand.pelement = new PVarOperand(varOperand, this.context);
                let exp = new ValueExpression();
                exp.add(varOperand);
                exp.pelement = new PValueExpression(exp, this.context);
                this.sendStatement.send.importing = exp;
                if (exp.pelement.scan(space) === false) ok = false;
            }
        }
        return ok;
    }

    private scanSendMsg(space: Space, sendMsg: SendMsgStatement): boolean {
        let ok = true;
        let { templet, to, cc, bcc, with: sendWith } = sendMsg;
        let temp = space.getEntity(templet) as Templet;
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
            if (cc.pelement.scan(space) === false) ok = false;
        }
        if (bcc !== undefined) {
            if (bcc.pelement.scan(space) === false) ok = false;
        }
        if (sendWith !== undefined && temp !== undefined) {
            for (let i in sendWith) {
                let val = sendWith[i];
                if (temp.params.indexOf(i) < 0) {
                    ok = false;
                    this.log(`${i} is not a templet parameter`);
                }
                if (val !== undefined) {
                    if (val.pelement.scan(space) === false) ok = false;
                }
            }
        }
        return ok;
    }

    private scanSendApp(space: Space, sendApp: SendAppStatement): boolean {
        let ok = true;
        let { user, app } = sendApp;
        if (user !== undefined) {
            if (user.pelement.scan(space) === false) ok = false;
        }
        if (app !== undefined) {
            if (app.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}

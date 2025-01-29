"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PProcStatement = void 0;
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
const tokens_1 = require("../tokens");
const expression_1 = require("../expression");
class PProcStatement extends PStatement_1.PStatement {
    constructor(proc, context) {
        super(proc, context);
        this.proc = proc;
    }
    _parse() {
        if (this.ts.token === tokens_1.Token.VAR) {
            this.procName = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                let paramType = undefined;
                if (this.ts.isKeywordToken === true) {
                    switch (this.ts.lowerVar) {
                        default:
                            break;
                        case 'in':
                            this.ts.readToken();
                            paramType = il_1.ProcParamType.in;
                            break;
                        case 'to':
                        case 'out':
                            this.ts.readToken();
                            paramType = il_1.ProcParamType.out;
                            break;
                        case 'inout':
                            this.ts.readToken();
                            paramType = il_1.ProcParamType.inout;
                            break;
                    }
                }
                if (paramType === undefined) {
                    paramType = il_1.ProcParamType.in;
                }
                else if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.error('IN, TO, OUT, INOUT are keywords when calling PROC, can not be used as parameter');
                }
                let param = new il_1.ValueExpression();
                let paramParser = param.parser(this.context);
                paramParser.parse();
                this.proc.params.push({
                    paramType,
                    value: param,
                });
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
            }
        }
    }
    scan(space) {
        let ok = true;
        let { params } = this.proc;
        let expSpace = new expression_1.ExpressionSpace(space);
        if (this.procName !== undefined) {
            let procEntity = space.getEntity(this.procName);
            if (!procEntity || procEntity.type !== 'proc') {
                this.log(`${this.procName}必须是PROC`);
                return false;
            }
            let proc = this.proc.proc = procEntity;
            for (let ret of proc.returns.returns) {
                let retName = ret.name;
                let t = space.getTableVar(retName);
                if (!t) {
                    let ret = space.getReturn(retName);
                    if (!ret) {
                        this.log(`call proc ${this.procName}, there must be a local table ${retName}`);
                        ok = false;
                    }
                }
            }
            let len = params.length;
            if (len !== proc.fields.length) {
                this.log(`call proc ${this.procName} parameters count mismatch`);
                ok = false;
            }
            for (let i = 0; i < len; i++) {
                const { paramType, value } = params[i];
                if (value.pelement.scan(expSpace) === false)
                    ok = false;
                if (paramType === il_1.ProcParamType.inout || paramType === il_1.ProcParamType.out) {
                    const { atoms } = value;
                    let err = false;
                    if (atoms.length > 1) {
                        err = true;
                    }
                    else if (atoms[0].type !== 'var') {
                        err = true;
                    }
                    if (err === true) {
                        this.log('Proc param after to must be variable');
                        ok = false;
                    }
                    if (proc.fields[i].paramType !== paramType) {
                        this.log(`Proc param ${i} is not ${il_1.ProcParamType[paramType]}`);
                        ok = false;
                    }
                }
            }
        }
        else {
            if (params.length === 0) {
                this.log('PROC without proc name, the first parameter is the proc name');
                ok = false;
            }
        }
        return ok;
    }
}
exports.PProcStatement = PProcStatement;
//# sourceMappingURL=procStatement.js.map
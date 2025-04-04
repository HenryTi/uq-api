import { Space } from '../space';
import { ProcStatement, ValueExpression, Proc, ProcParamType } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';
import { Token } from '../tokens';
import { ExpressionSpace } from '../expression';

export class PProcStatement extends PStatement {
    proc: ProcStatement;
    private procName: string;
    constructor(proc: ProcStatement, context: PContext) {
        super(proc, context);
        this.proc = proc;
    }

    protected _parse() {
        if (this.ts.token === Token.VAR) {
            this.procName = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                let paramType: ProcParamType = undefined;
                if (this.ts.isKeywordToken === true) {
                    switch (this.ts.lowerVar) {
                        default:
                            break;
                        case 'in':
                            this.ts.readToken();
                            paramType = ProcParamType.in;
                            break;
                        case 'to':
                        case 'out':
                            this.ts.readToken();
                            paramType = ProcParamType.out;
                            break;
                        case 'inout':
                            this.ts.readToken();
                            paramType = ProcParamType.inout;
                            break;
                    }
                }
                if (paramType === undefined) {
                    paramType = ProcParamType.in;
                }
                else if (this.ts.token === Token.COMMA as any) {
                    this.ts.error('IN, TO, OUT, INOUT are keywords when calling PROC, can not be used as parameter');
                }
                let param = new ValueExpression();
                let paramParser = param.parser(this.context);
                paramParser.parse();
                this.proc.params.push({
                    paramType,
                    value: param,
                });
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token as any === Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
            }
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { params } = this.proc;
        let expSpace = new ExpressionSpace(space);
        if (this.procName !== undefined) {
            let procEntity = space.getEntity(this.procName);
            if (!procEntity || procEntity.type !== 'proc') {
                this.log(`${this.procName}必须是PROC`);
                return false;
            }
            let proc = this.proc.proc = procEntity as Proc;
            for (let ret of proc.returns.returns) {
                let retName = ret.name;
                let t = space.getTableVar(retName);
                if (!t) {
                    let ret = space.getReturn(retName);
                    if (!ret) {
                        this.log(`call proc ${this.procName}, there must be a local table ${retName}`)
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
                if (value.pelement.scan(expSpace) === false) ok = false;
                if (paramType === ProcParamType.inout || paramType === ProcParamType.out) {
                    // const { atoms } = value;
                    let err = (value.isVar() === false);
                    if (err === true) {
                        this.log('Proc param after to must be variable');
                        ok = false;
                    }
                    if (proc.fields[i].paramType !== paramType) {
                        this.log(`Proc param ${i} is not ${ProcParamType[paramType]}`);
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

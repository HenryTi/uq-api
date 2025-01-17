import {
    Act, ActionParamConvert, ActionStatement, Returns, Bus,
    Uq, NamePointer, Pointer, Proc, ProcParamType
} from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PActionBase, ActionBaseSpace, HasInBusSpace } from './entity';
import { ReturnsSpace } from './returns';

export class PActEntity<T extends Act> extends PActionBase<T> {
    protected _parse() {
        this.setName();
        this.parseProxyAuth();
        this.parseParams();
        this.parseConvert();
        this.parseInBuses(this.entity);
        let returns = this.entity.returns = new Returns();
        returns.parser(this.context, this.entity).parse();
        this.parseLog();
        let statement = new ActionStatement();
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
        this.entity.statement = statement;
        this.ts.mayPassToken(Token.SEMICOLON);
    }

    private parseConvert() {
        if (this.ts.token !== Token.VAR) return;
        if (this.ts.varBrace === true) return;
        if (this.ts.lowerVar !== 'convert') return;
        this.ts.readToken();
        if (this.ts.token !== Token.VAR || this.ts.varBrace as any === true) {
            this.expect('转换方式');
        }
        let pc: ActionParamConvert = {
        } as any;
        this.entity.paramConvert = pc;
        switch (this.ts.lowerVar as any) {
            default:
                this.expect('expression');
                break;
            case 'expression':
                pc.type = 'expression';
                this.ts.readToken();
                break;
        }
        let { lowerVar } = this.ts;
        if (lowerVar === undefined) {
            this.expect('convert parameter name');
        }
        pc.name = lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('to') === false) {
            this.expect('to');
        }
        this.ts.readToken();
        lowerVar = this.ts.lowerVar;
        if (lowerVar !== undefined) {
            pc.to = [lowerVar];
            this.ts.readToken();
        }
        else if (this.ts.token as any === Token.LPARENTHESE) {
            this.ts.readToken();
            pc.to = [];
            for (; ;) {
                lowerVar = this.ts.lowerVar;
                if (lowerVar === undefined) {
                    this.ts.expect('to list');
                }
                pc.to.push(lowerVar);
                this.ts.readToken();
                if (this.ts.token as any === Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            this.ts.expectToken(Token.LPARENTHESE);
        }
    }

    protected parseLog() {
    }

    private isNameExists(name: string): boolean {
        let { fields, arrs } = this.entity;
        if (fields && fields.find(v => v.name === name)
            || arrs && arrs.find(v => v.name === name)) {
            this.log('action ' + this.entity.name + ' convert parameter name ' + name + ' 重名');
            return true;
        }
        return false;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.scanProxyAuth(space) === false) {
            return false;
        }
        if (this.scanInBuses(space, this.entity) === false) {
            return false;
        }
        let { statement, paramConvert, fields, arrs, returns } = this.entity;

        let names = this.entity.nameUnique();
        if (names !== undefined) {
            ok = false;
            this.log('action ' + this.entity.name + ' 字段重名: ' + names.join(','));
        }
        if (paramConvert !== undefined) {
            let { name: pcName, to } = paramConvert;
            if (this.isNameExists(pcName) === true) ok = false;
            for (let t of to) {
                if (this.isNameExists(t) === true) ok = false;
            }
        }

        if (statement === undefined) {
            this.log('action ' + this.entity.name + ' 没有定义语句');
            ok = false;
        }
        this.replaceSharpFields(space, this.sharpFields, fields);
        for (let field of fields) {
            if (field.dataType.pelement.scan(space) === false) ok = false;
        }
        if (arrs) {
            for (let arr of arrs) {
                const { pelement } = arr;
                if (pelement === undefined) continue;
                if (pelement.scan(space) === false) ok = false;
            }
        }
        let hasInBusSpace = new HasInBusSpace(space, this.entity);
        let theSpace = new ActionSpace(hasInBusSpace, this.entity);
        let s2 = new ReturnsSpace(theSpace, returns);
        if (this.scanParamsTuid(space, this.entity, this.entity) === false) ok = false;
        if (returns.pelement.scan(s2) === false) ok = false;
        if (statement.pelement.preScan(s2) === false) ok = false;
        if (statement.pelement.scan(s2) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false) ok = false;
        for (let ret of this.entity.returns.returns) {
            if (this.scanOwnerFields(this.entity, ret.fields) === false) ok = false;
        }
        if (this.entity.statement.pelement.scan2(uq) === false) {
            ok = false;
        }
        return ok;
    }
}

class ActionSpace extends ActionBaseSpace {
    private action: Act;
    constructor(outer: Space, action: Act) {
        super(outer, action);
        this.action = action;
    }
    protected _useBusFace(bus: Bus, face: string, arr: string, local: boolean): boolean {
        this.action.useBusFace(bus, face, arr, local);
        return true;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let p = super._varPointer(name, isField);
        if (p) return p;
        let { paramConvert } = this.action;
        if (paramConvert === undefined) return;
        if (paramConvert.to.find(v => v === name) !== undefined) return new NamePointer();
    }
    protected _setTransactionOff(off: boolean): boolean {
        super._setTransactionOff(off);
        this.action.transactionOff = off;
        return true;
    }
}

export class PAct extends PActEntity<Act> {
}

export class PProc extends PActEntity<Proc> {
    protected parseOutField() {
        this.ts.readToken();
        let field = this.parseField();
        field.paramType = ProcParamType.out;
    }

    protected parseInOutField() {
        this.ts.readToken();
        let field = this.parseField();
        field.paramType = ProcParamType.inout;
    }

    protected parseLog() {
        if (this.ts.isKeyword('log') === false) return;
        this.ts.readToken();
        if (this.ts.isKeyword('error') === false) {
            this.ts.expect('ERROR');
        }
        this.ts.readToken();
        this.entity.logError = true;
    }
}

export class PSysProc extends PProc {
}

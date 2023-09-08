import {
    IX,
    ValueExpression, ValueStatement, ValueXi, VarPointer,
} from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PStatement } from './statement';

export class PValueStatement extends PStatement<ValueStatement> {
    private valueXi: ValueXi;
    private table: string;
    private varType: string;
    private varValue: string;

    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.ts.expectToken(Token.VAR);
        }
        this.table = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('xi') === true) {
            this.ts.readToken();
            this.valueXi = new ValueXi();
            this.statement.valueXi = this.valueXi;
            this.parseValueXi();
        }
        else {
            this.ts.expect('xi');
        }

        if (this.ts.token === Token.SEMICOLON) this.ts.readToken();
    }

    scan(space: Space): boolean {
        let ok = true;
        let entity = space.getEntity(this.table);
        if (entity === undefined) {
            this.log(`${this.table} not defined`);
            return false;
        }
        if (entity.type !== 'ix') {
            this.log(`${this.table} is not IX`);
            return false;
        }
        this.valueXi.IX = entity as IX;
        let { xi } = this.valueXi;
        if (xi.pelement.scan(space) === false) ok = false;

        if (this.varType) {
            let varTypePointer = space.varPointer(this.varType, false) as VarPointer;
            if (!varTypePointer) {
                this.log(`${this.varType} is not defined`);
                ok = false;
            }
            this.valueXi.varType = this.varType;
            this.valueXi.typePointer = varTypePointer;
        }

        if (this.varValue) {
            let varValuePointer = space.varPointer(this.varValue, false) as VarPointer;
            if (!varValuePointer) {
                this.log(`${this.varValue} is not defined`);
                ok = false;
            }
            this.valueXi.varValue = this.varValue;
            this.valueXi.valuePointer = varValuePointer;
        }
        let { IX } = this.valueXi;
        if (['$uid', '$uuid', '$ulocal', '$uminute', '$global', '$local', '$minute'].findIndex(v => v === IX.x.idType) < 0) {
            this.log(`${IX.jName} is not support VALUE XI= statement, ${IX.jName} xi field must define ID type`);
            ok = false;
        }
        return ok;
    }

    private parseValueXi() {
        if (this.ts.token !== Token.EQU) {
            this.ts.expectToken(Token.EQU);
        }
        this.ts.readToken();
        let ixVal = new ValueExpression();
        ixVal.parser(this.context).parse();
        this.valueXi.xi = ixVal;
        if (this.ts.isKeyword('type') === true) {
            this.ts.readToken();
            this.parseValueXiType();
            if (this.ts.isKeyword('value') === true) {
                this.ts.readToken();
                this.parseValueXiValue();
            }
        }
        else if (this.ts.isKeyword('value') === true) {
            this.ts.readToken();
            this.parseValueXiValue();
            if (this.ts.isKeyword('type') === true) {
                this.ts.readToken();
                this.parseValueXiType();
            }
        }
    }

    private parseValueVar(): string {
        if (this.ts.isKeyword('into') === false) {
            this.ts.expect('into');
        }
        this.ts.readToken();
        if (this.ts.token !== Token.VAR) {
            this.ts.expectToken(Token.VAR);
        }
        let ret = this.ts.lowerVar;
        this.ts.readToken();
        return ret;
    }

    private parseValueXiType() {
        this.varType = this.parseValueVar();
    }

    private parseValueXiValue() {
        this.varValue = this.parseValueVar();
    }
}

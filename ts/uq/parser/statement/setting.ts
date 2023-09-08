import { Space } from '../space';
import { Token } from '../tokens';
import { SettingStatement, ValueExpression, createDataType, Var, VarPointer } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PSettingStatement extends PStatement {
    setting: SettingStatement;
    constructor(setting: SettingStatement, context: PContext) {
        super(setting, context);
        this.setting = setting;
    }

    protected _parse() {
        if (this.ts.isKeyword('global') === true) {
            this.ts.readToken();
            this.setting.isGlobal = true;
        }
        else if (this.ts.isKeyword('unit') === true) {
            this.ts.readToken();
            this.setting.addUnit = true;
            this.ts.assertKey('add');
            this.ts.readToken();
            let val = new ValueExpression();
            this.setting.val = val;
            let parser = val.parser(this.context);
            parser.parse();
            if (this.ts.token === Token.SEMICOLON) this.ts.readToken();
            return;
        }
        if (this.ts.token !== Token.STRING) {
            this.ts.expectToken(Token.STRING);
        }
        this.setting.name = this.ts.text;
        this.ts.readToken();
        if (this.ts.token !== Token.VAR) this.expect('字段类型');
        let dataType = createDataType(this.ts.lowerVar as any);
        if (dataType === undefined) this.error(this.ts._var + ' 不是字段类型');
        if (dataType.isString !== true && dataType.type !== 'bigint' && dataType.type !== 'int') {
            this.error('字段类型只支持 text, char, bigint, int');
        }
        this.ts.readToken();
        let parser = dataType.parser(this.context);
        parser.parse();
        this.setting.dataType = dataType;

        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
            let val = new ValueExpression();
            this.setting.val = val;
            let parser = val.parser(this.context);
            parser.parse();
        }
        else if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let v = new Var(this.ts.lowerVar, undefined, undefined);
            this.setting.var = v;
            this.ts.readToken();
        }
        else {
            this.ts.expect('= or to');
        }
        if (this.ts.token === Token.SEMICOLON) this.ts.readToken();
    }

    scan(space: Space): boolean {
        let ok = true;
        let { val, var: varName, dataType } = this.setting;
        if (val !== undefined) {
            if (val.pelement.scan(space) === false) ok = false;
        }
        else if (varName !== undefined) {
            let vp = space.varPointer(varName.name, false);
            if (vp === undefined) {
                this.log(`变量 ${varName} 没有定义`);
                ok = false;
            }
            varName.pointer = vp as VarPointer;
        }
        if (dataType !== undefined) {
            if (dataType.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}


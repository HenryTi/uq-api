import { PElementBase } from './element';
import { Space } from './space';
import { Token } from './tokens';
import { Field, createDataType, defaultStampOnUpdate, defaultStampCurrent, Entity, Pointer, Table } from '../il';
import { PContext } from './pContext';
import { PDataType } from './datatype';

export class PField extends PElementBase {
    private field: Field;
    private pDataType: PDataType;
    constructor(field: Field, context: PContext) {
        super(context);
        this.field = field;
    }

    protected _parse() {
        let { token, _var, lowerVar } = this.ts;
        if (this.field.name === undefined) {
            if (token !== Token.VAR) this.expect('字段名');
            this.field.name = lowerVar;
            if (_var !== lowerVar) this.field.jName = _var;
            this.ts.readToken();
        }
        if (this.ts.token !== Token.VAR) this.expect('字段类型');
        let dataType = createDataType(this.ts.lowerVar as any);
        if (dataType === undefined) {
            this.error(this.ts._var + ' 不是字段类型');
        }
        this.ts.readToken();
        let parser = this.pDataType = dataType.parser(this.context);
        parser.parse();
        this.field.dataType = dataType;
        switch (this.ts.lowerVar) {
            case 'not':
                this.ts.readToken();
                if (this.ts.lowerVar as any !== "null") {
                    this.expect('null');
                }
                this.ts.readToken();
                this.field.nullable = false;
                break;
            case 'null':
                this.ts.readToken();
                this.field.nullable = true;
                break;
        }
        if (dataType.type === 'timestamp') {
            if (this.ts.lowerVar === 'default') {
                this.ts.readToken();
                let defaultError = () => this.error('timestamp default only null, current, OnUpdate or date string');
                if (this.ts.token === Token.STRING) {
                    let { text } = this.ts;
                    if (isNaN(Date.parse(text)) === true) {
                        this.error(`'${text}' is not a valid date`);
                    }
                    this.field.defaultValue = text;
                    this.ts.readToken();
                    return;
                }
                if (this.ts.varBrace === false) {
                    switch (this.ts.lowerVar as any) {
                        case 'null': this.field.defaultValue = ['null']; break;
                        case 'current': this.field.defaultValue = [defaultStampCurrent]; break;
                        case 'onupdate': this.field.defaultValue = [defaultStampOnUpdate]; break;
                        default: return defaultError();
                    }
                    this.ts.readToken();
                    return;
                }
                defaultError();
                return;
            }
            this.field.defaultValue = [defaultStampOnUpdate];
            return;
        }
        if (this.ts.lowerVar === 'default') {
            this.ts.readToken();
            let dec: number;
            if (this.ts.token === Token.NUM) {
                dec = this.ts.dec;
                this.ts.readToken();
                this.field.defaultValue = String(dec);
            }
            else if (this.ts.token === Token.SUB) {
                this.ts.readToken();
                if (this.ts.token as any === Token.NUM) {
                    dec = -this.ts.dec;
                    this.ts.readToken();
                    this.field.defaultValue = String(dec);
                }
                else {
                    this.ts.expectToken(Token.NUM);
                }
            }
            else if (this.ts.token === Token.VAR) {
                let enumType = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token as any !== Token.DOT) {
                    this.ts.expectToken(Token.DOT);
                }
                this.ts.readToken();
                if (this.ts.token as any !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                let enumValue = this.ts.lowerVar;
                this.ts.readToken();
                this.field.defaultValue = [enumType, enumValue];
            }
            else if (this.ts.token === Token.STRING) {
                if (isNaN(Date.parse(this.ts.text)) === true) {
                    this.error(`'${this.ts.text}' is not a valid date`);
                };
                this.field.defaultValue = `'${this.ts.text}'`;
                this.ts.readToken();
            }
            else {
                this.ts.expect('number or enum');
            }
        }
        else if (this.ts.isKeyword('autoinc') === true) {
            if (!dataType.isNum) {
                this.error('只有数字类型才可以定义 auto increment');
            }
            this.ts.readToken();
            this.field.autoInc = true;
        }
    }

    scan(space: Space): boolean | string {
        let ret = this.pDataType.scan(space);
        let { dataType } = this.field;
        if (dataType.type !== 'date' && dataType.isNum === false && dataType.isId === false) {
            ret = false;
            this.log('只有数字, ID和日期才可以定义default');
        }
        return ret;
    }
}

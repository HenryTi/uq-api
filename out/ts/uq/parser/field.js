"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PField = void 0;
const element_1 = require("./element");
const tokens_1 = require("./tokens");
const il_1 = require("../il");
class PField extends element_1.PElementBase {
    constructor(field, context) {
        super(context);
        this.field = field;
    }
    _parse() {
        let { token, _var, lowerVar } = this.ts;
        if (this.field.name === undefined) {
            if (token !== tokens_1.Token.VAR)
                this.expect('字段名');
            this.field.name = lowerVar;
            if (_var !== lowerVar)
                this.field.jName = _var;
            this.ts.readToken();
        }
        if (this.ts.token !== tokens_1.Token.VAR)
            this.expect('字段类型');
        let dataType = (0, il_1.createDataType)(this.ts.lowerVar);
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
                if (this.ts.lowerVar !== "null") {
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
                if (this.ts.token === tokens_1.Token.STRING) {
                    let { text } = this.ts;
                    if (isNaN(Date.parse(text)) === true) {
                        this.error(`'${text}' is not a valid date`);
                    }
                    this.field.defaultValue = text;
                    this.ts.readToken();
                    return;
                }
                if (this.ts.varBrace === false) {
                    switch (this.ts.lowerVar) {
                        case 'null':
                            this.field.defaultValue = ['null'];
                            break;
                        case 'current':
                            this.field.defaultValue = [il_1.defaultStampCurrent];
                            break;
                        case 'onupdate':
                            this.field.defaultValue = [il_1.defaultStampOnUpdate];
                            break;
                        default: return defaultError();
                    }
                    this.ts.readToken();
                    return;
                }
                defaultError();
                return;
            }
            this.field.defaultValue = [il_1.defaultStampOnUpdate];
            return;
        }
        if (this.ts.lowerVar === 'default') {
            this.ts.readToken();
            let dec;
            if (this.ts.token === tokens_1.Token.NUM) {
                dec = this.ts.dec;
                this.ts.readToken();
                this.field.defaultValue = String(dec);
            }
            else if (this.ts.token === tokens_1.Token.SUB) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.NUM) {
                    dec = -this.ts.dec;
                    this.ts.readToken();
                    this.field.defaultValue = String(dec);
                }
                else {
                    this.ts.expectToken(tokens_1.Token.NUM);
                }
            }
            else if (this.ts.token === tokens_1.Token.VAR) {
                let enumType = this.ts.lowerVar;
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.DOT) {
                    this.ts.expectToken(tokens_1.Token.DOT);
                }
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                let enumValue = this.ts.lowerVar;
                this.ts.readToken();
                this.field.defaultValue = [enumType, enumValue];
            }
            else if (this.ts.token === tokens_1.Token.STRING) {
                if (isNaN(Date.parse(this.ts.text)) === true) {
                    this.error(`'${this.ts.text}' is not a valid date`);
                }
                ;
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
    scan(space) {
        let ret = this.pDataType.scan(space);
        let { dataType } = this.field;
        if (dataType.type !== 'date' && dataType.isNum === false && dataType.isId === false) {
            ret = false;
            this.log('只有数字, ID和日期才可以定义default');
        }
        return ret;
    }
}
exports.PField = PField;
//# sourceMappingURL=field.js.map
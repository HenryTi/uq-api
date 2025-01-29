"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSettingStatement = void 0;
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PSettingStatement extends PStatement_1.PStatement {
    constructor(setting, context) {
        super(setting, context);
        this.setting = setting;
    }
    _parse() {
        if (this.ts.isKeyword('global') === true) {
            this.ts.readToken();
            this.setting.isGlobal = true;
        }
        else if (this.ts.isKeyword('unit') === true) {
            this.ts.readToken();
            this.setting.addUnit = true;
            this.ts.assertKey('add');
            this.ts.readToken();
            let val = new il_1.ValueExpression();
            this.setting.val = val;
            let parser = val.parser(this.context);
            parser.parse();
            if (this.ts.token === tokens_1.Token.SEMICOLON)
                this.ts.readToken();
            return;
        }
        if (this.ts.token !== tokens_1.Token.STRING) {
            this.ts.expectToken(tokens_1.Token.STRING);
        }
        this.setting.name = this.ts.text;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR)
            this.expect('字段类型');
        let dataType = (0, il_1.createDataType)(this.ts.lowerVar);
        if (dataType === undefined)
            this.error(this.ts._var + ' 不是字段类型');
        if (dataType.isString !== true && dataType.type !== 'bigint' && dataType.type !== 'int') {
            this.error('字段类型只支持 text, char, bigint, int');
        }
        this.ts.readToken();
        let parser = dataType.parser(this.context);
        parser.parse();
        this.setting.dataType = dataType;
        if (this.ts.token === tokens_1.Token.EQU) {
            this.ts.readToken();
            let val = new il_1.ValueExpression();
            this.setting.val = val;
            let parser = val.parser(this.context);
            parser.parse();
        }
        else if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            let v = new il_1.Var(this.ts.lowerVar, undefined, undefined);
            this.setting.var = v;
            this.ts.readToken();
        }
        else {
            this.ts.expect('= or to');
        }
        if (this.ts.token === tokens_1.Token.SEMICOLON)
            this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let { val, var: varName, dataType } = this.setting;
        if (val !== undefined) {
            if (val.pelement.scan(space) === false)
                ok = false;
        }
        else if (varName !== undefined) {
            let vp = space.varPointer(varName.name, false);
            if (vp === undefined) {
                this.log(`变量 ${varName} 没有定义`);
                ok = false;
            }
            varName.pointer = vp;
        }
        if (dataType !== undefined) {
            if (dataType.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PSettingStatement = PSettingStatement;
//# sourceMappingURL=setting.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSysProc = exports.PProc = exports.PAct = exports.PActEntity = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
const returns_1 = require("./returns");
class PActEntity extends entity_1.PActionBase {
    _parse() {
        this.setName();
        this.parseProxyAuth();
        this.parseParams();
        this.parseConvert();
        this.parseInBuses(this.entity);
        let returns = this.entity.returns = new il_1.Returns();
        returns.parser(this.context, this.entity).parse();
        this.parseLog();
        let statement = new il_1.ActionStatement();
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context);
        parser.parse();
        this.entity.statement = statement;
        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
    }
    parseConvert() {
        if (this.ts.token !== tokens_1.Token.VAR)
            return;
        if (this.ts.varBrace === true)
            return;
        if (this.ts.lowerVar !== 'convert')
            return;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR || this.ts.varBrace === true) {
            this.expect('转换方式');
        }
        let pc = {};
        this.entity.paramConvert = pc;
        switch (this.ts.lowerVar) {
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
        else if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            pc.to = [];
            for (;;) {
                lowerVar = this.ts.lowerVar;
                if (lowerVar === undefined) {
                    this.ts.expect('to list');
                }
                pc.to.push(lowerVar);
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
    }
    parseLog() {
    }
    isNameExists(name) {
        let { fields, arrs } = this.entity;
        if (fields && fields.find(v => v.name === name)
            || arrs && arrs.find(v => v.name === name)) {
            this.log('action ' + this.entity.name + ' convert parameter name ' + name + ' 重名');
            return true;
        }
        return false;
    }
    scan(space) {
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
            if (this.isNameExists(pcName) === true)
                ok = false;
            for (let t of to) {
                if (this.isNameExists(t) === true)
                    ok = false;
            }
        }
        if (statement === undefined) {
            this.log('action ' + this.entity.name + ' 没有定义语句');
            ok = false;
        }
        this.replaceSharpFields(space, this.sharpFields, fields);
        for (let field of fields) {
            if (field.dataType.pelement.scan(space) === false)
                ok = false;
        }
        if (arrs) {
            for (let arr of arrs) {
                const { pelement } = arr;
                if (pelement === undefined)
                    continue;
                if (pelement.scan(space) === false)
                    ok = false;
            }
        }
        let hasInBusSpace = new entity_1.HasInBusSpace(space, this.entity);
        let theSpace = new ActionSpace(hasInBusSpace, this.entity);
        let s2 = new returns_1.ReturnsSpace(theSpace, returns);
        if (this.scanParamsTuid(space, this.entity, this.entity) === false)
            ok = false;
        if (returns.pelement.scan(s2) === false)
            ok = false;
        if (statement.pelement.preScan(s2) === false)
            ok = false;
        if (statement.pelement.scan(s2) === false)
            ok = false;
        return ok;
    }
    scan2(uq) {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false)
            ok = false;
        for (let ret of this.entity.returns.returns) {
            if (this.scanOwnerFields(this.entity, ret.fields) === false)
                ok = false;
        }
        if (this.entity.statement.pelement.scan2(uq) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PActEntity = PActEntity;
class ActionSpace extends entity_1.ActionBaseSpace {
    constructor(outer, action) {
        super(outer, action);
        this.action = action;
    }
    _useBusFace(bus, face, arr, local) {
        this.action.useBusFace(bus, face, arr, local);
        return true;
    }
    _varPointer(name, isField) {
        let p = super._varPointer(name, isField);
        if (p)
            return p;
        let { paramConvert } = this.action;
        if (paramConvert === undefined)
            return;
        if (paramConvert.to.find(v => v === name) !== undefined)
            return new il_1.VarPointer();
    }
    _setTransactionOff() {
        super._setTransactionOff();
        this.action.transactionOff = true;
        return true;
    }
}
class PAct extends PActEntity {
}
exports.PAct = PAct;
class PProc extends PActEntity {
    parseOutField() {
        this.ts.readToken();
        let field = this.parseField();
        field.paramType = il_1.ProcParamType.out;
    }
    parseInOutField() {
        this.ts.readToken();
        let field = this.parseField();
        field.paramType = il_1.ProcParamType.inout;
    }
    parseLog() {
        if (this.ts.isKeyword('log') === false)
            return;
        this.ts.readToken();
        if (this.ts.isKeyword('error') === false) {
            this.ts.expect('ERROR');
        }
        this.ts.readToken();
        this.entity.logError = true;
    }
}
exports.PProc = PProc;
class PSysProc extends PProc {
}
exports.PSysProc = PSysProc;
//# sourceMappingURL=act.js.map
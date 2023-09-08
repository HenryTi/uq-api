"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFunction = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PFunction extends entity_1.PActionBase {
    _parse() {
        this.setName();
        this.parseParams();
        this.ts.passKey('returns');
        let dt = this.ts.passVar();
        let dataType = this.entity.dataType = (0, il_1.createDataType)(dt);
        this.context.parseElement(dataType);
        let statement = new il_1.FunctionStatement(undefined);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context);
        parser.parse();
        this.entity.statement = statement;
        if (this.ts.token !== tokens_1.Token.SEMICOLON) {
            this.expectToken(tokens_1.Token.SEMICOLON);
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let names = this.entity.nameUnique();
        const { type, name, jName } = this.entity;
        if (names !== undefined) {
            ok = false;
            this.log(`action ${name} 字段重名: ${names.join(',')}`);
        }
        let { statement, fields } = this.entity;
        if (statement === undefined) {
            this.log(`action ${name} 没有定义语句`);
            ok = false;
        }
        let theSpace = new FunctionSpace(space, this.entity);
        if (statement.pelement.scan(theSpace) === false)
            ok = false;
        let { dataType } = this.entity;
        for (let field of fields) {
            if (field.dataType.pelement.scan(space) === false)
                ok = false;
        }
        let ret = this.scanDataType(space, dataType);
        if (ret !== undefined) {
            ok = false;
            this.log(`${type} ${jName} RETURNS type ${ret}`);
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false)
            ok = false;
        return ok;
    }
}
exports.PFunction = PFunction;
class FunctionSpace extends entity_1.ActionBaseSpace {
    constructor(outer, func) {
        super(outer, func);
        this.func = func;
    }
    _useBusFace(bus, face, arr) {
        return false;
    }
}
//# sourceMappingURL=function.js.map
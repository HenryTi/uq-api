"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PInBusAction = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
const statement_1 = require("../statement");
const expression_1 = require("../expression");
const select_1 = require("../select");
const returns_1 = require("./returns");
class PInBusAction extends entity_1.PActionBase {
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.error('bus on action expect bus name');
        }
        this.busName = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.DOT);
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.error('bus on action expect bus face name');
        }
        this.entity.faceName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.expectToken(tokens_1.Token.VAR);
            }
            this.entity.faceAlias = this.ts.lowerVar;
            this.ts.readToken();
        }
        this.ts.assertKey('into');
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.error('after into expect bus var name');
        }
        this.entity.busVar = this.ts.lowerVar;
        this.ts.readToken();
        let statement = new il_1.InBusActionStatement(undefined, this.entity);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context);
        parser.parse();
        this.entity.statement = statement;
    }
    scan(space) {
        let ok = true;
        let names = this.entity.nameUnique();
        if (names !== undefined) {
            ok = false;
            this.log('action ' + this.entity.name + ' 字段重名: ' + names.join(','));
        }
        let statement = this.entity.statement;
        if (statement === undefined) {
            this.log('action ' + this.entity.name + ' 没有定义语句');
            ok = false;
        }
        let { statements } = statement;
        let bus = this.entity.uq.buses[this.busName];
        if (bus === undefined) {
            this.log('bus ' + this.busName + ' 没有定义');
            return false;
        }
        this.entity.bus = bus;
        let { faceName, faceAlias } = this.entity;
        let faceSchema = bus.shareSchema.faceSchemas[faceName];
        if (faceSchema === undefined) {
            this.log(`bus face ${this.busName}/${faceName} + ' 没有定义`);
            ok = false;
            return false;
        }
        if (faceSchema.type !== 'query') {
            this.log(`bus face ${this.busName}/${faceName} + ' is not query`);
            ok = false;
            return false;
        }
        let faceQuerySchema = faceSchema;
        this.entity.faceQuerySchema = faceQuerySchema;
        let varStatement = new il_1.VarStatement(undefined);
        varStatement.pelement = new statement_1.PVarStatement(varStatement, this.context);
        this.entity.returns = new il_1.Returns;
        let returnMainFields = [];
        let busMain = 'bus$main';
        this.entity.returns.returns.push({
            name: busMain,
            jName: busMain,
            sName: busMain,
            fields: returnMainFields,
            needTable: true,
            sharpFields: undefined,
        });
        let { param, returns } = faceQuerySchema;
        if (param !== undefined) {
            function addVar(field) {
                let _var;
                returnMainFields.push(field);
                _var = new il_1.Var(faceAlias !== undefined ? faceAlias + '.' + field.name : field.name, field.dataType, undefined);
                varStatement.vars.push(_var);
            }
            for (let p of param) {
                let { name, type, fields } = p;
                name = name.toLowerCase();
                if (fields === undefined) {
                    addVar((0, entity_1.faceField)(name, type));
                }
                else {
                    let rName = faceAlias !== undefined ? faceAlias + '.' + name : name;
                    let ret = {
                        name: rName,
                        jName: rName,
                        sName: rName,
                        needTable: true,
                        fields: (0, entity_1.busFieldsToFields)(fields),
                    };
                    this.entity.returns.returns.push(ret);
                }
            }
        }
        if (returns !== undefined) {
            let arrMain = new il_1.Arr(this.entity.uq);
            arrMain.name = this.entity.busVar;
            let arrs = [];
            for (let p of returns) {
                let { name, type, fields } = p;
                name = name.toLowerCase();
                if (fields === undefined) {
                    arrMain.fields.push((0, entity_1.faceField)(name, type));
                }
                else {
                    let arr = new il_1.Arr(this.entity.uq);
                    arr.name = this.entity.busVar + '.' + name;
                    arr.fields.push(...(0, entity_1.busFieldsToFields)(fields));
                    arrs.push(arr);
                }
            }
            if (arrMain.fields.length > 0)
                this.entity.arrs.push(arrMain);
            this.entity.arrs.push(...arrs);
        }
        statements.unshift(varStatement);
        let intoMainSelect = new il_1.SelectStatement(undefined);
        intoMainSelect.into = 'bus$main';
        intoMainSelect.pelement = new statement_1.PSelectStatement(intoMainSelect, this.context);
        let select = new il_1.Select();
        intoMainSelect.select = select;
        select.pelement = new select_1.PSelect(select, this.context);
        select.columns = returnMainFields.map(v => {
            let vn = v.name;
            let vnExp = faceAlias !== undefined ? faceAlias + '.' + vn : vn;
            let varOperand = new il_1.VarOperand();
            varOperand._var = [vnExp];
            varOperand.pelement = new expression_1.PVarOperand(varOperand, this.context);
            let exp = new il_1.ValueExpression();
            exp.add(varOperand);
            exp.pelement = new expression_1.PValueExpression(exp, this.context);
            return {
                alias: vn,
                value: exp,
            };
        });
        statements.push(intoMainSelect);
        let theSpace = new InBusActionSpace(space, this.entity);
        let s2 = new returns_1.ReturnsSpace(theSpace, this.entity.returns);
        if (statement.pelement.scan(s2) === false)
            ok = false;
        if (this.scanParamsTuid(space, this.entity, this.entity) === false)
            ok = false;
        //if (this.entity.returns.pelement.scan(s2) === false) ok = false;
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
        return ok;
    }
}
exports.PInBusAction = PInBusAction;
class InBusActionSpace extends entity_1.ActionBaseSpace {
    constructor(outer, inBusAction) {
        super(outer, inBusAction);
        this.inBusAction = inBusAction;
    }
    _varPointer(name, isField) {
        if (this.inBusAction.ownerAction.fields.find(v => v.name === name) !== undefined)
            return new il_1.NamePointer();
    }
    _getArr(name) {
        return this.inBusAction.ownerAction.arrs.find(v => v.name === name);
    }
}
//# sourceMappingURL=inBusAction.js.map
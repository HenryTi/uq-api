import {
    Field, Returns,
    Uq, InBusAction, InBusActionStatement, VarStatement, Return, Var,
    SelectStatement, Select, VarOperand, ValueExpression, VarPointer, Column, Arr
} from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PActionBase, ActionBaseSpace, faceField, busFieldsToFields } from './entity';
import { FaceQuerySchema, FacePrimitivType } from '../../il/busSchema';
import { PVarStatement, PSelectStatement } from '../statement';
import { PVarOperand, PValueExpression } from '../expression';
import { PSelect } from '../select';
import { ReturnsSpace } from './returns';

export class PInBusAction extends PActionBase<InBusAction> {
    private busName: string;

    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.error('bus on action expect bus name');
        }
        this.busName = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(Token.DOT);
        this.ts.readToken();
        if (this.ts.token !== Token.VAR) {
            this.error('bus on action expect bus face name');
        }
        this.entity.faceName = this.ts.lowerVar;
        this.ts.readToken();

        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.expectToken(Token.VAR);
            }
            this.entity.faceAlias = this.ts.lowerVar;
            this.ts.readToken();
        }

        this.ts.assertKey('into');
        this.ts.readToken();

        if (this.ts.token !== Token.VAR) {
            this.error('after into expect bus var name');
        }
        this.entity.busVar = this.ts.lowerVar;
        this.ts.readToken();

        let statement = new InBusActionStatement(undefined, this.entity);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
        this.entity.statement = statement;
    }

    scan(space: Space): boolean {
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
        let faceQuerySchema = faceSchema as FaceQuerySchema;
        this.entity.faceQuerySchema = faceQuerySchema;

        let varStatement = new VarStatement(undefined);
        varStatement.pelement = new PVarStatement(varStatement, this.context);
        this.entity.returns = new Returns;
        let returnMainFields: Field[] = [];
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
            function addVar(field: Field) {
                let _var: Var;
                returnMainFields.push(field);
                _var = new Var(faceAlias !== undefined ? faceAlias + '.' + field.name : field.name, field.dataType, undefined);
                varStatement.vars.push(_var);
            }
            for (let p of param) {
                let { name, type, fields } = p;
                name = name.toLowerCase();
                if (fields === undefined) {
                    addVar(faceField(name, type as FacePrimitivType));
                }
                else {
                    let rName = faceAlias !== undefined ? faceAlias + '.' + name : name;
                    let ret: Return = {
                        name: rName,
                        jName: rName,
                        sName: rName,
                        needTable: true,
                        fields: busFieldsToFields(fields),
                    };
                    this.entity.returns.returns.push(ret);
                }
            }
        }
        if (returns !== undefined) {
            let arrMain = new Arr(this.entity.uq);
            arrMain.name = this.entity.busVar;
            let arrs: Arr[] = [];
            for (let p of returns) {
                let { name, type, fields } = p;
                name = name.toLowerCase();
                if (fields === undefined) {
                    arrMain.fields.push(faceField(name, type as FacePrimitivType));
                }
                else {
                    let arr = new Arr(this.entity.uq);
                    arr.name = this.entity.busVar + '.' + name;
                    arr.fields.push(...busFieldsToFields(fields))
                    arrs.push(arr);
                }
            }
            if (arrMain.fields.length > 0) this.entity.arrs.push(arrMain);
            this.entity.arrs.push(...arrs);
        }
        statements.unshift(varStatement);

        let intoMainSelect = new SelectStatement(undefined);
        intoMainSelect.into = 'bus$main';
        intoMainSelect.pelement = new PSelectStatement(intoMainSelect, this.context);
        let select = new Select();
        intoMainSelect.select = select;
        select.pelement = new PSelect(select, this.context);
        select.columns = returnMainFields.map(v => {
            let vn = v.name;
            let vnExp = faceAlias !== undefined ? faceAlias + '.' + vn : vn;
            let varOperand = new VarOperand();
            varOperand._var = [vnExp];
            varOperand.pelement = new PVarOperand(varOperand, this.context);
            let exp = new ValueExpression();
            exp.atoms = [varOperand];
            exp.pelement = new PValueExpression(exp, this.context);
            return {
                alias: vn,
                value: exp,
            } as Column
        });
        statements.push(intoMainSelect);

        let theSpace = new InBusActionSpace(space, this.entity);
        let s2 = new ReturnsSpace(theSpace, this.entity.returns);
        if (statement.pelement.scan(s2) === false) ok = false;
        if (this.scanParamsTuid(space, this.entity, this.entity) === false) ok = false;
        //if (this.entity.returns.pelement.scan(s2) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false) ok = false;
        for (let ret of this.entity.returns.returns) {
            if (this.scanOwnerFields(this.entity, ret.fields) === false) ok = false;
        }
        return ok;
    }
}

class InBusActionSpace extends ActionBaseSpace {
    private inBusAction: InBusAction;
    constructor(outer: Space, inBusAction: InBusAction) {
        super(outer, inBusAction);
        this.inBusAction = inBusAction;
    }

    _varPointer(name: string, isField: boolean): VarPointer {
        if (this.inBusAction.ownerAction.fields.find(v => v.name === name) !== undefined)
            return new VarPointer();
    }
    protected _getArr(name: string): Arr {
        return this.inBusAction.ownerAction.arrs.find(v => v.name === name);
    }
}

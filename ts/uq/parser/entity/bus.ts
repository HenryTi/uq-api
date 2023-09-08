import {
    Uq, Field, Bus, BusField, BusAccept,
    Arr, decField, textField, bigIntField, BusQuery, Returns, Return,
    TableStatement, TextStatement, ActionBase,
    FaceAcceptSchema, FaceQuerySchema, FacePrimitivType, Pointer, VarPointer
} from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntity, ActionBaseSpace, HasInBusSpace } from './entity';
import { PTableStatement, PTextStatement } from '../statement';

export class PBus extends PEntity<Bus> {
    scanDoc2(): boolean {
        return true;
    }
    protected _parse() {
        this.setName();
        this.ts.assertKey('from');
        this.ts.readToken();
        if (this.ts.token === Token.DIV) {
            this.ts.readToken();
            this.entity.busOwner = '$$$';
        }
        else {
            if (this.ts.token !== Token.VAR as any) {
                this.expectToken(Token.VAR);
            }
            this.entity.busOwner = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== Token.DIV as any) {
                this.expectToken(Token.DIV);
            }
            this.ts.readToken();
        }
        if (this.ts.token !== Token.VAR as any) {
            this.expectToken(Token.VAR);
        }
        this.entity.busName = this.ts.lowerVar;
        this.ts.readToken();

        for (; ;) {
            if (this.ts.token === Token.VAR) {
                if (this.ts.varBrace === true) {
                    this.error('should be key word ACCEPT or QUERY');
                }
                switch (this.ts.lowerVar) {
                    default:
                        this.error('should be key word ACCEPT or QUERY');
                        break;
                    case 'accept':
                        this.ts.readToken();
                        this.parseAccept();
                        break;
                    case 'query':
                        this.ts.readToken();
                        this.parseQuery();
                        break;
                }
            }
            else { // if (this.ts.token === Token.SEMICOLON) {
                //this.ts.readToken();
                break;
            }
            /*
            else {
                this.expect('ACCEPT', 'QUERY', ';');
                break;
            }*/
        }
        /*
        while (this.ts.isKeyword('accept')) {
            this.ts.readToken();
            this.parseAccept();
        }
        */
        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
        }
        this.ts.readToken();
    }

    private parseBusParams(): Field[] {
        if (this.ts.token !== Token.LPARENTHESE) return;
        let ret: Field[] = [];
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token as any !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let fn = this.ts.lowerVar;
            let f = new Field();
            this.ts.readToken();
            if (this.ts.isKeyword('as') === true) {
                this.ts.readToken();
                this.ts.assertVar();
                f.name = this.ts.lowerVar;
                f.busSource = fn;
                this.ts.readToken();
            }
            else {
                f.name = fn;
            }
            ret.push(f);
            if (this.ts.token as any === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
        }
        return ret;
    }

    private parseParamsArrs(actionBase: ActionBase): boolean {
        let fields = this.parseBusParams();
        if (fields === undefined) return false;
        actionBase.fields.push(...fields);
        while (this.ts.isKeyword('arr') === true) {
            this.ts.readToken();
            let arr = new Arr(actionBase.uq);
            actionBase.arrs.push(arr);
            this.ts.assertVar();
            let an: string = this.ts.lowerVar;
            if (this.ts.isKeyword('as') === true) {
                this.ts.readToken();
                arr.name = this.ts.lowerVar;
                arr.busSource = an;
            }
            else {
                arr.name = an;
            }
            this.ts.readToken();
            let fields = this.parseBusParams();
            arr.fields.push(...fields);
        }
        return true;
    }

    private parseAccept() {
        if (this.ts.token !== Token.VAR) this.ts.expect('bus face name');
        let faceName = this.ts.lowerVar;
        let jFaceName = this.ts._var;
        this.ts.readToken();
        let busAccept = this.entity.newBusAccept(faceName, jFaceName);
        busAccept.hasParams = this.parseParamsArrs(busAccept);
        this.parseInBuses(busAccept);
        let { statement } = busAccept;
        statement.level = 1;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
    }

    private parseQuery() {
        if (this.ts.token !== Token.VAR) this.ts.expect('bus face name');
        let faceName = this.ts.lowerVar;
        let jFaceName = this.ts._var;
        this.ts.readToken();
        let busQuery = this.entity.newBusQuery(faceName, jFaceName);
        busQuery.hasParams = this.parseParamsArrs(busQuery);
        let statement = busQuery.statement;
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
    }

    private faceField(name: string, type: FacePrimitivType): Field {
        let ret: Field;
        switch (type) {
            default: return;
            case 'number': ret = decField(name, 32, 6); break;
            //case 'date': return dateTimeField(name);
            case 'string': ret = textField(name); break;
            case 'id': ret = bigIntField(name); break;
        }
        ret.nullable = true;
        return ret;
    }
    private busFieldToField(f: BusField): Field {
        let { name, type } = f;
        return this.faceField(name, type as FacePrimitivType);
    }
    private busFieldToArr(app: Uq, ff: BusField): Arr {
        let { name, fields } = ff;
        return this.busFieldsToArr(app, name, fields);
    }
    private busFieldsToArr(app: Uq, name: string, busFields: BusField[]): Arr {
        let arr = new Arr(app);
        arr.name = name;
        arr.isBus = true;
        for (let f of busFields) {
            arr.fields.push(this.busFieldToField(f));
        }
        return arr;
    }

    private busFieldsTo(busFields: BusField[]): { fields: Field[], arrs: Arr[] } {
        let ret: { fields: Field[], arrs: Arr[] } = { fields: [], arrs: [] };
        for (let ff of busFields) {
            let { type } = ff;
            if (type === 'array') {
                let arr = this.busFieldToArr(this.entity.uq, ff);
                ret.arrs.push(arr);
            }
            else {
                let f = this.busFieldToField(ff);
                ret.fields.push(f);
            }
        }
        return ret;
    }

    private checkFields(fields0: Field[], fields1: Field[]): boolean {
        let ok = true;
        let len0 = fields0.length;
        let len1 = fields1.length;
        if (len0 !== len1) {
            this.log(`bus face的字段数${len1}跟参数的个数${len0}不一致`);
            return false;
        }
        for (let i = 0; i < len0; i++) {
            let f0 = fields0[i];
            let f1 = fields1[i];
            let { name, busSource } = f0;
            let n0 = (busSource || name);
            let n1 = f1.name;
            if (n0 !== n1) {
                ok = false;
                this.log(`bus face字段名${n0}与参数名${n1}不一致`);
            }
            f0.dataType = f1.dataType;
        }
        return ok;
    }

    private checkArrs(arrs0: Arr[], arrs1: Arr[]): boolean {
        let ok = true;
        let arr0Len = arrs0.length;
        let arr1Len = arrs1.length;
        if (arr0Len !== arr1Len) {
            this.log(`bus face的array数${arr1Len}跟参数的arr个数${arr0Len}不一致`);
            return false;
        }
        for (let i = 0; i < arr0Len; i++) {
            let arr0 = arrs0[i];
            let arr1 = arrs1[i];
            let { name, busSource } = arr0;
            let n0 = (busSource || name);
            let n1 = arr1.name;
            if (n0 !== n1) {
                ok = false;
                this.log(`arr: bus face字段名${n0}与参数名${n1}不一致`);
            }
            if (this.checkFields(arr0.fields, arr1.fields) === false) ok = false;
        }
        return ok;
    }

    private checkBusParamsMatch(busFields: BusField[], fields: Field[], arrs: Arr[]): boolean {
        let ok = true;
        let { fields: retFields, arrs: retArrs } = this.busFieldsTo(busFields);
        if (this.checkFields(fields, retFields) === false) ok = false;
        if (this.checkArrs(arrs, retArrs) === false) ok = false;
        return ok;
    }

    private checkBusReturnsMatch(faceFields: BusField[], returns: Returns): boolean {
        let ok = true;
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let faceSchemas = this.entity.shareSchema.faceSchemas;
        if (faceSchemas === undefined) return false;
        let { accepts, queries } = this.entity;
        for (let i in accepts) {
            let busAccept = accepts[i];
            let ban = busAccept.name;
            let faceSchema = faceSchemas[ban];
            if (faceSchema === undefined) {
                let { busOwner, busName } = this.entity;
                this.log(`${busAccept.sName} is not a face of ${busOwner}/${busName}`);
                ok = false;
                continue;
            }
            let busFields: BusField[];
            switch (faceSchema.type) {
                case 'accept':
                    busFields = (faceSchema as FaceAcceptSchema).busFields;
                    break;
                case 'query':
                    busFields = (faceSchema as FaceQuerySchema).returns;
                    busAccept.isQuery = true;
                    break;
            }
            //let busFields = (faceSchema as FaceAcceptSchema).busFields;
            if (busAccept.hasParams === true) {
                if (this.checkBusParamsMatch(busFields, busAccept.fields, busAccept.arrs) === false) {
                    ok = false;
                }
            }
            else {
                let ret = this.busFieldsTo(busFields);
                busAccept.arrs.push(...ret.arrs);
                busAccept.fields.push(...ret.fields);
            }

            let hasInBusSpace = new HasInBusSpace(space, busAccept);
            let theSpace = new BusAcceptSpace(hasInBusSpace, busAccept);
            if (this.scanInBuses(theSpace, busAccept) === false) {
                ok = false;
            }
            let { statements, statement } = busAccept;
            if (statement.pelement.preScan(theSpace) === false) ok = false;
            if (statement.pelement.scan(theSpace) === false) ok = false;

            if ((statements === undefined || statements.length === 0)
                && statement.statements.length === 0) {
                this.log('accept ' + ban + ' 没有定义语句');
                ok = false;
            }
            for (let statement of statements) {
                if (statement.pelement.preScan(theSpace) === false) ok = false;
                if (statement.pelement.scan(theSpace) === false) ok = false;
            }
        }

        for (let busQuery of queries) {
            let ban = busQuery.name;
            let statement = busQuery.statement;
            if (statement === undefined) {
                this.log('query ' + ban + ' 没有定义语句');
                ok = false;
            }
            let faceSchema = faceSchemas[ban];
            if (faceSchema === undefined) {
                let { busOwner, busName } = this.entity;
                this.log(`${busQuery.sName} is not a face of ${busOwner}/${busName}`);
                ok = false;
                continue;
            }
            if (faceSchema.type !== 'query') {
                this.log('face ' + ban + ' 不是query');
                ok = false;
                continue;
            }
            let faceQuerySchema = faceSchema as FaceQuerySchema;
            let { fields } = busQuery;
            let { param } = faceQuerySchema;
            let arrs: Arr[];
            if (busQuery.hasParams === true) {
                arrs = busQuery.arrs;
                if (this.checkBusParamsMatch(param, busQuery.fields, arrs) === false) {
                    ok = false;
                }
                if (this.checkBusReturnsMatch(faceQuerySchema.returns, busQuery.returns) === false) {
                    ok = false;
                }
                busQuery.arrs = [];
            }
            else {
                arrs = [];
                for (let p of param) {
                    let { name, type, fields: faceFields } = p;
                    name = name.toLowerCase();
                    if (faceFields === undefined) {
                        fields.push(this.faceField(name, type as FacePrimitivType));
                    }
                    else {
                        let arr = this.busFieldsToArr(this.entity.uq, name, faceFields);
                        arrs.push(arr);
                    }
                }
            }
            for (let arr of arrs) {
                let { name } = arr;
                let paramName = `$${name}$text`;
                fields.push(textField(paramName));
                let tableStatement = new TableStatement(undefined);
                tableStatement.pelement = new PTableStatement(tableStatement, this.context);
                let { table } = tableStatement;
                table.name = name;
                table.fields = arr.fields;

                let textStatement = new TextStatement(undefined);
                let pts = textStatement.pelement = new PTextStatement(textStatement, this.context);
                pts.setTableName(name);
                textStatement.textVar = paramName;
                textStatement.tableVar = table;

                statement.statements.unshift(tableStatement, textStatement);
            }

            let returns = busQuery.returns = new Returns;
            let returnMain: Return = {
                name: 'bus',
                jName: 'bus',
                sName: 'bus',
                fields: [],
                needTable: true,
            };
            returns.addRet(returnMain);
            for (let busField of faceQuerySchema.returns) {
                let { type } = busField;
                if (type === 'array') {
                    let arr = this.busFieldToArr(this.entity.uq, busField);
                    returns.addRet({
                        name: 'bus.' + arr.name,
                        jName: 'bus.' + arr.jName,
                        sName: 'bus.' + arr.sName,
                        fields: arr.fields,
                        needTable: true,
                    });
                }
                else {
                    let f = this.busFieldToField(busField);
                    returnMain.fields.push(f);
                }
            }

            let theSpace = new BusQuerySpace(space, busQuery);
            if (statement.pelement.preScan(theSpace) === false) ok = false;
            if (statement.pelement.scan(theSpace) === false) ok = false;
        }
        return ok;
    }
}

class BusAcceptSpace extends ActionBaseSpace {
    private busAccept: BusAccept;
    constructor(outer: Space, busAccept: BusAccept) {
        super(outer, busAccept);
        this.busAccept = busAccept;
    }
    protected _useBusFace(bus: Bus, face: string, arr: string, local: boolean): boolean {
        this.busAccept.useBusFace(bus, face, arr, local);
        return true;
    }

    protected _varPointer(name: string, isField: boolean): Pointer {
        let ret = super._varPointer(name, isField);
        if (ret) return ret;
        if (name === '$stamp' || name === '$importing') return new VarPointer();
        return undefined;
    }
}

class BusQuerySpace extends ActionBaseSpace {
    private busQuery: BusQuery;
    constructor(outer: Space, busQuery: BusQuery) {
        super(outer, busQuery);
        this.busQuery = busQuery;
    }
    getReturn(name: string) {
        let { returns } = this.busQuery;
        if (returns === undefined) return;
        return returns.returns.find(r => r.name === name);
    }
}

import { PContext } from '../pContext';
import {
    Entity, Field, Table, ActionBase, Arr
    , Pointer, NamePointer, Of, Tuid, TableVar
    , EntityWithTable, Index, decField, textField, bigIntField
    , BusField, FacePrimitivType, InBusAction, ActionHasInBus
    , ID, IDX, SharpField, ValueExpression, SysProc, EntityAccessibility
    , IElement, Uq, /*BizPermitItem, */VarOperand, ProcParamType, Permit, DataType
} from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';

export function faceField(name: string, type: FacePrimitivType): Field {
    switch (type) {
        default: return;
        case 'number': return decField(name, 32, 6);
        case 'string': return textField(name);
        case 'id': return bigIntField(name);
    }
}
export function busFieldToField(f: BusField): Field {
    let { name, type } = f;
    return faceField(name, type as FacePrimitivType);
}
export function busFieldsToFields(busFields: BusField[]): Field[] {
    return busFields.map(v => busFieldToField(v));
}

export abstract class PEntityBase<T extends IElement> extends PElement {
    protected entity: T;
    protected sharpFields: SharpField[];
    constructor(entity: T, context: PContext) {
        super(entity, context);
        this.entity = entity;
    }

    protected parseSharpField(index: number): SharpField {
        this.ts.readToken();
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
        }
        let { token } = this.ts;
        if (token as any !== Token.VAR && token as any !== Token.DOLLARVAR) {
            this.ts.expectToken(Token.VAR);
        }
        let IDName = this.ts.lowerVar;
        this.ts.readToken();
        return {
            IDName,
            index,
            fields: undefined,
        };
    }

    protected replaceSharpFields(space: Space, sharpFields: SharpField[], fields: Field[]): boolean {
        if (sharpFields === undefined) return true;
        let ok = true;
        let coll: { [name: string]: Field } = {};
        let newFields: Field[] = [];
        let p = 0;
        function pushField(f: Field) {
            let fn = f.name;
            if (coll[fn] === undefined) {
                coll[f.name] = f;
                newFields.push(f);
            }
        }
        for (let pf of sharpFields) {
            let { IDName, index } = pf;
            for (let i = p; i < index; i++) pushField(fields[i]);
            let entity = space.getEntity(IDName);
            if (entity === undefined || ['id', 'idx'].indexOf(entity.type) < 0) {
                this.log(`${IDName} is not ID or IDX`);
                ok = false;
            }
            let ID = entity as (ID | IDX);
            let IDFields = ID.fields;
            let sFields: Field[] = [];
            pf.fields = sFields;
            function pushSField(f: Field) {
                let fn = f.name;
                if (coll[fn] === undefined) {
                    coll[f.name] = f;
                    newFields.push(f);
                    sFields.push(f);
                }
            }
            for (let f of IDFields) pushSField(f);
            p = index;
        }
        let len = fields.length;
        for (let i = p; i < len; i++) {
            pushField(fields[i]);
        }
        if (ok === true) {
            fields.splice(0, len, ...newFields);
        }
        return ok;
    }

    scanParamsTuid(space: Space, entity: Entity, ab: ActionBase): boolean {
        let ok = true;
        let { fields, arrs } = ab;
        if (this.scanTuidFields(space, entity, fields) === false) ok = false;
        if (arrs !== undefined) {
            for (let arr of arrs) {
                if (this.scanTuidFields(space, entity, arr.fields) === false) ok = false;
            }
        }
        return ok;
    }

    scanParamsOwner(entity: Entity, ab: ActionBase): boolean {
        let ok = true;
        let { fields, arrs } = ab;
        if (this.scanOwnerFields(entity, fields) === false) ok = false;
        if (arrs !== undefined) {
            for (let arr of arrs) {
                if (this.scanOwnerFields(entity, arr.fields, fields) === false) ok = false;
            }
        }
        return ok;
    }

    scanTuidFields(space: Space, entity: Entity, fields: Field[]): boolean {
        let ok = true;
        if (fields === undefined) return ok;
        for (let field of fields) {
            let ret = this.scanDataType(space, field.dataType);
            if (ret !== undefined) {
                /*
            let { pelement } = field.dataType;
            if (pelement === undefined) continue;
            let ret = pelement.scanReturnMessage(space);
            if (ret === undefined) continue;
            */
                ok = false;
                this.log(entity.type + ' ' + entity.jName + ' 字段 ' + field.name + ' ' + ret);
            }
        }
        return ok;
    }

    protected scanDataType(space: Space, dataType: DataType): string {
        let { pelement } = dataType;
        if (pelement === undefined) return undefined;
        let ret = pelement.scanReturnMessage(space);
        if (ret === undefined) return undefined;
        return ret;
    }

    scanOwnerFields(entity: Entity, fields: Field[], mainFields?: Field[]): boolean {
        if (fields === undefined) return true;
        let ok = true;
        for (let field of fields) {
            let ret = this.scanOwnerField(field, fields, mainFields);
            if (ret === undefined) continue;
            ok = false;
            this.log(entity.type + ' ' + entity.jName + ' 字段 ' + field.name + ' ' + ret);
        }
        return ok;
    }

    private scanOwnerField(field: Field, fields: Field[], mainFields?: Field[]): string {
        let { owner, arr } = field.dataType as Of;
        if (owner === undefined) return;
        let ownerField = fields.find(v => v.name === owner);
        if (ownerField === undefined) {
            if (mainFields !== undefined) {
                ownerField = mainFields.find(v => v.name === owner);
            }
            if (ownerField === undefined) {
                return '主字段 ' + owner + ' 不存在';
            }
        }
        let { dataType } = ownerField;
        let tuid: Tuid = (dataType as any).tuid;
        if (tuid === undefined) {
            return '主字段 ' + owner + ' 必须是Tuid类型';
        }
        let tuidArr = tuid.arrs;
        if (tuidArr === undefined) {
            return '主字段 ' + owner + ' tuid 没有定义arr'
        }
        else {
            let a = tuid.arrs.find(v => v.name === arr);
            if (a === undefined) return '主字段 ' + owner + ' Tuid ' + tuid.name + ' 没有arr属性 ' + arr;
        }
    }


    protected parseKeyValues(): { [key: string]: string[] } {
        if (this.ts.token as any !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        let keys: string[] = [];
        let arrs: string[][] = [];
        while (true) {
            if (this.ts.token as any !== Token.VAR) {
                this.ts.expect('role defination');
            }
            let { lowerVar } = this.ts;
            keys.push(lowerVar);
            this.ts.readToken();
            let { token } = this.ts;
            if (token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (token === Token.LPARENTHESE) {
                arrs.push(this.parseNamesArr());
            }
            else if (token === Token.VAR) {
                arrs.push([this.ts.lowerVar]);
                this.ts.readToken();
            }
            if (this.ts.token as any === Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
        let ret: { [key: string]: string[] } = {};
        let len = arrs.length;
        if (len === 0) {
            ret['$'] = keys;
        }
        else if (len === keys.length) {
            for (let i = 0; i < len; i++) {
                let key = keys[i];
                ret[key] = arrs[i];
            }
        }
        else {
            this.ts.error('key array syntax error');
        }
        return ret;
    }

    private parseNamesArr(): string[] {
        let arr = [];
        if (this.ts.token as any !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        while (true) {
            if (this.ts.token as any !== Token.VAR) {
                this.ts.expect('role defination');
            }
            let { lowerVar } = this.ts;
            if (arr.findIndex(v => v === lowerVar) >= 0) {
                this.ts.error(`'${lowerVar}' is already in list`);
            }
            arr.push(lowerVar);
            this.ts.readToken();
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token as any === Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
        return arr;
    }

    protected parseInBuses(actionHasInBus: ActionHasInBus) {
        for (; ;) {
            if (this.ts.isKeyword('bus') === false) break;
            this.ts.readToken();
            let { inBuses } = actionHasInBus;
            if (inBuses === undefined) {
                inBuses = actionHasInBus.inBuses = [];
            }
            let inBus = new InBusAction(actionHasInBus);
            inBus.parser(this.context).parse();
            inBuses.push(inBus);
        }
    }

}

export class HasInBusSpace extends Space {
    private entityHasInBus: ActionHasInBus;
    constructor(outerSpace: Space, entityHasInBus: ActionHasInBus) {
        super(outerSpace);
        this.entityHasInBus = entityHasInBus;
    }

    protected _getArr(name: string): Arr {
        let { arrs } = this.entityHasInBus;
        if (arrs === undefined) return;
        return arrs.find(v => v.name === name);
    }
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer { return; }
}

export abstract class PEntity<T extends Entity> extends PEntityBase<T> {
    protected setName() {
        let { type, defaultAccessibility } = this.entity;
        if (this.ts.token === Token.SHARP) {
            if (defaultAccessibility === EntityAccessibility.invisible) {
                this.error(`${type}默认不可见，所以不需要#`);
            }
            this.entity.isPrivate = true;
            this.ts.readToken();
        }
        else if (this.ts.token === Token.MUL) {
            if (defaultAccessibility === EntityAccessibility.visible) {
                this.error(`${type}默认可见，所以不需要*`);
            }
            this.entity.isPrivate = false;
            this.ts.readToken();
        }
        else {
            switch (defaultAccessibility) {
                case EntityAccessibility.invisible:
                    this.entity.isPrivate = true;
                    break;
                case EntityAccessibility.visible:
                    this.entity.isPrivate = false;
                    break;
            }
        }
        let { _var, lowerVar } = this.ts;
        let { isSys } = this.context;
        let { token } = this.ts;
        if ((isSys === true && token !== Token.VAR && token !== Token.DOLLARVAR)
            ||
            (isSys === false && token !== Token.VAR)) {
            this.error(`${this.entity.type.toUpperCase()} 应该定义名称`);
        }
        if (this.context.checkName(lowerVar) === false) {
            this.error('entity名字不能有特殊字符: ' + _var);
        }
        else {
            (this.entity as Entity).isSys = true;
        }


        (this.entity as Entity).name = lowerVar;
        if (_var !== this.ts.lowerVar) {
            (this.entity as Entity).jName = _var;
        }
        this.ts.readToken();
        this.parseVersion();
    }

    protected parseVersion() {
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.NUM) {
                this.ts.expectToken(Token.NUM);
            }
            this.entity.ver = this.ts.dec;
            this.ts.readToken();
        }
    }

    protected saveSource() {
        this.entity.source = this.getSource();
    }

    born(bordCode: string[]) {
        // let a: PActionBase
    }

    protected pushSharpField(sharpField: SharpField) {
        if (this.sharpFields === undefined) this.sharpFields = [];
        this.sharpFields.push(sharpField);
        this.entity.pushSharpFields(sharpField);
    }
    /*
    // ROLE(a(a,b), c(d,e), e)
    // USER(UserStaff(a,b))  UserStaff is IX
    protected parseRole(): void {
        if (this.ts.isKeyword('role') === false) return;
        this.ts.readToken();
        this.entity.role = this.parseKeyValues();
    }
    */
    /*
    protected parseUser(): { [key: string]: string[] } {
        if (this.ts.isKeyword('user') === false) return;
        this.ts.readToken();
        return this.parseKeyValues();
    }
    */
    protected scanInBuses(space: Space, actionHasInBus: ActionHasInBus): boolean {
        let ok = true;
        let { inBuses, arrs } = actionHasInBus;
        if (inBuses === undefined) return true;
        if (arrs === undefined) {
            arrs = actionHasInBus.arrs = [];
        }
        for (let inBus of inBuses) {
            if (inBus.pelement.scan(space) === false) {
                ok = false;
                continue;
            }
            let { faceQuerySchema } = inBus;
            if (faceQuerySchema === undefined) {
                ok = false;
                continue;
            }
            let arrMain = new Arr(this.entity.uq);
            arrMain.name = inBus.busVar;
            arrs.push(arrMain);
            arrMain.isBus = true;
            let queryReturns = faceQuerySchema.returns;
            for (let busField of queryReturns) {
                let { name, type } = busField;
                if (type !== 'array') {
                    arrMain.fields.push(faceField(name, type));
                    continue;
                }
                let arr = new Arr(this.entity.uq);
                arr.name = inBus.busVar + '.' + name;
                arr.fields = busFieldsToFields(busField.fields);
                arrs.push(arr);
                arr.isBus = true;
            }
            //let theSpace = new InBusActionSpace(space, inBus)
            //inBus.pelement.scan(theSpace);
        }
        return ok;
    }

    scanDoc1(): boolean {
        return true;
    }

    scanDoc2(): boolean {
        this.log(`entity type ${this.entity.type.toUpperCase()} is not supported in UQ2`);
        return false;
    }
}

interface PIndex {
    name: string;
    unique: boolean;
    //unit: boolean;
    fields: string[];
}
export interface PFieldsValues {
    fields: string[];
    fieldsInit?: string[];           // 仅仅没值才赋值
    hasId?: boolean;
    values: (ValueExpression[])[];
}
export abstract class PEntityWithTable<T extends EntityWithTable> extends PEntity<T> {
    protected fieldsValuesList: PFieldsValues[];
    protected indexes: PIndex[];

    protected parseIndex() {
        if (this.ts.token !== Token.VAR) this.expect('index name');
        let indexName = this.ts.lowerVar;
        this.ts.readToken();

        if (this.indexes === undefined) this.indexes = [];
        else {
            let ind = this.indexes.find(v => v.name === indexName);
            if (ind !== undefined) this.error('index name has been used');
        }
        let index: PIndex = {
            name: indexName,
            unique: false,
            //unit: this.entity.global === false && this.context.hasUnit === true,
            fields: [],
        };
        if (this.ts.token as any !== Token.LPARENTHESE) {
            this.indexes.push(index);
            return;
        }
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token !== Token.VAR) this.expect('字段名');
            index.fields.push(this.ts.lowerVar);
            this.ts.readToken();
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                    break;
                case Token.COMMA:
                    this.ts.readToken();
                    continue;
                case Token.RPARENTHESE:
                    this.ts.readToken();
                    if (this.ts.isKeyword('unique')) {
                        this.ts.readToken();
                        index.unique = true;
                    }
                    this.indexes.push(index);
                    return;
            }
        }
    }

    protected parseSys() {
        this.ts.readToken();
        if (this.ts.token !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        const sys = ['create', 'update'];
        for (; ;) {
            if (this.ts.token !== Token.VAR || this.ts.varBrace === true) {
                this.ts.expect(...sys);
            }
            switch (this.ts.lowerVar) {
                default: this.ts.expect(...sys); break;
                case 'create': this.entity.stampCreate = true; break;
                case 'update': this.entity.stampUpdate = true; break;
            }
            this.ts.readToken();
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
    }

    protected parsePermit(): Permit {
        if (this.ts.isKeyword('role') === false) return;
        this.ts.readToken();
        let role: string;
        if (this.ts.token === Token.VAR) {
            role = this.ts.lowerVar;
            this.ts.readToken();
        }
        let write: string[] = [];
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token !== Token.VAR as any) {
                    this.ts.expectToken(Token.VAR);
                }
                write.push(this.ts.lowerVar);
                this.ts.readToken();
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token !== Token.RPARENTHESE as any) {
                    this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                    break;
                }
            }
        }
        return { role, write };
    }

    protected scanPermit(space: Space, permit: Permit): boolean {
        if (permit === undefined) return true;
        let ok = true;
        let { role, write } = permit;
        if (!role) role = '$';
        function logRoleNotExists(role: string, sub: string) {
            this.log(`role '${role}.${sub}' is not exists`);
        }
        let roleObj = space.getRole();
        if (!roleObj) {
            this.log('no role defined');
            ok = false;
        }
        else {
            if (roleObj.isValid(role, null) === false) {
                logRoleNotExists(role, '');
                ok = false;
            }
            for (let w of write) {
                if (roleObj.isValid(role, w) === false) {
                    logRoleNotExists(role, w);
                    ok = false;
                }
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = this.checkAutoInc();

        if (this.indexes !== undefined) {
            this.entity.indexes = [];
            let { indexes } = this.entity;
            for (let ind of this.indexes) {
                let { name, unique, fields } = ind;
                let index = new Index(name, unique);
                //index.unit = unit;
                index.fields = fields.map(v => {
                    let f = this.entity.getField(v);
                    if (f === undefined) {
                        this.log(`field ${v} not exists`);
                        ok = false;
                    }
                    return f;
                });
                indexes.push(index);
            }
        }

        if (this.scanKeyValues() === false) ok = false;
        return ok;
    }

    private scanKeyValues() {
        const { keyValues } = this.entity;
        if (keyValues === undefined) return true;
        this.entity.keyValuesSchema = {};
        for (let i in keyValues) {
            let { key, val } = keyValues[i];
            if (key === undefined) key = i;
            let scalarValue: string | number;
            if (Array.isArray(val) === true) {
                let [v0, v1] = val as [string, string];
                scalarValue = this.entity.uq.calcKeyValue(v0, v1);
                if (scalarValue === undefined) {
                    this.log(`${v0}.${v1} is not defined`);
                }
            }
            else {
                scalarValue = val as string | number;
            }
            this.entity.keyValuesSchema[key] = scalarValue;
        }
        return true;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        let fields = this.entity.getFields();
        for (let f of fields) {
            if (f === undefined) continue;
            let { dataType, defaultValue } = f;
            if (dataType.type !== 'enum') continue;
            if (!defaultValue) continue;
            if (Array.isArray(defaultValue) === true) {
                let [enumType, enumValue] = defaultValue as string[];
                let enm = uq.enums[enumType];
                if (!enm) {
                    this.log(`${enumType} is not a enum type`);
                    ok = false;
                }
                else {
                    let ev = enm.keyValues[enumValue];
                    if (!ev) {
                        this.log(`ENUM ${enumType} does not contain value ${enumValue}`);
                        ok = false;
                    }
                    else {
                        f.defaultValue = String(ev.val);
                    }
                }
            }
        }
        return ok;
    }

    protected checkAutoInc(): boolean {
        let fields = this.entity.getFields();
        let autoIncFields: Field[] = [];
        for (let f of fields) {
            if (f === undefined) continue;
            if (f.autoInc === true) {
                autoIncFields.push(f);
            }
        }
        if (autoIncFields.length <= 1) return true;
        this.log('There are more than one auto increment fields: ' + autoIncFields.map(f => f.name).join(', '));
        return false;
    }


    protected parseFieldsValuesList() {
        this.fieldsValuesList = [];
        this.entity.keyValues = {};
        for (; ;) {
            this.parseFieldsValues();
            if (this.ts.token !== Token.ADD) break;
            this.ts.readToken();
        }
    }

    private parseFieldsValues() {
        let { fields, fieldsInit } = this.parseFields();
        let values: (ValueExpression[])[] = [];
        if (this.ts.isKeyword('values') === false) {
            this.ts.expect('Values');
        }
        this.ts.readToken();
        for (; ;) {
            let valArr = this.parseValues();
            values.push(valArr);
            if (this.ts.token !== Token.COMMA) break;
            this.ts.readToken();
            if (this.ts.token as any === Token.SEMICOLON) break;
        }
        this.fieldsValuesList.push({ fields, fieldsInit, values });
    }

    private parseFields(): { fields: string[]; fieldsInit: string[]; } {
        let fields: string[] = [];
        let fieldsInit: string[];
        if (this.ts.token !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let fieldName = this.ts.lowerVar;
            fields.push(fieldName);
            this.ts.readToken();
            if (this.ts.isKeyword('on') === true) {
                this.ts.readToken();
                if (this.ts.isKeyword('init') === false) {
                    this.ts.expect('init');
                }
            }
            if (this.ts.isKeyword('init') === true) {
                this.ts.readToken();
                if (fieldsInit === undefined) fieldsInit = [];
                fieldsInit.push(fieldName);
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        return { fields, fieldsInit };
    }

    private parseValues(): ValueExpression[] {
        let vals: ValueExpression[] = [];
        if (this.ts.token !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            let exp = new ValueExpression();
            exp.parser(this.context).parse();
            vals.push(exp);
            if (this.ts.isKeyword('as') === true) {
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                let { lowerVar, _var } = this.ts;
                this.ts.readToken();
                if (this.entity.keyValues[lowerVar] !== undefined) {
                    this.ts.error(`the name ${lowerVar} has been used in ${this.entity.type} ${this.entity.name}`);
                }
                let scalarValue: string | number | [string, string] = exp.scalarValue;
                if (scalarValue === undefined) {
                    const { atoms } = exp;
                    const constEnumOnly = () => {
                        const err = `only const value or enum value can be used`;
                        this.ts.error(err);
                    }
                    if (atoms.length !== 1) constEnumOnly();
                    const atom = atoms[0];
                    if (atom.type !== 'var') constEnumOnly();
                    const { _var } = atom as VarOperand;
                    if (_var.length !== 2) constEnumOnly();
                    scalarValue = _var as [string, string];
                }
                this.entity.keyValues[lowerVar] = {
                    key: lowerVar === _var ? undefined : _var,
                    val: scalarValue,
                };
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        return vals;
    }

    protected scanFieldsValuesKey(space: Space, fieldsValues: PFieldsValues): boolean {
        return true;
    }

    protected scanFieldsValuesList(space: Space): boolean {
        let ok = true;
        this.entity.fieldsValuesList = [];
        let { fieldsValuesList } = this.entity;
        let fields = this.entity.getFields();
        for (let fieldsValues of this.fieldsValuesList) {
            if (this.scanFieldsValuesKey(space, fieldsValues) === false) {
                ok = false;
            }
            let fieldArr: Field[] = [];
            let { fields: fns, fieldsInit: fnsInit, values } = fieldsValues;
            let hasId: boolean = undefined;
            for (let fn of fns) {
                if (fn === 'id') {
                    hasId = true;
                }
                let field = fields.find(v => v.name === fn);
                if (field === undefined) {
                    ok = false;
                    this.log(`field ${fn} is not defined`);
                }
                fieldArr.push(field);
            }
            let fieldArrInit: Field[];
            if (fnsInit !== undefined) {
                fieldArrInit = [];
                for (let fn of fnsInit) {
                    let field = fields.find(v => v.name === fn);
                    fieldArrInit.push(field);
                }
            }
            let len = fns.length;
            for (let val of values) {
                if (val.length !== len) {
                    ok = false;
                    this.log(`values length is not equal to fields length`);
                }
                for (let exp of val) {
                    if (exp.pelement.scan(space) === false) ok = false;
                }
            }
            fieldsValuesList.push({ fields: fieldArr, fieldsInit: fieldArrInit, values: values, hasId });
        }
        return ok;
    }
}

export abstract class PActionBase<T extends ActionBase> extends PEntity<T> {
    private proxy: string;
    private auth: string;
    protected get actionBase(): ActionBase { return this.entity; }

    scanDoc2(): boolean {
        return true;
    }

    protected parseParams(allowArr: boolean = true) {
        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        if (this.ts.token === Token.RPARENTHESE) {
            this.ts.readToken();
            return;
        }
        for (; ;) {
            let key = this.ts.lowerVar;
            switch (key) {
                case 'arr':
                case 'array':
                    if (allowArr === true) {
                        this.ts.readToken();
                        this.parseArray();
                    }
                    else {
                        this.ts.error('arr is not allowed');
                    }
                    break;
                case 'out':
                    this.parseOutField();
                    break;
                case 'inout':
                    this.parseInOutField();
                    break;
                default:
                    if (this.ts.token === Token.SHARP || this.ts.token === Token.MUL) {
                        this.pushSharpField(this.parseSharpField(this.entity.fields.length));
                    }
                    else {
                        this.parseField();
                    }
                    break;
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
            }
            else {
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.expectToken(Token.RPARENTHESE, Token.COMMA);
            }
        }
    }

    protected parseOutField() {
        this.ts.error('out field is not allowed');
    }

    protected parseInOutField() {
        this.ts.error('inout field is not allowed');
    }

    private parseArray() {
        let ab = this.actionBase;
        let arr = new Arr(ab.uq);
        let parser = arr.parser(this.context);
        parser.parse();
        ab.addArr(arr);
    }

    protected parseField(): Field {
        let ret = this.field(true);
        this.actionBase.fields.push(ret);
        return ret;
    }

    protected parseProxyAuth() {
        if (this.ts.isKeyword('proxy') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.proxy = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('auth') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.auth = this.ts.lowerVar;
            this.ts.readToken();
        }
    }

    protected scanProxyAuth(space: Space): boolean {
        let ok = true;
        if (this.proxy) {
            let entity = space.getEntity(this.proxy);
            if (!entity) {
                this.log(`PROXY ${this.proxy} is not defined`);
                ok = false;
            }
            else {
                if (entity.type !== 'sysproc') {
                    this.log(`PROXY ${this.proxy} must be a SysProc`);
                    ok = false;
                }
                let func = entity as SysProc;
                if (func.fields.length !== 2) {
                    this.log(`PROXY SysProc ${this.proxy} can have only 2 parameter`);
                    ok = false;
                }
                else if (func.fields[1].paramType !== ProcParamType.out) {
                    this.log(`PROXY SysProc ${this.proxy} second parameter must be out`);
                    ok = false;
                }
                this.entity.proxy = func;
            }
        }
        if (this.auth) {
            let entity = space.getEntity(this.auth);
            if (!entity) {
                this.log(`AUTH ${this.auth} is not defined`);
                ok = false;
            }
            else {
                if (entity.type !== 'sysproc') {
                    this.log(`AUTH ${this.auth} must be a SysProc`);
                    ok = false;
                }
                let func = entity as SysProc;
                if (func.fields.length !== 1) {
                    this.log(`AUTH SysProc ${this.auth} can have only 1 parameter`);
                    ok = false;
                }
                else if (func.fields[0].paramType !== ProcParamType.out) {
                    this.log(`AUTH SysProc ${this.auth} parameter must be out`);
                }
                this.entity.auth = func;
            }
        }
        return ok;
    }
}

const dollarVars = [
    '$unit', '$user', '$date', '$site'
];
export class ActionBaseSpace extends Space {
    private actionBase: ActionBase;
    private varNo: number = 1;
    constructor(outer: Space, actionBase: ActionBase) {
        super(outer);
        this.actionBase = actionBase;
    }
    protected _getEntityTable(name: string): Entity & Table {
        let arr = this.actionBase?.arrs.find(v => v.name === name);
        return arr;
    }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (dollarVars.indexOf(name) >= 0) return new NamePointer();
        return this.actionBase?.fields.find(f => f.name === name) !== undefined ?
            new NamePointer() : undefined;
    }
    protected _getArr(name: string): Arr {
        return this.actionBase?.arrs.find(v => v.name === name);
    }
    protected _setTransactionOff(off: boolean): boolean {
        this.actionBase.transactionOff = off;
        return true;
    }
    protected _getActionBase(): ActionBase {
        return this.actionBase;
    }
    getVarNo() {
        return this.varNo;
    }
    setVarNo(value: number) { this.varNo = value; }
    //getStatementNo() { return this.statementNo; }
    //setStatementNo(value: number) { this.statementNo = value; }
    addTableVar(tableVar: TableVar): boolean {
        return this.actionBase.addTableVar(tableVar);
    }
    getTableVar(name: string): TableVar {
        return this.actionBase?.getTableVar(name);
    }
}

export class EntitySpace extends Space {
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer { return; }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitySpace = exports.ActionBaseSpace = exports.PActionBase = exports.PEntityWithTable = exports.PEntity = exports.HasInBusSpace = exports.PEntityBase = exports.busFieldsToFields = exports.busFieldToField = exports.faceField = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const space_1 = require("../space");
const tokens_1 = require("../tokens");
function faceField(name, type) {
    switch (type) {
        default: return;
        case 'number': return (0, il_1.decField)(name, 32, 6);
        case 'string': return (0, il_1.textField)(name);
        case 'id': return (0, il_1.bigIntField)(name);
    }
}
exports.faceField = faceField;
function busFieldToField(f) {
    let { name, type } = f;
    return faceField(name, type);
}
exports.busFieldToField = busFieldToField;
function busFieldsToFields(busFields) {
    return busFields.map(v => busFieldToField(v));
}
exports.busFieldsToFields = busFieldsToFields;
class PEntityBase extends element_1.PElement {
    constructor(entity, context) {
        super(entity, context);
        this.entity = entity;
    }
    parseSharpField(index) {
        this.ts.readToken();
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
        }
        let { token } = this.ts;
        if (token !== tokens_1.Token.VAR && token !== tokens_1.Token.DOLLARVAR) {
            this.ts.expectToken(tokens_1.Token.VAR);
        }
        let IDName = this.ts.lowerVar;
        this.ts.readToken();
        return {
            IDName,
            index,
            fields: undefined,
        };
    }
    replaceSharpFields(space, sharpFields, fields) {
        if (sharpFields === undefined)
            return true;
        let ok = true;
        let coll = {};
        let newFields = [];
        let p = 0;
        function pushField(f) {
            let fn = f.name;
            if (coll[fn] === undefined) {
                coll[f.name] = f;
                newFields.push(f);
            }
        }
        for (let pf of sharpFields) {
            let { IDName, index } = pf;
            for (let i = p; i < index; i++)
                pushField(fields[i]);
            let entity = space.getEntity(IDName);
            if (entity === undefined || ['id', 'idx'].indexOf(entity.type) < 0) {
                this.log(`${IDName} is not ID or IDX`);
                ok = false;
            }
            let ID = entity;
            let IDFields = ID.fields;
            let sFields = [];
            pf.fields = sFields;
            function pushSField(f) {
                let fn = f.name;
                if (coll[fn] === undefined) {
                    coll[f.name] = f;
                    newFields.push(f);
                    sFields.push(f);
                }
            }
            for (let f of IDFields)
                pushSField(f);
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
    scanParamsTuid(space, entity, ab) {
        let ok = true;
        let { fields, arrs } = ab;
        if (this.scanTuidFields(space, entity, fields) === false)
            ok = false;
        if (arrs !== undefined) {
            for (let arr of arrs) {
                if (this.scanTuidFields(space, entity, arr.fields) === false)
                    ok = false;
            }
        }
        return ok;
    }
    scanParamsOwner(entity, ab) {
        let ok = true;
        let { fields, arrs } = ab;
        if (this.scanOwnerFields(entity, fields) === false)
            ok = false;
        if (arrs !== undefined) {
            for (let arr of arrs) {
                if (this.scanOwnerFields(entity, arr.fields, fields) === false)
                    ok = false;
            }
        }
        return ok;
    }
    scanTuidFields(space, entity, fields) {
        let ok = true;
        if (fields === undefined)
            return ok;
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
    scanDataType(space, dataType) {
        let { pelement } = dataType;
        if (pelement === undefined)
            return undefined;
        let ret = pelement.scanReturnMessage(space);
        if (ret === undefined)
            return undefined;
        return ret;
    }
    scanOwnerFields(entity, fields, mainFields) {
        if (fields === undefined)
            return true;
        let ok = true;
        for (let field of fields) {
            let ret = this.scanOwnerField(field, fields, mainFields);
            if (ret === undefined)
                continue;
            ok = false;
            this.log(entity.type + ' ' + entity.jName + ' 字段 ' + field.name + ' ' + ret);
        }
        return ok;
    }
    scanOwnerField(field, fields, mainFields) {
        let { owner, arr } = field.dataType;
        if (owner === undefined)
            return;
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
        let tuid = dataType.tuid;
        if (tuid === undefined) {
            return '主字段 ' + owner + ' 必须是Tuid类型';
        }
        let tuidArr = tuid.arrs;
        if (tuidArr === undefined) {
            return '主字段 ' + owner + ' tuid 没有定义arr';
        }
        else {
            let a = tuid.arrs.find(v => v.name === arr);
            if (a === undefined)
                return '主字段 ' + owner + ' Tuid ' + tuid.name + ' 没有arr属性 ' + arr;
        }
    }
    parseKeyValues() {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        let keys = [];
        let arrs = [];
        while (true) {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('role defination');
            }
            let { lowerVar } = this.ts;
            keys.push(lowerVar);
            this.ts.readToken();
            let { token } = this.ts;
            if (token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (token === tokens_1.Token.LPARENTHESE) {
                arrs.push(this.parseNamesArr());
            }
            else if (token === tokens_1.Token.VAR) {
                arrs.push([this.ts.lowerVar]);
                this.ts.readToken();
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
        let ret = {};
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
    parseNamesArr() {
        let arr = [];
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        while (true) {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('role defination');
            }
            let { lowerVar } = this.ts;
            if (arr.findIndex(v => v === lowerVar) >= 0) {
                this.ts.error(`'${lowerVar}' is already in list`);
            }
            arr.push(lowerVar);
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
        return arr;
    }
    parseInBuses(actionHasInBus) {
        for (;;) {
            if (this.ts.isKeyword('bus') === false)
                break;
            this.ts.readToken();
            let { inBuses } = actionHasInBus;
            if (inBuses === undefined) {
                inBuses = actionHasInBus.inBuses = [];
            }
            let inBus = new il_1.InBusAction(actionHasInBus);
            inBus.parser(this.context).parse();
            inBuses.push(inBus);
        }
    }
}
exports.PEntityBase = PEntityBase;
class HasInBusSpace extends space_1.Space {
    constructor(outerSpace, entityHasInBus) {
        super(outerSpace);
        this.entityHasInBus = entityHasInBus;
    }
    _getArr(name) {
        let { arrs } = this.entityHasInBus;
        if (arrs === undefined)
            return;
        return arrs.find(v => v.name === name);
    }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) { return; }
}
exports.HasInBusSpace = HasInBusSpace;
class PEntity extends PEntityBase {
    setName() {
        let { type, defaultAccessibility } = this.entity;
        if (this.ts.token === tokens_1.Token.SHARP) {
            if (defaultAccessibility === il_1.EntityAccessibility.invisible) {
                this.error(`${type}默认不可见，所以不需要#`);
            }
            this.entity.isPrivate = true;
            this.ts.readToken();
        }
        else if (this.ts.token === tokens_1.Token.MUL) {
            if (defaultAccessibility === il_1.EntityAccessibility.visible) {
                this.error(`${type}默认可见，所以不需要*`);
            }
            this.entity.isPrivate = false;
            this.ts.readToken();
        }
        else {
            switch (defaultAccessibility) {
                case il_1.EntityAccessibility.invisible:
                    this.entity.isPrivate = true;
                    break;
                case il_1.EntityAccessibility.visible:
                    this.entity.isPrivate = false;
                    break;
            }
        }
        let { _var, lowerVar } = this.ts;
        let { isSys } = this.context;
        let { token } = this.ts;
        if ((isSys === true && token !== tokens_1.Token.VAR && token !== tokens_1.Token.DOLLARVAR)
            ||
                (isSys === false && token !== tokens_1.Token.VAR)) {
            this.error(`${this.entity.type.toUpperCase()} 应该定义名称`);
        }
        if (this.context.checkName(lowerVar) === false) {
            this.error('entity名字不能有特殊字符: ' + _var);
        }
        else {
            this.entity.isSys = true;
        }
        this.entity.name = lowerVar;
        if (_var !== this.ts.lowerVar) {
            this.entity.jName = _var;
        }
        this.ts.readToken();
        this.parseVersion();
    }
    parseVersion() {
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.NUM) {
                this.ts.expectToken(tokens_1.Token.NUM);
            }
            this.entity.ver = this.ts.dec;
            this.ts.readToken();
        }
    }
    saveSource() {
        this.entity.source = this.getSource();
    }
    born(bordCode) {
        // let a: PActionBase
    }
    pushSharpField(sharpField) {
        if (this.sharpFields === undefined)
            this.sharpFields = [];
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
    scanInBuses(space, actionHasInBus) {
        let ok = true;
        let { inBuses, arrs } = actionHasInBus;
        if (inBuses === undefined)
            return true;
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
            let arrMain = new il_1.Arr(this.entity.uq);
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
                let arr = new il_1.Arr(this.entity.uq);
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
    scanDoc1() {
        return true;
    }
    scanDoc2() {
        this.log(`entity type ${this.entity.type.toUpperCase()} is not supported in UQ2`);
        return false;
    }
}
exports.PEntity = PEntity;
class PEntityWithTable extends PEntity {
    parseIndex() {
        if (this.ts.token !== tokens_1.Token.VAR)
            this.expect('index name');
        let indexName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.indexes === undefined)
            this.indexes = [];
        else {
            let ind = this.indexes.find(v => v.name === indexName);
            if (ind !== undefined)
                this.error('index name has been used');
        }
        let index = {
            name: indexName,
            unique: false,
            //unit: this.entity.global === false && this.context.hasUnit === true,
            fields: [],
        };
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.indexes.push(index);
            return;
        }
        this.ts.readToken();
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR)
                this.expect('字段名');
            index.fields.push(this.ts.lowerVar);
            this.ts.readToken();
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                    break;
                case tokens_1.Token.COMMA:
                    this.ts.readToken();
                    continue;
                case tokens_1.Token.RPARENTHESE:
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
    parseSys() {
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        const sys = ['create', 'update'];
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR || this.ts.varBrace === true) {
                this.ts.expect(...sys);
            }
            switch (this.ts.lowerVar) {
                default:
                    this.ts.expect(...sys);
                    break;
                case 'create':
                    this.entity.stampCreate = true;
                    break;
                case 'update':
                    this.entity.stampUpdate = true;
                    break;
            }
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
    }
    parsePermit() {
        if (this.ts.isKeyword('role') === false)
            return;
        this.ts.readToken();
        let role;
        if (this.ts.token === tokens_1.Token.VAR) {
            role = this.ts.lowerVar;
            this.ts.readToken();
        }
        let write = [];
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                write.push(this.ts.lowerVar);
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                    this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                    break;
                }
            }
        }
        return { role, write };
    }
    scanPermit(space, permit) {
        if (permit === undefined)
            return true;
        let ok = true;
        let { role, write } = permit;
        if (!role)
            role = '$';
        function logRoleNotExists(role, sub) {
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
    scan(space) {
        let ok = this.checkAutoInc();
        if (this.indexes !== undefined) {
            this.entity.indexes = [];
            let { indexes } = this.entity;
            for (let ind of this.indexes) {
                let { name, unique, fields } = ind;
                let index = new il_1.Index(name, unique);
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
        if (this.scanKeyValues() === false)
            ok = false;
        return ok;
    }
    scanKeyValues() {
        const { keyValues } = this.entity;
        if (keyValues === undefined)
            return true;
        this.entity.keyValuesSchema = {};
        for (let i in keyValues) {
            let { key, val } = keyValues[i];
            if (key === undefined)
                key = i;
            let scalarValue;
            if (Array.isArray(val) === true) {
                let [v0, v1] = val;
                scalarValue = this.entity.uq.calcKeyValue(v0, v1);
                if (scalarValue === undefined) {
                    this.log(`${v0}.${v1} is not defined`);
                }
            }
            else {
                scalarValue = val;
            }
            this.entity.keyValuesSchema[key] = scalarValue;
        }
        return true;
    }
    scan2(uq) {
        let ok = true;
        let fields = this.entity.getFields();
        for (let f of fields) {
            if (f === undefined)
                continue;
            let { dataType, defaultValue } = f;
            if (dataType.type !== 'enum')
                continue;
            if (!defaultValue)
                continue;
            if (Array.isArray(defaultValue) === true) {
                let [enumType, enumValue] = defaultValue;
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
    checkAutoInc() {
        let fields = this.entity.getFields();
        let autoIncFields = [];
        for (let f of fields) {
            if (f === undefined)
                continue;
            if (f.autoInc === true) {
                autoIncFields.push(f);
            }
        }
        if (autoIncFields.length <= 1)
            return true;
        this.log('There are more than one auto increment fields: ' + autoIncFields.map(f => f.name).join(', '));
        return false;
    }
    parseFieldsValuesList() {
        this.fieldsValuesList = [];
        this.entity.keyValues = {};
        for (;;) {
            this.parseFieldsValues();
            if (this.ts.token !== tokens_1.Token.ADD)
                break;
            this.ts.readToken();
        }
    }
    parseFieldsValues() {
        let { fields, fieldsInit } = this.parseFields();
        let values = [];
        if (this.ts.isKeyword('values') === false) {
            this.ts.expect('Values');
        }
        this.ts.readToken();
        for (;;) {
            let valArr = this.parseValues();
            values.push(valArr);
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.SEMICOLON)
                break;
        }
        this.fieldsValuesList.push({ fields, fieldsInit, values });
    }
    parseFields() {
        let fields = [];
        let fieldsInit;
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
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
                if (fieldsInit === undefined)
                    fieldsInit = [];
                fieldsInit.push(fieldName);
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        return { fields, fieldsInit };
    }
    parseValues() {
        let vals = [];
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (;;) {
            let exp = new il_1.ValueExpression();
            exp.parser(this.context).parse();
            vals.push(exp);
            if (this.ts.isKeyword('as') === true) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                let { lowerVar, _var } = this.ts;
                this.ts.readToken();
                if (this.entity.keyValues[lowerVar] !== undefined) {
                    this.ts.error(`the name ${lowerVar} has been used in ${this.entity.type} ${this.entity.name}`);
                }
                let scalarValue = exp.scalarValue;
                if (scalarValue === undefined) {
                    const { atoms } = exp;
                    const constEnumOnly = () => {
                        const err = `only const value or enum value can be used`;
                        this.ts.error(err);
                    };
                    if (atoms.length !== 1)
                        constEnumOnly();
                    const atom = atoms[0];
                    if (atom.type !== 'var')
                        constEnumOnly();
                    const { _var } = atom;
                    if (_var.length !== 2)
                        constEnumOnly();
                    scalarValue = _var;
                }
                this.entity.keyValues[lowerVar] = {
                    key: lowerVar === _var ? undefined : _var,
                    val: scalarValue,
                };
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        return vals;
    }
    scanFieldsValuesKey(space, fieldsValues) {
        return true;
    }
    scanFieldsValuesList(space) {
        let ok = true;
        this.entity.fieldsValuesList = [];
        let { fieldsValuesList } = this.entity;
        let fields = this.entity.getFields();
        for (let fieldsValues of this.fieldsValuesList) {
            if (this.scanFieldsValuesKey(space, fieldsValues) === false) {
                ok = false;
            }
            let fieldArr = [];
            let { fields: fns, fieldsInit: fnsInit, values } = fieldsValues;
            let hasId = undefined;
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
            let fieldArrInit;
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
                    if (exp.pelement.scan(space) === false)
                        ok = false;
                }
            }
            fieldsValuesList.push({ fields: fieldArr, fieldsInit: fieldArrInit, values: values, hasId });
        }
        return ok;
    }
}
exports.PEntityWithTable = PEntityWithTable;
class PActionBase extends PEntity {
    get actionBase() { return this.entity; }
    scanDoc2() {
        return true;
    }
    parseParams(allowArr = true) {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.RPARENTHESE) {
            this.ts.readToken();
            return;
        }
        for (;;) {
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
                    if (this.ts.token === tokens_1.Token.SHARP || this.ts.token === tokens_1.Token.MUL) {
                        this.pushSharpField(this.parseSharpField(this.entity.fields.length));
                    }
                    else {
                        this.parseField();
                    }
                    break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
            else {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
            }
        }
    }
    parseOutField() {
        this.ts.error('out field is not allowed');
    }
    parseInOutField() {
        this.ts.error('inout field is not allowed');
    }
    parseArray() {
        let ab = this.actionBase;
        let arr = new il_1.Arr(ab.uq);
        let parser = arr.parser(this.context);
        parser.parse();
        ab.addArr(arr);
    }
    parseField() {
        let ret = this.field(true);
        this.actionBase.fields.push(ret);
        return ret;
    }
    parseProxyAuth() {
        if (this.ts.isKeyword('proxy') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            this.proxy = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('auth') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            this.auth = this.ts.lowerVar;
            this.ts.readToken();
        }
    }
    scanProxyAuth(space) {
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
                let func = entity;
                if (func.fields.length !== 2) {
                    this.log(`PROXY SysProc ${this.proxy} can have only 2 parameter`);
                    ok = false;
                }
                else if (func.fields[1].paramType !== il_1.ProcParamType.out) {
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
                let func = entity;
                if (func.fields.length !== 1) {
                    this.log(`AUTH SysProc ${this.auth} can have only 1 parameter`);
                    ok = false;
                }
                else if (func.fields[0].paramType !== il_1.ProcParamType.out) {
                    this.log(`AUTH SysProc ${this.auth} parameter must be out`);
                }
                this.entity.auth = func;
            }
        }
        return ok;
    }
}
exports.PActionBase = PActionBase;
const dollarVars = [
    '$unit', '$user', '$date', '$site'
    // 'pagestart', 'pagesize',
    // '$date', '$id', '$state', '$row', '$sheet_date', '$sheet_no', '$sheet_discription'
];
class ActionBaseSpace extends space_1.Space {
    constructor(outer, actionBase) {
        super(outer);
        this.varNo = 1;
        this.actionBase = actionBase;
    }
    _getEntityTable(name) {
        var _a;
        let arr = (_a = this.actionBase) === null || _a === void 0 ? void 0 : _a.arrs.find(v => v.name === name);
        return arr;
    }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        var _a;
        if (dollarVars.indexOf(name) >= 0)
            return new il_1.VarPointer();
        return ((_a = this.actionBase) === null || _a === void 0 ? void 0 : _a.fields.find(f => f.name === name)) !== undefined ?
            new il_1.VarPointer() : undefined;
    }
    _getArr(name) {
        var _a;
        return (_a = this.actionBase) === null || _a === void 0 ? void 0 : _a.arrs.find(v => v.name === name);
    }
    _setTransactionOff() {
        this.actionBase.transactionOff = true;
        return true;
    }
    _getActionBase() {
        return this.actionBase;
    }
    getVarNo() {
        return this.varNo;
    }
    setVarNo(value) { this.varNo = value; }
    //getStatementNo() { return this.statementNo; }
    //setStatementNo(value: number) { this.statementNo = value; }
    addTableVar(tableVar) {
        return this.actionBase.addTableVar(tableVar);
    }
    getTableVar(name) {
        var _a;
        return (_a = this.actionBase) === null || _a === void 0 ? void 0 : _a.getTableVar(name);
    }
}
exports.ActionBaseSpace = ActionBaseSpace;
class EntitySpace extends space_1.Space {
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) { return; }
}
exports.EntitySpace = EntitySpace;
//# sourceMappingURL=entity.js.map
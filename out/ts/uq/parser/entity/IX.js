"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIX = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
const il_2 = require("../../il");
class XField {
    static parse(name, ts) {
        ts.readToken();
        let ret;
        if (ts.isKeyword('int') === true) {
            ts.readToken();
            ret = new XFieldInt();
        }
        else if (ts.isKeyword('tiny') === true) {
            ts.readToken();
            ret = new XFieldTiny();
        }
        else if (ts.isKeyword('small') === true) {
            ts.readToken();
            ret = new XFieldSmall();
        }
        else if (ts.isKeyword('enum') === true) {
            ts.readToken();
            ret = new XFieldEnum();
            if (ts.token !== tokens_1.Token.VAR)
                ts.expectToken(tokens_1.Token.VAR);
            ret.type = ts.lowerVar;
            ts.readToken();
        }
        else if (ts.isKeyword('date') === true) {
            ts.readToken();
            ret = new XFieldDate();
        }
        else if (ts.isKeyword('type') === true) {
            let types = ['uid', 'uuid', 'ulocal', 'uminute', 'global', 'local', 'minute'];
            ts.readToken();
            ret = new XFieldId();
            if (ts.token === tokens_1.Token.VAR && ts.varBrace === false) {
                let lv = ts.lowerVar;
                switch (lv) {
                    default:
                        ts.expect(...types);
                        break;
                    case 'uid':
                    case 'uuid':
                    case 'ulocal':
                    case 'uminute':
                    case 'global':
                    case 'local':
                    case 'minute':
                        ret.idType = '$' + lv;
                        ts.readToken();
                        break;
                }
            }
            else {
                ts.expect(...types);
            }
        }
        else {
            if (ts.isKeyword('index') === true) {
                ret = new XFieldId();
            }
            else {
                if (ts.isKeyword('id') === true) {
                    ts.readToken();
                }
                if (ts.isKeyword('index') === true) {
                    ret = new XFieldId();
                }
                else if (ts.token === tokens_1.Token.VAR) {
                    let v = ts.lowerVar;
                    switch (v) {
                        case 'user':
                        case '$user':
                            ret = new XFieldUser();
                            break;
                        default:
                            ret = new XFieldId();
                            ret.idType = v;
                            break;
                    }
                    ts.readToken();
                }
                else {
                    ret = new XFieldId();
                }
            }
        }
        ret.name = name;
        return ret;
    }
    createField() { return (0, il_1.idField)(this.name, 'big', this.idType); }
    get validType() { return 'id'; }
    scan(space) {
        if (!this.name)
            return;
        if (!this.type)
            return;
        if (this.type[0] === '$')
            return;
        if (this.type === 'id') {
            if (this.idType) {
                if (this.idType[0] === '$')
                    return;
                let idEntity = space.getEntity(this.idType);
                if (!idEntity || idEntity.type !== this.validType) {
                    return `${this.idType} is not a valid ${this.validType.toUpperCase()}`;
                }
                let ID = idEntity;
                switch (ID.idType) {
                    case il_2.EnumIdType.UID:
                        this.idType = '$u';
                        break;
                    case il_2.EnumIdType.UUID:
                        this.idType = '$uu';
                        break;
                    case il_2.EnumIdType.ULocal:
                        this.idType = '$nu';
                        break;
                    case il_2.EnumIdType.Local:
                        this.idType = '$local';
                        break;
                    case il_2.EnumIdType.Global:
                        this.idType = '$global';
                        break;
                    case il_2.EnumIdType.MinuteId:
                    case il_2.EnumIdType.Minute:
                        this.idType = '$minute';
                        break;
                }
            }
            return;
        }
        let entity = space.getEntity(this.type);
        if (!entity || entity.type !== this.validType) {
            return `${this.type} is not a valid ${this.validType.toUpperCase()}`;
        }
    }
}
class XFieldUser extends XField {
    constructor() {
        super();
        this.type = 'id';
        this.idType = '$user';
    }
}
class XFieldId extends XField {
    constructor() {
        super();
        this.type = 'id';
    }
}
class XFieldInt extends XField {
    createField() { return (0, il_1.idField)(this.name, ''); }
}
class XFieldTiny extends XField {
    createField() { return (0, il_1.idField)(this.name, 'tiny'); }
}
class XFieldSmall extends XField {
    createField() { return (0, il_1.idField)(this.name, 'small'); }
}
class XFieldEnum extends XField {
    createField() { return (0, il_1.idField)(this.name, 'small'); }
    get validType() { return 'enum'; }
}
class XFieldDate extends XField {
    createField() { return (0, il_1.dateField)(this.name); }
    get validType() { return 'date'; }
    scan(space) { return; }
}
class PIX extends entity_1.PEntityWithTable {
    setXField(xField) {
        if (!xField)
            return;
        this.entity.setXField(xField.name, xField.createField());
    }
    _parse() {
        this.setName();
        if (this.ts.token === tokens_1.Token.SEMICOLON) {
            this.ts.readToken();
            this.i = new XFieldId();
            this.i.name = 'ix';
            this.x = new XFieldId();
            this.x.name = 'xi';
            return;
        }
        if (this.ts.isKeywords('const', 'uconst') === true) {
            this.entity.isConst = true;
            this.ts.readToken();
        }
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (;;) {
            let { lowerVar } = this.ts;
            switch (lowerVar) {
                case 'ixx':
                    if (this.ixx) {
                        this.error('duplicate ixx defined');
                    }
                    this.ixx = XField.parse('ixx', this.ts);
                    break;
                case 'ix':
                case 'i':
                    if (this.i) {
                        this.error(`duplicate ${lowerVar} defined`);
                    }
                    this.i = XField.parse(lowerVar, this.ts);
                    break;
                case 'xi':
                case 'x':
                    if (this.i === undefined) {
                        this.error(`${lowerVar === 'x' ? 'i' : 'ix'} must be defined first`);
                    }
                    if (this.x) {
                        this.error(`duplicate ${lowerVar} defined`);
                    }
                    this.x = XField.parse(lowerVar, this.ts);
                    if (this.i.idType === '$user') {
                        // ix user, 则id必须定义类型
                        if (!this.x.type) {
                            this.ts.expect(`${lowerVar} type define when i is user`);
                        }
                    }
                    if (this.ts.isKeyword('index') === true) {
                        this.ts.readToken();
                        this.entity.twoWayIndex = true;
                    }
                    break;
                case 'sys':
                    this.parseSys();
                    break;
                case 'prev':
                    this.ts.readToken();
                    let prev = (0, il_1.bigIntField)('prev');
                    prev.defaultValue = 0;
                    prev.nullable = false;
                    this.entity.prev = prev;
                    this.entity.fields.push(prev);
                    break;
                case 'index':
                    this.ts.readToken();
                    this.parseIndex();
                    break;
                default:
                    this.entity.fields.push(this.field(undefined));
                    break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.RPARENTHESE)
                    continue;
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else {
                this.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
            }
        }
        if (this.ts.token === tokens_1.Token.ADD) {
            this.ts.readToken();
            this.parseFieldsValuesList();
        }
    }
    scanDoc2() {
        return true;
    }
    scan(space) {
        let ok = true;
        let { permit } = this.entity;
        if (!this.i) {
            this.log('i must be defined');
            ok = false;
        }
        else {
            let msg = this.i.scan(space);
            if (msg) {
                this.log(msg);
                ok = false;
            }
        }
        if (!this.x) {
            this.log('x must be defined');
            ok = false;
        }
        else {
            let msg = this.x.scan(space);
            if (msg) {
                this.log(msg);
                ok = false;
            }
            else {
                let xiType;
                switch (this.x.idType) {
                    default:
                        xiType = il_2.EnumIdType.None;
                        break;
                    case '$uu':
                        xiType = il_2.EnumIdType.UUID;
                        break;
                    case '$u':
                        xiType = il_2.EnumIdType.ULocal;
                        break;
                    case '$global':
                        xiType = il_2.EnumIdType.Global;
                        break;
                    case '$local':
                        xiType = il_2.EnumIdType.Local;
                        break;
                    case '$minute':
                        xiType = il_2.EnumIdType.Minute;
                        break;
                }
                this.entity.xType = xiType;
            }
        }
        this.setXField(this.x);
        this.setXField(this.i);
        this.setXField(this.ixx);
        if (this.fieldsValuesList !== undefined) {
            if (this.scanFieldsValuesList(space) === false) {
                ok = false;
            }
        }
        if (permit !== undefined) {
            if (this.scanPermit(space, permit) === false)
                ok = false;
        }
        if (this.scanTuidFields(space, this.entity, this.entity.fields) === false) {
            ok = false;
        }
        return ok;
    }
    scanFieldsValuesKey(space, fieldsValues) {
        let ok = true;
        if (this.sacnFieldInFieldsValues(this.ixx, fieldsValues) === false)
            ok = false;
        if (this.sacnFieldInFieldsValues(this.i, fieldsValues) === false)
            ok = false;
        if (this.sacnFieldInFieldsValues(this.x, fieldsValues) === false)
            ok = false;
        return ok;
    }
    sacnFieldInFieldsValues(field, fieldsValues) {
        if (field === undefined)
            return true;
        let fn = field.name;
        if (fieldsValues.fields.findIndex(v => v === fn) < 0) {
            this.log(`${fn} must be one of values field`);
            return false;
        }
        return true;
    }
}
exports.PIX = PIX;
//# sourceMappingURL=IX.js.map
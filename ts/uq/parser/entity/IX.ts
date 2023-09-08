import { IX, idField, Field, dateField, ID, intField, bigIntField } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntityWithTable, PFieldsValues } from './entity';
import { TokenStream } from '../tokens';
import { EnumIdType } from '../../il';

class XField {
    static parse(name: 'ixx' | 'ix' | 'xi' | 'i' | 'x', ts: TokenStream): XField {
        ts.readToken();
        let ret: XField;
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
            if (ts.token !== Token.VAR) ts.expectToken(Token.VAR);
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
            if (ts.token === Token.VAR && ts.varBrace === false) {
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
                else if (ts.token === Token.VAR) {
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
    name: 'ixx' | 'ix' | 'xi' | 'i' | 'x';
    type: string;
    idType: string; 	// entity type
    createField(): Field { return idField(this.name, 'big', this.idType) }
    get validType(): string { return 'id' }
    scan(space: Space): string {
        if (!this.name) return;
        if (!this.type) return;
        if (this.type[0] === '$') return;
        if (this.type === 'id') {
            if (this.idType) {
                if (this.idType[0] === '$') return;
                let idEntity = space.getEntity(this.idType);
                if (!idEntity || idEntity.type !== this.validType) {
                    return `${this.idType} is not a valid ${this.validType.toUpperCase()}`;
                }
                let ID: ID = idEntity as ID;
                switch (ID.idType) {
                    case EnumIdType.UID: this.idType = '$u'; break;
                    case EnumIdType.UUID: this.idType = '$uu'; break;
                    case EnumIdType.ULocal: this.idType = '$nu'; break;
                    case EnumIdType.Local: this.idType = '$local'; break;
                    case EnumIdType.Global: this.idType = '$global'; break;
                    case EnumIdType.MinuteId:
                    case EnumIdType.Minute: this.idType = '$minute'; break;
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
    createField(): Field { return idField(this.name, '') }
}

class XFieldTiny extends XField {
    createField(): Field { return idField(this.name, 'tiny') }
}

class XFieldSmall extends XField {
    createField(): Field { return idField(this.name, 'small') }
}

class XFieldEnum extends XField {
    createField(): Field { return idField(this.name, 'small') }
    get validType(): string { return 'enum' }
}

class XFieldDate extends XField {
    createField(): Field { return dateField(this.name) }
    get validType(): string { return 'date' }
    scan(space: Space): string { return; }
}

export class PIX extends PEntityWithTable<IX> {
    private ixx: XField;
    private i: XField;
    private x: XField;

    private setXField(xField: XField) {
        if (!xField) return;
        this.entity.setXField(xField.name, xField.createField());
    }

    protected _parse() {
        this.setName();
        if (this.ts.token === Token.SEMICOLON) {
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
        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
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
                    let prev = bigIntField('prev');
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

            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token !== Token.RPARENTHESE as any) continue;
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else {
                this.expectToken(Token.RPARENTHESE, Token.COMMA);
            }
        }
        if (this.ts.token === Token.ADD) {
            this.ts.readToken();
            this.parseFieldsValuesList();
        }
    }

    scanDoc2(): boolean {
        return true;
    }

    scan(space: Space): boolean {
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
                let xiType: EnumIdType;
                switch (this.x.idType) {
                    default: xiType = EnumIdType.None; break;
                    case '$uu': xiType = EnumIdType.UUID; break;
                    case '$u': xiType = EnumIdType.ULocal; break;
                    case '$global': xiType = EnumIdType.Global; break;
                    case '$local': xiType = EnumIdType.Local; break;
                    case '$minute': xiType = EnumIdType.Minute; break;
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
            if (this.scanPermit(space, permit) === false) ok = false;
        }
        if (this.scanTuidFields(space, this.entity, this.entity.fields) === false) {
            ok = false;
        }
        return ok;
    }

    protected scanFieldsValuesKey(space: Space, fieldsValues: PFieldsValues): boolean {
        let ok = true;
        if (this.sacnFieldInFieldsValues(this.ixx, fieldsValues) === false) ok = false;
        if (this.sacnFieldInFieldsValues(this.i, fieldsValues) === false) ok = false;
        if (this.sacnFieldInFieldsValues(this.x, fieldsValues) === false) ok = false;
        return ok;
    }

    private sacnFieldInFieldsValues(field: XField, fieldsValues: PFieldsValues): boolean {
        if (field === undefined) return true;
        let fn = field.name;
        if (fieldsValues.fields.findIndex(v => v === fn) < 0) {
            this.log(`${fn} must be one of values field`);
            return false;
        }
        return true;
    }
}

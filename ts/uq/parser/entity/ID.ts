import * as _ from 'lodash';
import { Field, ID, idField, charField, IdSize, smallIntField } from '../../il';
import { EnumIdType } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PIdBase } from './idBase';
import { PFieldsValues } from './entity';

// UQ2
export class PID extends PIdBase<ID> {
    private joins: { ID: string; field: string; }[];
    scanDoc2(): boolean {
        switch (this.entity.idType) {
            case EnumIdType.UUID:
                break;
            case EnumIdType.MinuteId:
                this.entity.idType = EnumIdType.ULocal;
                this.entity.isMinute = true;
                break;
            default:
                this.entity.idType = EnumIdType.ULocal;
                break;
        }
        return true;
    }

    protected _parse() {
        let isSysQueue: boolean = false;
        this.setName();
        if (this.ts.token === Token.VAR) {
            const keys = ['uuid', 'ulocal', 'uconst', 'const', 'local', 'global', 'minuteid', 'minute'];
            if (this.ts.varBrace === true) {
                this.ts.expect(...keys);
            }
            else {
                switch (this.ts.lowerVar) {
                    default:
                        // this.ts.expect(...keys);
                        this.ts.readToken();
                        break;
                    case 'uid':
                        this.entity.idType = EnumIdType.UID;
                        this.ts.readToken();
                        break;
                    case 'uu':	// universal unique
                    case 'uuid':
                        this.entity.idType = EnumIdType.UUID;
                        this.ts.readToken();
                        break;
                    case 'ul':	// unique local identifier
                    case 'ulocal':
                        this.entity.idType = EnumIdType.ULocal;
                        this.ts.readToken();
                        break;
                    case 'uconst':
                        this.entity.isConst = true;
                        this.entity.idType = EnumIdType.ULocal;
                        this.ts.readToken();
                        break;
                    case 'sysqueue': // 内部排序使用，前端不可见
                        this.entity.idType = EnumIdType.Local;
                        this.entity.isPrivate = true;
                        this.entity.isConst = true;
                        isSysQueue = true;
                        this.ts.readToken();
                        break;
                    case 'const':
                        this.entity.isConst = true;
                        this.entity.idType = EnumIdType.Local;
                        this.ts.readToken();
                        break;
                    case 'local':
                        this.entity.idType = EnumIdType.Local;
                        this.entity.global = false;
                        this.ts.readToken();
                        break;
                    case 'global':
                        this.entity.global = true;
                        this.entity.idType = EnumIdType.Global;
                        this.ts.readToken();
                        break;
                    case 'minuteid':
                        this.entity.global = false;
                        this.entity.idType = EnumIdType.MinuteId;
                        this.entity.isMinute = true;
                        this.ts.readToken();
                        break;
                    case 'minute':
                        this.entity.global = false;
                        this.entity.idType = EnumIdType.Minute;
                        this.entity.isMinute = true;
                        this.ts.readToken();
                        break;
                }
            }
        }
        else {
            // this.error('Break changes: ID should add ULOCAL after name');
            this.entity.global = false;
            this.entity.idType = EnumIdType.ULocal;
        }
        if (this.ts.isKeyword('const') === true) {
            if (this.entity.isConst === true) {
                this.ts.error('CONST should not duplicate');
            }
            this.entity.isConst = true;
            this.ts.readToken();
        }
        if (this.ts.token === Token.SEMICOLON) {
            this.ts.readToken();
            return;
        }

        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            switch (this.ts.lowerVar) {
                case 'id':
                    this.parseId();
                    break;
                case 'key':
                    this.ts.readToken();
                    let field: Field;
                    if (this.ts.varBrace === false) {
                        let { lowerVar } = this.ts;
                        switch (lowerVar as any) {
                            case 'no':
                                this.ts.readToken();
                                field = charField('no', 20);
                                if (this.ts.token !== Token.COMMA) {
                                    this.ts.error('can not have datatype after KEY NO');
                                }
                                break;
                            case 'version':
                                this.ts.readToken();
                                if (this.ts.token !== Token.COMMA) {
                                    this.ts.error('can not have datatype after KEY VERSION');
                                }
                                field = smallIntField('version');
                                field.nullable = false;
                                field.defaultValue = 1;
                                this.entity.version = field;
                                break;
                            case 'id':
                                this.ts.readToken();
                                if (this.ts.token !== Token.COMMA) {
                                    this.ts.error('can not have datatype after KEY ID');
                                }
                                this.entity.idIsKey = true;
                                field = null;
                                break;
                        }
                    }
                    if (field !== null) {
                        if (field === undefined) {
                            field = this.field(true);
                        }
                        if (this.entity.version === undefined) {
                            this.entity.keys.push(field);
                            this.entity.fields.push(field);
                        }
                    }
                    break;
                case 'sys':
                    this.parseSys();
                    break;
                case 'index':
                    this.ts.readToken();
                    this.parseIndex();
                    break;
                default:
                    this.entity.fields.push(this.field(true));
                    break;
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token !== Token.RPARENTHESE as any) continue;
                this.ts.readToken();
                this.parseJoins();
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
        if (this.entity.id === undefined) {
            this.error('没有定义id字段');
        }
        if (isSysQueue === false) {
            if (this.ts.token === Token.ADD) {
                this.ts.readToken();
                this.parseFieldsValuesList();
            }
        }
        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
        }
        this.ts.readToken();
    }

    private parseId() {
        if (this.entity.id) {
            this.error('duplicate id defined');
        }
        this.ts.readToken();
        let idSize: IdSize = 'big';
        if (this.ts.token === Token.VAR && this.ts.varBrace === false) {
            let { lowerVar } = this.ts;
            const idSizes = ['small', 'big', 'tiny'];
            switch (lowerVar as any) {
                default:
                    this.ts.expect('minute');
                case 'minute':
                    if ([EnumIdType.UID, EnumIdType.UUID, EnumIdType.ULocal/*, EnumIdType.UMinute*/].findIndex(v => v === this.entity.idType) < 0) {
                        this.ts.expect(...idSizes);
                    }
                    else {
                        this.entity.isMinute = true;
                    }
                    break;
                case 'uuid':
                    this.entity.idType = EnumIdType.UUID;
                    break;
                case 'small':
                case 'big':
                case 'tiny': idSize = lowerVar as any; break;
            }
            this.ts.readToken();
        }
        let id = idField('id', idSize);
        id.nullable = false;
        this.entity.setId(id);
        if (this.entity.isConst === true) {
            id.autoInc = true;
        }
        return id;
    }

    protected override field(defaultNullable: boolean) {
        let field = super.field(defaultNullable);
        if (this.ts.token === Token.MUL) {
            if (field.dataType.isId === true) {
                this.ts.readToken();
                let { stars } = this.entity;
                if (stars === undefined) {
                    stars = this.entity.stars = [];
                }
                stars.push(field.sName);
            }
            else {
                this.ts.error('Only field of ID datatype can be marked as *');
            }
        }
        return field;
    }

    private parseJoins() {
        this.joins = [];
        for (; ;) {
            if (this.ts.isKeyword('join') === false) return;
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let ID = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.isKeyword('on') === false) {
                this.ts.expect('on');
            }
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let field = this.ts.lowerVar;
            this.ts.readToken();
            this.joins.push({ ID, field });
        }
    }

    scan(space: Space): boolean {
        if (!this.entity.id) return true;
        let ok = super.scan(space);
        let { keys, fields, version, permit, isConst } = this.entity;
        let coll: { [name: string]: Field } = {};
        for (let f of fields) {
            let { name } = f;
            if (coll[name]) {
                this.log(`field ${name} duplicated`);
                ok = false;
            }
            coll[name] = f;
        }
        if (this.scanTuidFields(space, this.entity, [...keys, ...fields]) === false) {
            ok = false;
        }

        if (this.fieldsValuesList !== undefined) {
            /*
            if (this.entity.isConst === false) {
                this.log('only const ID can define rows');
                ok = false;
            }
            if (idType !== EnumIdType.Local && idType !== EnumIdType.ULocal) {
                this.log('const ID can only be local');
                ok = false;
            }
            */
            if (this.scanFieldsValuesList(space) === false) {
                ok = false;
            }
        }

        if (isConst === false) {
            if (permit !== undefined) {
                if (this.scanPermit(space, permit) === false) ok = false;
            }
        }

        if (version !== undefined) {
            if (keys.length === 0) {
                this.log(`there should not be version field when there is no key field`);
                ok = false;
            }
            if (isConst === true) {
                this.log(`ID const can not have KEY version`);
                ok = false;
            }
        }

        if (this.scanJoins(space) === false) ok = false;
        return ok;
    }

    private scanJoins(space: Space): boolean {
        let ok = true;
        if (this.joins === undefined) return ok;
        if (this.joins.length === 0) return ok;
        this.entity.joins = [];
        for (let { ID: IDName, field: fieldName } of this.joins) {
            let entity = space.getEntity(IDName);
            if (entity === undefined) {
                this.log(`${IDName} is not entity`);
                ok = false;
            }
            else if (entity.type !== 'id') {
                this.log(`${IDName} is not ID`);
                ok = false;
            }
            let ID = entity as ID;
            let field = ID.getField(fieldName);
            if (field === undefined) {
                this.log(`ID ${IDName} has no field ${fieldName}`);
                ok = false;
            }
            this.entity.joins.push({ ID, field });
        }
        return ok;
    }

    protected scanFieldsValuesKey(space: Space, fieldsValues: PFieldsValues): boolean {
        let ok = true;
        let { keys } = this.entity;
        let { fields } = fieldsValues;
        if (keys.length > 0) {
            for (let key of keys) {
                if (fields.findIndex(v => v === key.name) < 0) {
                    this.log(`key field ${key.name} must be one of values field`);
                    ok = false;
                }
            }
        }
        else {
            if (fields.findIndex(v => v === 'id') < 0) {
                this.log(`id field must be one of values field when no key field`);
                ok = false;
            }
        }
        return ok;
    }
}

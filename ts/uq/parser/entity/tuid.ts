import * as _ from 'lodash';
import { Tuid, Field, ID, BigInt, Index, TuidArr, Entity, Table, Uq, Import, IdSize, ActionStatement, Pointer, VarPointer, Bus, /*TagDataType, */IdDataType } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { ActionBaseSpace } from './entity';
import { PIdBase } from './idBase';

export class PTuid extends PIdBase<Tuid> {
    private imp: string;
    private peer: string;
    private all: boolean;
    private parentName: string;
    private uniqueFields: string[];

    protected _parse() {
        this.setName();
        let isFrom: boolean = false, isSync: boolean = false;
        switch (this.ts.lowerVar) {
            case 'from': isFrom = true; break;
            case 'sync': isSync = true; break;
            default:
                //this.parseRole();
                break;
        }
        if (isFrom === true || isSync === true) {
            if (this.entity.isOpen === true) {
                this.ts.error('open tuid cannot import from');
            }
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) this.ts.expect('import name');
            this.imp = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token as any === Token.DOT) {
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) this.ts.expect('import tuid');
                this.peer = this.ts.lowerVar;
                this.ts.readToken();
            }
            if (this.ts.isKeyword('all') === true) {
                this.all = true;
                this.ts.readToken();
            }
            if (this.ts.token === Token.SEMICOLON) {
                this.entity.id = this.createId();
                this.entity.sync = false;
                this.ts.readToken();
                return;
            }
            this.entity.sync = isSync;
        }
        else if (this.ts.lowerVar === 'global' && this.ts.varBrace === false) {
            this.entity.global = true;
            this.ts.readToken();
        }

        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            if (this.ts.varBrace === true) {
                this.entity.addField(this.field(true));
            }
            else {
                switch (this.ts.lowerVar) {
                    case 'id':
                        this.ts.readToken();
                        this.entity.id = this.parseId();
                        break;
                    case 'main':
                        this.ts.readToken();
                        this.parseMain();
                        break;
                    case 'unique':
                        this.ts.readToken();
                        this.parseUnique();
                        break;
                    case 'index':
                        this.ts.readToken();
                        this.parseIndex();
                        break;
                    case 'search':
                        this.ts.readToken();
                        this.parseSearch(this.entity);
                        break;
                    case 'arr':
                        this.ts.readToken();
                        this.parseArr();
                        break;
                    case 'stamp':
                        this.ts.readToken();
                        this.parseStamp();
                        break;
                    default:
                        this.entity.addField(this.field(true));
                        break;
                }
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token !== Token.RPARENTHESE as any) continue;
                this.ts.readToken();
                break;
            }
            else if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
            else {
                this.expectToken(Token.RPARENTHESE, Token.COMMA);
            }
        }
        if (this.entity.id === undefined) {
            this.error('没有定义id字段');
        }
        if (this.ts.isKeyword('on') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('save') === false) {
                this.ts.expect('save');
            }
            this.ts.readToken();
            this.parseOnSave();
        }

        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
        }
        this.ts.readToken();
        if (/*this.tuid.url === undefined && */this.entity.main === undefined) {
            this.error('必须至少一个main字段');
        }
    }

    private parseId(): Field {
        let autoInc = this.parentName === undefined && this.imp === undefined;
        let idSize: IdSize;
        let v = this.ts.lowerVar;
        if (v === '_') {
            // 这个仅仅表示不自增，如果import有字段，就需要同步，没有定义字段，不要同步
            autoInc = false;
            this.ts.readToken();
            v = this.ts.lowerVar;
        }

        switch (v) {
            case undefined: idSize = ''; break;
            case 'big': idSize = 'big'; this.ts.readToken(); break;
            case 'small': idSize = 'small'; this.ts.readToken(); break;
            case 'tiny': idSize = 'tiny'; this.ts.readToken(); break;
            default: this.ts.expect('big', 'small', 'tiny'); break;
        }

        let field = this.createId(idSize);
        field.autoInc = autoInc;
        return field;
    }

    private createId(idSize: IdSize = 'big'): Field {
        let field = new Field();
        field.autoInc = false;
        let fieldName = 'id';
        let idType = new IdDataType();
        idType.idSize = idSize;
        field.dataType = idType;
        field.name = fieldName;
        field.nullable = false;
        return field;
    }

    private parseOwner(): Field {
        let field = new Field();
        field.dataType = new BigInt();
        field.autoInc = false;
        let n = this.ts.lowerVar;
        if (n === undefined) {
            n = 'owner';
        }
        else {
            this.ts.readToken();
        }
        field.name = n;
        field.nullable = false;
        return field;
    }

    /*
    private parseBase() {
        let field = this.field(false);
        if (field.nullable === undefined) {
            field.nullable = false;
        }
        else if (field.nullable === true) {
            this.error('base字段不可以null');
        }
        this.tuid.addBase(field);
    }
    */

    private parseMain() {
        this.entity.addMain(this.field(true));
    }

    //private parseField():Field {
    //    return this.field(true);
    //}

    private parseUnique() {
        if (this.uniqueFields !== undefined) this.error('unique不能多次定义');
        this.uniqueFields = [];
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token !== Token.VAR) this.expect('字段名');
            this.uniqueFields.push(this.ts.lowerVar);
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
                    return;
            }
        }
    }

    private parseSearch(tuid: Tuid) {
        let search = tuid.search;
        if (search !== undefined) this.error('search不能多次定义');
        search = tuid.search = [];
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token !== Token.VAR) this.expect('字段名');
            let lv = this.ts.lowerVar;
            if (search.find(v => v === lv) !== undefined) {
                this.error('search field ' + lv + ' 重复');
            }
            search.push(this.ts.lowerVar);
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
                    return;
            }
        }
    }

    protected parseStamp() {
        super.parseStamp();
        if (this.ts.isKeyword('main') === true) {
            this.ts.readToken();
            this.entity.stampOnMain = true;
        }
    }

    private parseArr() {
        let arrs = this.entity.arrs;
        if (arrs === undefined) {
            arrs = this.entity.arrs = [];
        }
        let ta: TuidArr = new TuidArr(this.entity);
        arrs.push(ta);
        if (this.ts.lowerVar === undefined) {
            this.expect('arr属性的名称');
        }
        ta.name = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            switch (this.ts.lowerVar) {
                case 'id':
                    this.ts.readToken();
                    ta.id = this.parseId();
                    break;
                case 'owner':
                    this.ts.readToken();
                    ta.ownerField = this.parseOwner();
                    break;
                case 'search':
                    this.ts.readToken();
                    this.parseSearch(ta);
                    break;
                case 'main':
                    this.ts.readToken();
                    ta.main.push(this.field(true));
                    break;
                default:
                    ta.fields.push(this.field(true));
                    break;
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token !== Token.RPARENTHESE as any) continue;
                this.ts.readToken();
                break;
            }
            else if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
            else {
                this.expectToken(Token.RPARENTHESE, Token.COMMA);
            }
        }
        if (ta.id === undefined) {
            this.error(this.entity.name + '.' + ta.name + '必须定义id字段');
        }
    }

    private checkOfFields(fields: Field[]): boolean {
        if (fields === undefined) return true;
        let ok = true;
        let { name } = this.entity;
        for (let f of fields) {
            if ((f.dataType as any).owner === undefined) continue;
            ok = false;
            this.log('Tuid ' + name + ' 字段 ' + f.name + ' 不应该有owner');
        }
        return ok;
    }

    private parseOnSave() {
        let statement = new ActionStatement(/*undefined, this.entity*/);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
        this.entity.onSaveStatement = statement;
    }

    scan(space: Space): boolean {
        let ok = super.scan(space);
        let { name, search, main, fields, arrs, onSaveStatement } = this.entity;
        if (this.imp !== undefined) {
            let imp = space.getEntity(this.imp) as Import;
            this.entity.from = { imp: imp, peer: this.peer, all: this.all }
        }
        else {
            if (main.length + fields.length === 0) {
                this.log(`no fields in ${this.entity.name}`);
                ok = false;
            }
        }
        if (arrs !== undefined) {
            for (let ap of arrs) {
                let apMain = ap.main;
                let apFields = ap.fields;
                if (apMain.length + apFields.length === 0) {
                    this.log(`no fields in ${this.entity.name}.${ap.name}`);
                    ok = false;
                }
                if (this.checkOwnerAndId(ap) === false) ok = false;
                if (this.nameExistsInEntity(ap.name, this.entity) === false) ok = false;
                if (this.fieldsExistsInParent(this.entity, ap.fields) === false) ok = false;
                if (this.checkOfFields(ap.fields) === false) ok = false;
            }
        }
        if (this.checkOfFields(main) === false) ok = false;
        if (this.checkOfFields(fields) === false) ok = false;
        if (search === undefined) {
            this.entity.search = main.map(v => v.name);
        }
        else {
            for (let s of search) {
                let f = this.entity.getField(s);
                if (f !== undefined) continue;
                this.log('Tuid ' + name + ' search field ' + s + ' not exists');
            }
        }
        if (this.scanTuidFields(space, this.entity, main) === false) ok = false;
        if (this.scanTuidFields(space, this.entity, fields) === false) ok = false;

        if (this.uniqueFields !== undefined) {
            let unique = this.entity.unique;
            if (unique !== undefined) this.error('unique不能多次定义');
            unique = this.entity.unique = new Index('unique', true);
            unique.global = this.entity.global;
            for (let uf of this.uniqueFields) {
                let f = this.entity.getField(uf);
                if (f !== undefined) {
                    unique.fields.push(f);
                }
                else {
                    ok = false;
                    this.log(`field ${uf} not exists`);
                }
            }
        }
        if (onSaveStatement !== undefined) {
            let theSpace = new TuidSpace(space, this.entity);
            //let s2 = new ReturnsSpace(theSpace, this.entity.returns);
            if (onSaveStatement.pelement.scan(theSpace) === false) ok = false;
        }
        return ok;
    }
    private nameExistsInEntity(name: string, parent: Entity & Table): boolean {
        if ((parent as Tuid).getField(name) !== undefined) {
            this.log('Tuid ' + this.entity.name + ' 字段 ' + name + '跟父类字段名重复');
            return false;
        }
        return true;
    }
    private fieldsExistsInParent(parent: Entity & Table, fields: Field[]): boolean {
        let ok = true;
        for (let f of fields) {
            if (this.nameExistsInEntity(f.name, parent) === false) ok = false;
        }
        return ok;
    }
    private checkOwnerAndId(arr: TuidArr): boolean {
        let ok = true;
        let { name, id, ownerField, fields } = arr;
        let all: Field[] = [];
        if (id === undefined) {
            this.log(this.entity.name + '_' + name + ' 必须定义 id');
            ok = false;
        }
        else {
            all.push(id);
        }
        if (ownerField === undefined) {
            this.log(this.entity.name + '_' + name + ' 必须定义 owner');
            ok = false;
        }
        else {
            all.push(ownerField);
        }
        if (all.length === 2) {
            all.push(...fields);
            if (_.some(all, (v, index) => {
                return all.findIndex((allV, allIndex) => {
                    return index !== allIndex && allV.name === v.name
                }) === index;
            })) {
                this.log(this.entity.name + '_' + name + ' 字段不能重名');
                ok = false;
            }
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let {/*children, base, */main, fields, arrs } = this.entity;
        /*
        if (this.proxies !== undefined || children !== undefined) {
            let t = this.tuid.typeField = new Field();
            t.name = '$type';
            t.dataType = new Int();
        }
        */
        //this.entity.needSync = uq.tuidNeedSync(this.entity);
        let ok = true;
        //if (this.checkFieldsTuid(uq, base) === false) ok = false;
        if (this.checkFieldsTuid(uq, main) === false) ok = false;
        if (this.checkFieldsTuid(uq, fields) === false) ok = false;
        if (arrs !== undefined) {
            for (let arr of arrs) {
                if (this.checkFieldsTuid(uq, arr.fields) === false) ok = false;
            }
        }
        return ok;
    }

    private checkFieldsTuid(uq: Uq, fields: Field[]): boolean {
        let ok = true;
        for (let field of fields) {
            let { dataType } = field;
            if (dataType.isId === true) {
                switch (dataType.type) {
                    case 'tuid':
                        let idDataType = dataType as IdDataType;
                        let { idType } = idDataType;
                        let tuid = uq.tuids[idType];
                        if (tuid === undefined) {
                            ok = false;
                            this.log(`Tuid ${this.entity.name} field ${field.name} type ${idType} is not defined`);
                        }
                        else {
                            idDataType.tuid = tuid;
                        }
                        break;
                    /*
                    case 'tag':
                        let tagDataType = dataType as TagDataType;
                        let {tagType} = tagDataType;
                        let tag = uq.tags[tagType];
                        if (tag === undefined) {
                            ok = false;
                            this.log(`Tag ${this.entity.name} field ${field.name} type ${tagType} is not defined`);
                        }
                        else {
                            tagDataType.tag = tag;
                        }
                    */
                }
            }
        }
        return ok;
    }
}

export class TuidSpace extends ActionBaseSpace {
    private tuid: Tuid;
    //private varNo: number = 1;
    //private statementNo: number = 1;
    constructor(outer: Space, actionBase: Tuid) {
        super(outer, undefined);
        this.tuid = actionBase;
    }
    protected _getEntityTable(name: string): Entity & Table {
        let { arrs } = this.tuid;
        if (arrs === undefined) return undefined;
        return arrs.find(v => v.name === name);
    }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (name === 'id') return new VarPointer();
        if (name === '$user') return new VarPointer();
        if (this.tuid.main.find(f => f.name === name) !== undefined) return new VarPointer();
        return this.tuid.fields.find(f => f.name === name) !== undefined ?
            new VarPointer() : undefined;
    }
    protected _useBusFace(bus: Bus, face: string, arr: string, local: boolean): boolean {
        this.tuid.useBusFace(bus, face, arr, local);
        return true;
    }
}

import * as _ from 'lodash';
import { Map, smallIntField, Import, ActionStatement, Entity, Table, Pointer, NamePointer, Bus, IdDataType } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { SBuilder } from '../SBuilder';
import { PBookBase } from './bookBase';
import { ActionBaseSpace } from './entity';

export class PMap extends PBookBase<Map> {
    private imp: string;
    private peer: string;
    private onAddStart: number;
    private onAddEnd: number;

    protected setName() {
        super.setName();
        if (this.ts.lowerVar === 'from') {
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
        }
        else {
            //this.parseRole();
        }
    }

    protected afterDefine(): void {
        if (this.ts.isKeyword('on') === true) {
            this.ts.readToken();
            let keyWords = ['add', 'save'];
            if (this.ts.isKeywords(...keyWords) === false) {
                this.ts.expect(...keyWords);
            }
            this.ts.readToken();
            this.parseOnAdd();
        }
    }

    protected parseField(lowerVar: string) {
        switch (lowerVar) {
            default:
                super.parseField(lowerVar);
                break;
            case 'order':
                this.ts.readToken();
                let orderFieldName: string;
                if (this.ts.token === Token.VAR) {
                    orderFieldName = this.ts.lowerVar;
                    this.ts.readToken();
                }
                else {
                    orderFieldName = '$order';
                }
                this.entity.orderField = smallIntField(orderFieldName);
                break;
        }
    }

    private parseOnAdd() {
        let onAddStatement = new ActionStatement(/*undefined, this.entity*/);
        onAddStatement.level = 0;
        this.onAddStart = this.ts.getP();
        this.context.createStatements = onAddStatement.createStatements;
        let parser = onAddStatement.parser(this.context)
        parser.parse();
        this.onAddEnd = this.ts.getP();
        this.entity.onAddStatement = onAddStatement;
    }

    scan(space: Space): boolean {
        let ok = super.scan(space);
        let { onAddStatement } = this.entity;
        if (this.imp !== undefined) {
            let imp = space.getEntity(this.imp) as Import;
            this.entity.from = { imp: imp, peer: this.peer, all: undefined }
        }
        if (onAddStatement !== undefined) {
            let theSpace = new MapSaveSpace(space, this.entity);
            if (onAddStatement.pelement.scan(theSpace) === false) ok = false;
        }
        return ok;
    }

    scan2(): boolean {
        let ok: boolean = true;
        let { from, isOpen } = this.entity;
        if (from === undefined && !isOpen === true) return ok;

        for (let key of this.entity.keys) {
            let { name, dataType } = key;
            if (!dataType.isId === true) {
                ok = false;
                this.log('Key field of open or import Map must be a TUID');
                continue;
            }
            let td = dataType as IdDataType;
            let tuid = td.tuid;
            if (tuid !== undefined && (
                tuid.isOpen !== true
                && tuid.from === undefined
                && tuid.name !== '$user')) {
                ok = false;
                this.log(`Key field ${name} ${tuid.jName} in open or import Map must be a import or open TUID`);
            }
        }
        return ok;
    }

    born(bornCode: string[]) {
        let sb = new SBuilder();
        // why? 为什么要去掉param前面的_
        // _是用户生成存储过程里面的sql代码用的。如果生成uq，不能前面加_，否则uq代码的参数带_，程序不认识
        // 看来还是得加_, 否则, delete代码里面的字段和参数名字混淆,引发错误

        // 现在，delete代码支持表别名了，所以，不需要再加_
        // ??? 这个地方需要仔细的思考。待我回头仔细写写
        sb.paramPrefix = '';
        this.buildSelectAll(sb);
        this.buildSelectPage(sb);
        this.buildQuery(sb);
        if (this.entity.from !== undefined) this.buildActionSync(sb);
        this.buildActionAdd(sb);
        this.buildActionDel(sb);
        let code = sb.toString();
        bornCode.push(code);
    }

    private buildSelectAll(sb: SBuilder) {
        let suffix = '$all$';
        let { sName, keys, fields, orderField, ver } = this.entity;
        let len = fields.length;
        let keyLen = keys.length;
        //if (keyLen <= 1) return;

        this.entity.queries.all = suffix;
        let key0 = keys[0];
        let { dataType } = key0;
        // 当第一个key是tuid的时候，列出所有tuid，相应map为null，也列出。
        // 不是tuid时，给出第一个key值，列出后面的全部
        if (dataType.isId === false) {
            let keyLast = keys[keyLen - 1];
            sb.add('query').sp().lb().add(sName).add(suffix).rb();
            if (ver) sb.add(' ver ').add(String(ver)).sp();
            sb.l();
            sb.params(keys, true);
            sb.r().add(' returns ret').l();
            sb.fields(keys, true);
            if (len > 0) sb.comma().ln();
            sb.fields(fields, true);
            if (orderField !== undefined) sb.comma().ln().field(orderField, true);
            sb.r().lbrace();
            sb.add('into ret select ');
            sb.field(key0, false, 'b');
            for (let i = 1; i < keyLen; i++) sb.comma().ln().field(keys[i], false, 'b');
            for (let i = 0; i < len; i++) sb.comma().ln().field(fields[i], false, 'b');
            if (orderField !== undefined) sb.comma().ln().field(orderField, false, 'b');
            sb.add(' from ').add(sName).add(' as b');
            sb.ln().add(' where 1=1 ');
            for (let i = 0; i < keyLen; i++) {
                let keyField = keys[i];
                sb.add(' and (').param(keyField, false).add(' is null or ').field(keyField, false, 'b').add('=').param(keyField, false).r();
            }
            sb.ln().add('order by ');
            sb.field(key0, false, 'b').add(' asc ')
            for (let i = 1; i < keyLen - 1; i++)
                sb.comma().field(keys[i], false, 'b').add(' asc ');
            sb.comma().field(orderField || keyLast, false, 'b').add(' asc ').semi();
            sb.rbrace().semi();
            sb.ln();
            sb.ln();
        }
        else {
            let dt: IdDataType = dataType as IdDataType;
            let { tuid } = dt;
            if (tuid === undefined) return;
            let keyLast = keys[keyLen - 1];
            sb.add('query').sp().lb().add(this.entity.sName).add(suffix).rb().l();
            sb.r().add(' returns ret').l();
            sb.fields(keys, true);
            if (len > 0) sb.comma().ln();
            sb.fields(fields, true);
            if (orderField !== undefined) sb.comma().ln().field(orderField, true);
            sb.r().lbrace();
            sb.add('into ret select ');
            sb.field(tuid.id, false, 'a').add(' as [').add(key0.sName).add(']');
            for (let i = 1; i < keyLen; i++) sb.comma().ln().field(keys[i], false, 'b');
            for (let i = 0; i < len; i++) sb.comma().ln().field(fields[i], false, 'b');
            if (orderField !== undefined) sb.comma().ln().field(orderField, false, 'b');
            sb.add(' from ').add(tuid.sName).add(' as a left join ');
            sb.add(sName).add(' as b on a.').add(tuid.id.sName).add('=b.').add(key0.sName)
            sb.ln().add(' where 1=1 \norder by ');
            sb.field(tuid.id, false, 'a').add(' asc ')
            for (let i = 1; i < keyLen - 1; i++)
                sb.comma().field(keys[i], false, 'b').add(' asc ');
            sb.comma().field(orderField || keyLast, false, 'b').add(' asc ').semi();
            sb.rbrace().semi();
            sb.ln();
            sb.ln();
        }
    }

    private buildSelectPage(sb: SBuilder) {
        let suffix = '$page$';
        let { sName, keys, fields, orderField, ver } = this.entity;
        let len = fields.length;
        let keyLen = keys.length;

        this.entity.queries.page = suffix;
        let keyLast = keys[keyLen - 1];
        sb.add('query').sp().lb().add(sName).add('$page$').rb();
        if (ver) sb.add(' ver ').add(String(ver)).sp();
        sb.l();
        for (let i = 0; i < keyLen - 1; i++) {
            sb.param(keys[i], true).comma();
        }
        sb.param(keyLast, true);
        sb.r().add('page').l();
        if (orderField !== undefined) {
            sb.field(orderField, true);
        }
        else {
            sb.add('[$order] bigint');
        }
        sb.add(' start 0,');
        sb.fields(keys, true);
        if (fields.length > 0) sb.comma();
        sb.fields(fields, true);
        sb.r().lbrace();

        sb.add('page select ');
        if (orderField !== undefined) {
            sb.field(orderField, false, 'a');
        }
        else {
            sb.add('a.[').add(keyLast.sName).add('] as [$order]');
        }
        sb.comma().fields(keys, false, 'a');
        if (fields.length > 0) {
            sb.comma().fields(fields, false, 'a');
        }
        sb.add(' from [').add(sName).add('] as a where 1=1');

        for (let i = 0; i < keyLen - 1; i++) {
            let kf = keys[i];
            sb.add(' and ')
                .field(kf, false, 'a')
                .add('=')
                .param(kf, false)
        }
        sb.add(' and (')
            .param(keyLast, false)
            .add(' is null or ')
            .field(keyLast, false, 'a').add('=')
            .param(keyLast, false)
            .r();
        if (orderField === undefined) orderField = keyLast;
        sb.add(' and ').field(orderField, false, 'a')
            .add('>$pageStart')
            .add(' order by ').field(orderField, false, 'a').add(' asc ')
            .add('limit $pageSize')
            .semi();
        sb.rbrace().semi();
        sb.ln();
        sb.ln();
    }

    private buildQuery(sb: SBuilder) {
        let suffix = '$query$';
        let { sName, keys, fields, orderField, ver } = this.entity;
        let len = fields.length;
        let keyLen = keys.length;
        //if (keyLen <= 1) return;

        this.entity.queries.query = suffix;
        let keyLast = keys[keyLen - 1];
        sb.add('query').sp().lb().add(sName).add('$query$').rb();
        if (ver) sb.add(' ver ').add(String(ver)).sp();
        sb.l();
        for (let i = 0; i < keyLen - 1; i++) {
            sb.param(keys[i], true).comma();
        }
        sb.param(keyLast, true);
        sb.r().add('returns ret').l();
        if (orderField !== undefined) {
            sb.field(orderField, true);
            sb.comma();
        }
        sb.fields(keys, true);
        if (fields.length > 0) sb.comma();
        sb.fields(fields, true);
        sb.r().lbrace();

        sb.add('into ret select ');
        if (orderField !== undefined) {
            sb.field(orderField, false, 'a');
            sb.comma();
        }
        sb.fields(keys, false, 'a');
        if (fields.length > 0) {
            sb.comma().fields(fields, false, 'a');
        }
        sb.add(' from [').add(sName).add('] as a where ');
        let k0 = keys[0];
        sb.field(k0, false, 'a')
            .add('=')
            .param(k0, false)

        for (let i = 1; i < keyLen; i++) {
            let kf = keys[i];
            sb.add(' and (')
                .param(kf, false)
                .add(' is null or ')
                .field(kf, false, 'a').add('=')
                .param(kf, false)
                .r();
        }
        if (keyLen > 1 || orderField !== undefined) {
            sb.add(' order by ');
            for (let i = 1; i < keyLen; i++) {
                let kf = keys[i];
                if (i > 1) sb.comma();
                sb.field(kf, false, 'a');
            }
            if (orderField !== undefined) sb.comma().field(orderField, false, 'a');
        }
        sb.semi();
        sb.rbrace().semi();
        sb.ln();
        sb.ln();
    }

    private buildActionSync(sb: SBuilder) {
        let suffix = '$sync$';
        let { sName, keys, fields, ver } = this.entity;
        this.entity.actions.sync = suffix;
        sb.add('action').sp().lb().add(sName).add(suffix).rb();
        if (ver) sb.add(' ver ').add(String(ver)).sp();
        sb.l();
        let len = fields.length;
        function setFields() {
            if (len === 0) return;
            let first = true;
            sb.add(' set ');
            for (let i = 0; i < len; i++) {
                if (first === true) first = false; else sb.comma();
                let f = fields[i];
                sb.field(f, false).add('=').param(f, false);
            }
        }

        let key0 = keys[0];
        let keyId = _.clone(key0);
        keyId.name = '__id';
        sb.param(keyId, true).comma();
        sb.add('Arr arr1 (')
        sb.params(keys, true);
        sb.comma();
        sb.params(fields, true);
        sb.r();
        sb.r().lbrace();

        sb.add('delete a from ').add(this.entity.sName).add(' as a ')
            .add(' where a.').add(key0.sName).add('=').param(keyId, false)
            .semi().ln();

        sb.add('foreach arr1 ').lbrace().ln();
        sb.add('book ').lb().add(sName).rb()
            .add(' pull at(');
        sb.params(keys, false);
        sb.r();
        setFields();
        sb.semi().ln();
        sb.rbrace().ln();

        sb.rbrace().semi();
        sb.ln();
        sb.ln();
    }

    private getOnAddSource(): string {
        if (this.onAddStart === undefined) return '';
        let ret = this.ts.getSource(this.onAddStart, this.onAddEnd);
        let p = ret.lastIndexOf('}');
        if (p >= 0) {
            ret = ret.substring(0, p);
        }
        return ret;
    }

    private buildActionAdd(sb: SBuilder) {
        let suffix = '$add$';
        let { sName, keys, fields, ver } = this.entity;
        this.entity.actions.add = suffix;
        sb.add('action').sp().lb().add(sName).add(suffix).rb();
        if (ver) sb.add(' ver ').add(String(ver)).sp();
        sb.l().ln();
        let len = fields.length;
        let keyLen = keys.length;
        let keyLast = keys[keyLen - 1];
        function buildSelect() {
            let alias = 'a';
            for (let i = 0; i < len; i++) {
                let f = fields[i];
                sb.add('if ').param(f, false).add("='\\b' {").ln();
                sb.add('set ').param(f, false).add('=').field(f, false, alias);
                sb.add(' from ').lb().add(sName).rb().add(' as [').add(alias).add('] where 1=1 ');
                // sb.param(f, false).add("='\\b'");

                if (keyLen > 1) {
                    for (let j = 0; j < keyLen - 1; j++) {
                        let k = keys[j];
                        sb.add(' and ').field(k, false, alias).add('=').param(k, false);
                    }
                }
                sb.add(' and ').field(keyLast, false, alias).add('=').param(keyLast, false).semi().ln();
                sb.add('};').ln();
            }
        }
        function setFields() {
            if (len === 0) return;
            let first = true;
            sb.add(' set ');
            for (let i = 0; i < len; i++) {
                if (first === true) first = false; else sb.comma();
                let f = fields[i];
                sb.field(f, false).add('=').param(f, false);
            }
        }
        if (keyLen === 1) {
            sb.param(keyLast, true);
            if (fields.length > 0) sb.comma();
            sb.params(fields, true);
            sb.r().lbrace().ln();
            buildSelect();
            sb.add('book ').lb().add(sName).rb()
                .add(' at(').param(keyLast, false).r();
            setFields();
            sb.semi().ln();
            sb.add(this.getOnAddSource());
        }
        else {
            for (let i = 0; i < keyLen - 1; i++) {
                sb.param(keys[i], true).comma();
            }
            sb.add('Arr arr1 (')
            sb.param(keyLast, true);
            if (len > 0) sb.comma();
            sb.params(fields, true);
            sb.r();
            sb.r().lbrace().ln();
            sb.add('foreach arr1 ').lbrace().ln();
            buildSelect();
            sb.add('book ').lb().add(sName).rb()
                .add(' pull at(');
            for (let i = 0; i < keyLen - 1; i++)
                sb.param(keys[i], false).comma();
            sb.param(keyLast, false);
            sb.r();
            setFields();
            sb.semi().ln();
            sb.add(this.getOnAddSource());
            sb.rbrace().ln();
        }
        sb.rbrace().semi();
        sb.ln();
        sb.ln();
    }

    private buildActionDel(sb: SBuilder) {
        let suffix = '$del$';
        let { sName, keys, fields, ver } = this.entity;
        this.entity.actions.del = suffix;
        sb.add('action').sp().lb().add(sName).add(suffix).rb();
        if (ver) sb.add(' ver ').add(String(ver)).sp();
        sb.l();
        let keyLen = keys.length;
        let keyLast = keys[keyLen - 1];
        for (let i = 0; i < keyLen - 1; i++) {
            sb.param(keys[i], true).comma();
        }
        sb.add('Arr arr1 (')
        sb.param(keyLast, true).comma();
        sb.r();
        sb.r().lbrace();

        let t0 = 'a'; // = 'a';
        sb.add('foreach arr1 ').lbrace().ln();
        sb.add('delete a from ').lb().add(sName).rb().add(' as a where 1=1 ')
        let f0 = keys[0];
        sb.add(' and ').field(f0, false, t0).add('=').param(f0, false);
        for (let i = 1; i < keyLen; i++) {
            let f = keys[i];
            sb.add(' and (')
                .param(f, false).add('=-1 or ')
                .field(f, false, t0).add('=').param(f, false)
                .r();
        }
        sb.semi().ln();
        sb.rbrace().ln();
        sb.rbrace().semi();
        sb.ln();
        sb.ln();
    }
}

export class MapSaveSpace extends ActionBaseSpace {
    private map: Map;
    //private varNo: number = 1;
    //private statementNo: number = 1;
    constructor(outer: Space, map: Map) {
        super(outer, undefined);
        this.map = map;
    }
    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let vp = super._varPointer(name, isField);
        if (vp) return vp;
        if (this.map.fields.find(f => f.name === name) !== undefined) {
            return new NamePointer();
        }
        if (this.map.keys.find(f => f.name === name) !== undefined) {
            return new NamePointer();
        }
    }
    protected _useBusFace(bus: Bus, face: string, arr: string, local: boolean): boolean {
        this.map.useBusFace(bus, face, arr, local);
        return true;
    }
}

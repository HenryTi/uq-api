import { Space } from '../space';
import { Token } from '../tokens';
import { ValueExpression, History, HistoryWrite, GroupType, Entity, Table, Pointer } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';

export class PHistoryWrite extends PStatement {
    private historyName: string;
    write: HistoryWrite;
    constructor(write: HistoryWrite, context: PContext) {
        super(write, context);
        this.write = write;
    }

    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.expect('history名称');
        }
        this.historyName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expect('table aliase');
            }
            this.write.alias = this.ts.lowerVar;
            this.ts.readToken();
        }
        /*
        if (this.ts.isKeyword('of')) this.ts.readToken();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
            let valueExp = new ValueExpression();
            this.write.of.push(valueExp);
            let parser = valueExp.parser(this.context);
            parser.parse();
            if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
        */
        if (this.ts.isKeyword('date') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.EQU) {
                this.ts.expectToken(Token.EQU);
            }
            this.ts.readToken();
            let dateExp = new ValueExpression();
            let parser = dateExp.parser(this.context);
            parser.parse();
            this.write.date = dateExp;
        }

        this.ts.assertKey('set');
        this.ts.readToken();
        for (; ;) {
            this.ts.assertToken(Token.VAR);
            let col = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.assertToken(Token.EQU);
            this.ts.readToken();
            let valueExp = new ValueExpression();
            let parser = valueExp.parser(this.context);
            parser.parse();
            this.write.set.push({ col: col, field: undefined, value: valueExp });
            if (this.ts.token === Token.SEMICOLON as any) {
                this.ts.readToken();
                return;
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                continue;
            }
            /*
            if (this.ts.isKeyword('where')) {
                this.ts.readToken();
                let where = new CompareExpression();
                let parser = where.parser(this.context);
                parser.parse();
                this.write.where = where;
                this.ts.assertToken(Token.SEMICOLON);
                this.ts.readToken();
                return;
            }*/
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { set, date } = this.write;
        let entity = space.getEntityTable(this.historyName);
        if (entity === undefined) {
            this.log(this.historyName + ' 没有定义');
            ok = false;
        }
        else if (entity.type !== 'history') {
            this.log(this.historyName + ' 不是history');
            ok = false;
        }
        let history = this.write.history = entity as History;
        /*
        let _of = this.write.of;
        if (_of.length !== history.keys.length) {
            this.log('write of 关键字数跟' + historyName + '的关键字数不等');
            ok = false;
        }
        for (let a of _of) {
            if (a.pelement.scan(space) === false) ok = false;
        }
        */
        if (date !== undefined) {
            if (date.pelement.scan(space) === false) ok = false;
        }

        let theSpace = new HistoryWriteSpace(space, this.write);
        for (let s of set) {
            let { col, value } = s;
            let field = history.getField(col);
            if (field === undefined) {
                ok = false;
                this.log(`history ${this.historyName} 不存在字段 ${col}`);
            }
            else {
                s.field = field;
            }
            if (value.pelement.scan(theSpace) === false) ok = false;
        }
        /*
        let where = this.write.where;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) ok = false;
        }*/
        return ok;
    }
}

class HistoryWriteSpace extends Space {
    private _groupType: GroupType = GroupType.Both;
    private write: HistoryWrite;
    constructor(outer: Space, write: HistoryWrite) {
        super(outer);
        this.write = write;
    }
    get groupType(): GroupType { return this._groupType; }
    set groupType(value: GroupType) { this._groupType = value; }
    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table {
        return this.write.history;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (isField === true) return this.write.history.fieldPointer(name);
    }
}

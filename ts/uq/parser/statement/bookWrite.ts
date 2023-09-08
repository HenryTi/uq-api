import { Space } from '../space';
import { Token } from '../tokens';
import { BookWrite, SetEqu, ValueExpression, GroupType, 
    Entity, Table, Pointer,Book, Map, TableVar, BookBase } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PBookWrite extends PStatement {
	private bookName: string;
	private hasStar: boolean;
    write: BookWrite;
    constructor(write: BookWrite, context: PContext) {
        super(write, context);
        this.write = write;
    }
    
    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.expect('book名称');
        }
		this.bookName = this.ts.lowerVar;
		this.hasStar = false;
        this.ts.readToken();
		if (this.ts.isKeyword('as') === true) {
			this.ts.readToken();
			if (this.ts.token !== Token.VAR) {
				this.ts.expect('table aliase');
			}
			this.write.alias = this.ts.lowerVar;
			this.ts.readToken();
		}
        if (this.ts.isKeyword('pull') === true) {
            this.write.isPull = true;
            this.ts.readToken();
        }
        this.ts.assertKey('at');
        this.ts.readToken();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
			let valueExp: ValueExpression;
			if (this.ts.token === Token.MUL) {
				this.ts.readToken();
				this.hasStar = true;
				this.write.at.push(undefined);
			}
			else {
				valueExp = new ValueExpression();
				this.write.at.push(valueExp);
				let parser = valueExp.parser(this.context);
				parser.parse();
			}
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
        if (this.ts.lowerVar !== 'set') return;
        this.ts.assertKey('set');
        this.ts.readToken();
        for (;;) {
            this.ts.assertToken(Token.VAR);
            let col = this.ts.lowerVar;
            this.ts.readToken();
            let equ: SetEqu;
            switch (this.ts.token as any) {
                case Token.ADDEQU: equ = SetEqu.add; break;
                case Token.SUBEQU: equ = SetEqu.sub; break;
                case Token.EQU: equ = SetEqu.equ; break;
                default: this.expectToken(Token.ADDEQU, Token.SUBEQU, Token.EQU); break;
            }
            this.ts.readToken();
            let valueExp = new ValueExpression();
            let parser = valueExp.parser(this.context);
            parser.parse();
            this.write.set.push({col:col, field:undefined, equ:equ, value:valueExp});
            if (this.ts.token === Token.SEMICOLON as any) {
                this.ts.readToken();
                return;
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                continue;
            }
        }
    }

    scan(space: Space): boolean {
        let ok = true;
		let bookName = this.bookName;
		let book:BookBase|TableVar;
        let entity = space.getEntityTable(bookName) as BookBase;
        if (entity === undefined) {
			let table = space.getLocalTable(bookName) as TableVar;
			if (table === undefined) {
				this.log(bookName + ' 没有定义');
				return false;
			}
			book = table;
        }
        else {
            let {type} = entity;
            if (type === 'map') {
                let ent:Map = entity as Map;
                if (ent.from !== undefined && !(this.write.isPull === true)) {
                    this.log(`导入的Map ${bookName}不可以直接创建和写入，只能从源拉取`);
                    ok = false;
                }
			}
			else if (type === 'book') {
				if (this.hasStar === true) {
					this.log('BOOK 不支持 * 写入');
					ok = false;
				}
			}
            else {
                this.log(bookName + ' 不是book也不是map');
                ok = false;
			}
			book = entity;
        }
        this.write.book = book;
        let at = this.write.at;
        if (at.length !== book.keys.length) {
            this.log('write at 关键字数跟' + bookName + '的关键字数不等');
            ok = false;
        }
        let theSpace = new BookWriteSpace(space, this.write);
        for (let a of at) {
			if (a === undefined) continue;
            if (a.pelement.scan(theSpace) === false) ok = false;
        }
        let set = this.write.set;
        for (let s of set) {
            let {col, value} = s;
            let field = book.getField(col);
            if (field === undefined) {
                ok = false;
                this.log(`book or map ${bookName} 不存在字段 ${col}`);
            }
            else {
                s.field = field;
            }
            if (value.pelement.scan(theSpace) === false) ok = false;
        }
        return ok;
    }
}

class BookWriteSpace extends Space {
    private _groupType: GroupType = GroupType.Both;
    private bookWrite: BookWrite;
    constructor(outer:Space, bookWrite:BookWrite) {
        super(outer);
        this.bookWrite = bookWrite;
    }
    get groupType():GroupType {return this._groupType;}
    set groupType(value:GroupType) {this._groupType = value;}
    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table {
        if (alias === this.bookWrite.alias) return this.bookWrite.book;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (isField === true) return this.bookWrite.book.fieldPointer(name);
    }
}

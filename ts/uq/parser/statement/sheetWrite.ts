import { Space } from '../space';
import { Token } from '../tokens';
import {ValueExpression, Sheet, SheetWrite, VarPointer, Field} from '../../il';
import {PStatement} from './statement';
import {PContext} from '../pContext';

export class PSheetWrite extends PStatement {
    write: SheetWrite;
    constructor(write: SheetWrite, context: PContext) {
        super(write, context);
        this.write = write;
    }
    
    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.expect('sheet名称');
        }
        this.write.sheetName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token !== Token.VAR || this.ts.varBrace === true) {
            this.expect('into', 'of', 'id');
        }
        switch (this.ts.lowerVar) {
            default:
                this.expect('into', 'of', 'id');
				break;
			case 'id':
				this.ts.readToken();
				this.parseSheetStateTo();
				return;
            case 'into':
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) this.expect('into变量名');
                this.write.into = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.assertKey('set');
                break;
            case 'of':
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) this.expect('of变量名');
                this.write.into = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.assertKey('arr');
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) this.ts.expectToken(Token.VAR);
                this.write.arrName = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.assertKey('add');
                break;
        }

        this.ts.readToken();
        for (;;) {
            this.ts.assertToken(Token.VAR);
            let col = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.assertToken(Token.EQU);
            this.ts.readToken();
            let valueExp = new ValueExpression();
            let parser = valueExp.parser(this.context);
            parser.parse();
            this.write.set.push({col:col, field:undefined, value:valueExp});
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
	
	private parseSheetStateTo() {
		let idValueExp = this.write.idExp = new ValueExpression();
		let parser = idValueExp.parser(this.context);
		parser.parse();
		if (this.ts.isKeyword('state') === false) {
			this.ts.expect('state');
		}
		this.ts.readToken();
		if (this.ts.isKeyword('to') === false) {
			this.ts.expect('to');
		}
		this.ts.readToken();
		if (this.ts.token !== Token.VAR) {
			this.ts.expect('sheet state');
		}
		this.write.sheetState  = this.ts.lowerVar;
		this.ts.readToken();
	}

    scan(space: Space): boolean {
        let ok = true;
        let {sheetName, set, into, arrName, idExp, sheetState} = this.write;
        let sheet = space.getSheet(sheetName);
        if (sheet === undefined) {
            this.log(sheetName + ' 没有定义');
            ok = false;
        }
        this.write.sheet = sheet;
        if (into === undefined) {
			if (!idExp) {
				this.log('应该有id, into或者of');
				ok = false;
			}
        }
        else {
            this.write.intoPointer = space.varPointer(into, undefined) as VarPointer;
        }
        let fields: Field[];
        if (arrName === undefined)
            fields = sheet.fields;
        else {
            let arr = sheet.arrs.find(v => v.name === arrName);
            if (arr === undefined) {
                this.log(sheetName + ' 没有 arr ' + arrName);
                ok = false;
            }
            else {
                fields = arr.fields;
            }
        }
        if (fields !== undefined) {
            for (let s of set) {
                let {col} = s;
                if (s.value.pelement.scan(space) === false) ok = false;
                if (fields.find(v=>v.name ===s.col) === undefined) {
                    ok = false;
                    this.log('sheet ' + sheetName + ' 中没有字段 ' + col);
                }
            }
		}
		if (idExp !== undefined) {
			if (idExp.pelement.scan(space) === false) ok = false;
			switch (sheetState) {
				default:
					if (sheet.states[sheetState] === undefined) {
						ok = false;
						this.log(`SHEET ${sheetName} 没有state ${sheetState}`);
					}
					break;
				case 'start': break;
				case 'end': break;
				case 'delete': break;
			}			
		}
        return ok;
    }
}

import { Space } from '../space';
import { Token } from '../tokens';
import { ValueExpression, Tuid, TuidWrite, NamePointer, TuidArr, SetEqu } from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';

export class PTuidWrite extends PStatement {
    write: TuidWrite;
    constructor(write: TuidWrite, context: PContext) {
        super(write, context);
        this.write = write;
    }

    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.expect('tuid名称');
        }
        let tuidName = this.write.tuidName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            if (this.ts.token as any !== Token.VAR) {
                this.expect(`'${tuidName}' 的div名称`);
            }
            this.write.divName = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.assertKey('of');
            this.ts.readToken();
            let of = this.write.of = new ValueExpression();
            let parser = of.parser(this.context);
            parser.parse();
        }

        if (this.ts.isKeyword('into') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) this.expect('into变量名');
            this.write.into = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('flag') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) this.expect('flag变量名');
            this.write.into = this.ts.lowerVar;
            this.write.isFlagInto = true;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('id') === true) {
            this.ts.readToken();
            let id = this.write.id = new ValueExpression();
            let parser = id.parser(this.context);
            parser.parse();
        }
        if (this.ts.isKeyword('unique') === true) {
            this.ts.readToken();
            this.parseUnique();
        }

        if (this.ts.isKeyword('set')) {
            this.ts.readToken();
            for (; ;) {
                this.ts.assertToken(Token.VAR);
                let col = this.ts.lowerVar;
                this.ts.readToken();
                let equ: SetEqu;
                switch (this.ts.token) {
                    default: this.ts.expectToken(Token.EQU, Token.ADDEQU, Token.SUBEQU); break;
                    case Token.ADDEQU: equ = SetEqu.add; break;
                    case Token.SUBEQU: equ = SetEqu.sub; break;
                    case Token.EQU: equ = SetEqu.equ; break;
                }
                this.ts.readToken();
                let valueExp = new ValueExpression();
                let parser = valueExp.parser(this.context);
                parser.parse();
                this.write.set.push({ col: col, field: undefined, value: valueExp, equ: equ });
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
    }

    private parseUnique() {
        let unique = this.write.unique = [];
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (; ;) {
            let valueExp = new ValueExpression();
            let parser = valueExp.parser(this.context);
            parser.parse();
            unique.push(valueExp);
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

    scan(space: Space): boolean {
        let ok = true;
        let { tuidName, divName, of, set, into, id: idExp, unique: writeUnique } = this.write;
        let entity = space.getEntityTable(tuidName);
        if (entity === undefined) {
            this.log(tuidName + ' 没有定义');
            ok = false;
        }
        else if (entity.type !== 'tuid') {
            this.log(tuidName + ' 不是tuid');
            ok = false;
        }
        if (entity === undefined) return ok;
        let tuid = this.write.tuid = entity as Tuid;
        let div: TuidArr;
        if (divName !== undefined) {
            div = tuid.getArr(divName);
            if (div === undefined) {
                this.log(`${tuidName} 不包含 div ${divName}`);
            }
            this.write.div = div;
        }

        let { id, unique } = tuid;
        if (id === undefined) {
            if (unique === undefined) {
                ok = false;
                this.log(`tuid ${tuidName} 必须有id或者unique`);
            }
        }

        let tuidObj: Tuid;
        let tuidObjName: string;
        if (div) {
            tuidObj = div;
            tuidObjName = `${tuid.name}.${div.name}`;
            if (of.pelement.scan(space) === false) ok = false;
        }
        else {
            tuidObj = tuid;
            tuidObjName = tuid.name;
        }
        for (let s of set) {
            let { col } = s;
            if (col === id.name) {
                ok = false;
                this.log('不能包含id字段');
            }
            if (div === undefined
                && unique !== undefined
                && unique.fields.findIndex(f => f.name === col) >= 0) {
                ok = false;
                this.log('不能包含unique字段');
            }
            if (s.value.pelement.scan(space) === false) ok = false;
            if (tuidObj.getField(col) === undefined) {
                ok = false;
                this.log(`${tuidObjName} 中没有字段 ${col}`);
            }
        }
        if (into !== undefined) {
            let pointer = space.varPointer(into, undefined) as NamePointer;
            if (pointer === undefined) {
                ok = false;
                this.log('into ' + into + ' is not defined');
            }
            this.write.intoPointer = pointer;
        }
        if (idExp !== undefined) {
            idExp.pelement.scan(space);
        }
        else {
            for (let s of set) {
                let { equ } = s;
                if (equ === SetEqu.add || equ === SetEqu.sub) {
                    this.log(`tuid ${tuidName} set += must have id defined`);
                    ok = false;
                }
            }
        }
        if (writeUnique !== undefined) {
            if (unique === undefined) {
                ok = false;
                this.log(`tuid ${tuidName} 没有定义unique`);
            }
            else {
                let wuLen = writeUnique.length;
                let uLen = unique.fields.length;
                if (wuLen !== uLen) {
                    ok = false;
                    this.log(`tuid ${tuidName} unique has ${uLen} fields, unique used ${wuLen} unique fields`);
                }
                else {
                    for (let wu of writeUnique) {
                        if (wu.pelement.scan(space) === false) ok = false;
                    }
                }
            }
        }
        return ok;
    }
}

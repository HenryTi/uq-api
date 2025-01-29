import {
    CompareExpression, ValueExpression, WithStatement
    , Entity, EntityWithTable, ID, IX, IDX, Pointer, Field, Table
    , WithID, WithIX, WithIDX, WithActDel, WithActSet
    , WithActTruncate, Var, NamePointer, IDNewType, SetValue
} from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PContext } from '../pContext';
import { PStatement } from '../PStatement';
import { PIDNewType } from '../PDefines';

export class PWithStatement extends PStatement {
    private table: string;
    private alias: string;
    private idVal: ValueExpression;
    private stampVal: ValueExpression;
    private ixxVal: ValueExpression;
    private iVal: ValueExpression;
    private xVal: ValueExpression;
    private idTo: string;					// var name
    private idPrevTo: string;               // var name
    private newType: PIDNewType;
    private keyVals: [string, ValueExpression][];
    private set: WithActSet;
    private where: CompareExpression;
    private with: WithStatement;

    constructor(_with: WithStatement, context: PContext) {
        super(_with, context);
        this.with = _with;
    }

    protected _parse() {
        let { token } = this.ts;
        if (token !== Token.VAR && token !== Token.DOLLARVAR) {
            this.ts.expectToken(Token.VAR);
        }
        this.table = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.alias = this.with.alias = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('id') === true) {
            this.ts.readToken();
            this.parseID();
            if (this.ts.isKeyword('key') === true) {
                this.parseKey();
            }
        }
        else if (this.ts.isKeyword('ixx') === true) {
            this.parseWithIXStartIxx();
        }
        else if (this.ts.isKeywords('ix', 'i') === true) {
            this.parseWithIXStartI();
        }
        else if (this.ts.isKeywords('xi', 'x') === true) {
            this.parseWithIXStartX();
        }
        else if (this.ts.isKeyword('key') === true) {
            this.parseKey();
        }
        else if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            this.iVal = new ValueExpression();
            this.iVal.parser(this.context).parse();
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                this.xVal = new ValueExpression();
                this.xVal.parser(this.context).parse();
            }
            if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
            }
            else {
                this.ts.expectToken(Token.RPARENTHESE);
            }
        }
        else {
            // 也可以没有id 或 key，truncate就是直接写的
            // this.ts.expect('id', 'key');
        }

        if (this.ts.isKeyword('del') === true) {
            this.with.act = new WithActDel();
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('truncate') === true) {
            this.with.act = new WithActTruncate();
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('set') === true) {
            this.with.act = this.set = new WithActSet();
            this.ts.readToken();
            let { sets } = this.set;
            this.parseSet(sets, false);
            if (this.ts.isKeyword('on') === true) {
                this.ts.readToken();
                if (this.ts.isKeyword('new') === false) {
                    this.ts.expect('new');
                }
                this.ts.readToken();
                let setsOnNew: { [name: string]: SetValue } = this.set.setsOnNew = {};
                this.parseSet(setsOnNew, true);
            }
        }
        else if (this.iVal || this.idVal) {
            this.with.act = this.set = new WithActSet();
        }
        else {
            // 默认为set，no 字段
            this.with.act = this.set = new WithActSet();
        }

        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            this.where = new CompareExpression();
            this.with.where = this.where;
            this.where.parser(this.context).parse();
        }

        if (this.ts.token === Token.SEMICOLON) this.ts.readToken();
    }

    private parseID() {
        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
            this.idVal = new ValueExpression();
            this.idVal.parser(this.context).parse();
            return;
        }
        if (this.ts.isKeyword('new') === true) {
            this.ts.readToken();
            if (this.ts.isKeywordToken === true) {
                switch (this.ts.lowerVar) {
                    case 'version':
                        this.ts.readToken();
                        this.newType = PIDNewType.newVersion;
                        break;
                    case 'if':
                        this.ts.readToken();
                        if (this.ts.isKeyword('null') === false) {
                            this.ts.expect('NULL');
                        }
                        this.ts.readToken();
                        this.newType = PIDNewType.newIfNull;
                        break;
                }
            }
        }
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.idTo = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('prev') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('to') === false) {
                this.ts.expect('to');
            }
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            this.idPrevTo = this.ts.lowerVar;
            this.ts.readToken();
        }
    }

    private parseKey() {
        this.ts.readToken();
        this.keyVals = [];
        const parseKeyAs = (): string => {
            let keyName: string = undefined;
            if (this.ts.isKeyword('as') === true) {
                this.ts.readToken();
                if (this.ts.token !== Token.VAR as any) {
                    this.ts.expectToken(Token.VAR);
                }
                keyName = this.ts.lowerVar;
                this.ts.readToken();
            }
            return keyName;
        }
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                let exp = new ValueExpression();
                exp.parser(this.context).parse();
                let keyName = parseKeyAs();
                this.keyVals.push([keyName, exp]);
                if (this.ts.token as any === Token.COMMA) {
                    this.ts.readToken();
                }
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            let exp = new ValueExpression();
            exp.parser(this.context).parse();
            let keyName = parseKeyAs();
            this.keyVals.push([keyName, exp]);
        }
        if (this.ts.isKeyword('stamp') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
            }
            this.stampVal = new ValueExpression();
            this.stampVal.parser(this.context).parse();
        }
    }

    private parseSet(sets: { [name: string]: SetValue }, isOnNew: boolean) {
        for (; ;) {
            if (this.ts.token !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            if (this.alias !== undefined) {
                if (this.alias !== this.ts.lowerVar) {
                    this.ts.expect('table alias ' + this.alias);
                }
                this.ts.readToken();
                if (this.ts.token !== Token.DOT) {
                    this.ts.expectToken(Token.DOT);
                }
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
            }
            let name = this.ts.lowerVar;
            let field = this.ts._var;

            this.ts.readToken();
            let equ: '=' | '-' | '+';
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(Token.EQU, Token.ADD, Token.SUB);
                    break;
                case Token.EQU:
                    equ = '=';
                    break;
                case Token.ADDEQU:
                    if (isOnNew === true) this.ts.error('+= is not suppored in ON NEW');
                    equ = '+';
                    break;
                case Token.SUBEQU:
                    if (isOnNew === true) this.ts.error('-= is not suppored in ON NEW');
                    equ = '-';
                    break;
            }
            this.ts.readToken();
            let value = new ValueExpression();
            value.parser(this.context).parse();
            if (sets[name]) {
                this.ts.error(`重复SET field ${field}`);
            }
            sets[name] = { name, equ, value };
            if (this.ts.token !== Token.COMMA) break;
            this.ts.readToken();
        }
    }
    private parseWithIXStartIxx() {
        this.ts.readToken();
        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
        }
        this.ixxVal = new ValueExpression();
        this.ixxVal.parser(this.context).parse();
        if (this.ts.isKeyword('ix') === false) {
            this.ts.error('ix must be set after ixx');
        }
        this.parseWithIXStartI();
    }

    private parseWithIXStartI() {
        this.ts.readToken();
        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
        }
        this.iVal = new ValueExpression();
        this.iVal.parser(this.context).parse();
        // ix=之后，可以没有xi=的
        if (this.ts.isKeywords('xi', 'x') === true) {
            this.ts.readToken();
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
            }
            if (this.ts.token === Token.MUL) {
                this.ts.readToken();
                this.xVal = undefined;
            }
            else {
                this.xVal = new ValueExpression();
                this.xVal.parser(this.context).parse();
            }
        }
    }

    private parseWithIXStartX() {
        this.ts.readToken();
        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
        }
        this.xVal = new ValueExpression();
        this.xVal.parser(this.context).parse();
    }

    scan(space: Space): boolean {
        let ok = true;
        let entity = space.getEntityTable(this.table);
        if (entity === undefined) {
            this.log(`${this.table} not defined in WITH statement`);
            return false;
        }

        let retScanType: { isOk: boolean; statementSpace: WithSpace };
        switch (entity.type) {
            default:
                ok = false;
                this.log('WITH only works with ID, IDX and IX');
                return;
            case 'id':
                retScanType = this.scanID(entity as ID, space);
                break;
            case 'idx':
                retScanType = this.scanIDX(entity as IDX, space);
                break;
            case 'ix':
                retScanType = this.scanIX(entity as IX, space);
                break;
        }
        if (this.idTo !== undefined) {
            // 在this.scanID里面，把this.idTo设置为undefined了
            ok = false;
            this.log('只有WITH ID可以加 ID TO');
        }
        let { isOk, statementSpace } = retScanType;
        if (isOk === false) ok = false;

        let { act } = this.with;
        if (act) {
            switch (act.type) {
                case 'truncate':
                    if (this.idVal) {
                        ok = false;
                        this.log('WITH TRUNCATE should not define ID');
                    }
                    if (this.ixxVal) {
                        ok = false;
                        this.log('WITH TRUNCATE should not define IXX');
                    }
                    if (this.iVal) {
                        ok = false;
                        this.log('WITH TRUNCATE should not define IX');
                    }
                    if (this.xVal) {
                        ok = false;
                        this.log('WITH TRUNCATE should not define XI');
                    }
                    if (this.keyVals && this.keyVals.length > 0) {
                        ok = false;
                        this.log('WITH TRUNCATE should not define KEY');
                    }
                    if (this.where) {
                        ok = false;
                        this.log('WITH TRUNCATE should not define WHERE');
                    }
                    return ok;
            }
            if (this.idVal) {
                if (this.idVal.pelement.scan(statementSpace) === false) {
                    ok = false;
                }
            }
            if (this.stampVal) {
                if (this.stampVal.pelement.scan(statementSpace) === false) {
                    ok = false;
                }
            }
            if (this.ixxVal) {
                if (this.ixxVal.pelement.scan(statementSpace) === false) {
                    ok = false;
                }
            }
            if (this.iVal) {
                if (this.iVal.pelement.scan(statementSpace) === false) {
                    ok = false;
                }
            }
            if (this.xVal) {
                if (this.xVal.pelement.scan(statementSpace) === false) {
                    ok = false;
                }
            }
            if (this.keyVals !== undefined) {
                for (let keyVal of this.keyVals) {
                    const [keyName, keyValue] = keyVal;
                    if (keyValue.pelement.scan(statementSpace) === false) {
                        ok = false;
                    }
                }
            }
            if (this.where) {
                if (this.where.pelement.scan(statementSpace) === false) {
                    ok = false;
                }
            }
            if (this.scanSet(statementSpace) === false) {
                ok = false;
            }
            return ok;
        }
    }

    private scanID(id: ID, space: Space): { isOk: boolean; statementSpace: WithSpace } {
        let isOk = true;
        let withID = new WithID();
        withID.ID = id;
        let { keys } = id;
        this.with.with = withID;
        let type = this.with.act?.type;
        if (type !== 'truncate') {
            if (this.idVal === undefined && this.keyVals === undefined && this.idTo === undefined) {
                isOk = false;
                this.log('WITH ID need either id or key');
            }
            if (this.iVal !== undefined) {
                isOk = false;
                this.log('IX= is not needed in WITH ID');
            }
            withID.idVal = this.idVal;
            switch (this.newType) {
                default:
                case PIDNewType.new:
                case PIDNewType.newVersion:
                    withID.newType = IDNewType.new;
                    break;
                case PIDNewType.newIfNull:
                    withID.newType = IDNewType.newIfNull;
                    break;
            }
            if (this.idTo !== undefined) {
                let vp = space.varPointer(this.idTo, false) as NamePointer;
                if (vp === undefined) {
                    this.log(`变量 ${this.idTo} 没有定义`);
                    isOk = false;
                }
                let v = new Var(this.idTo, undefined, undefined);
                v.pointer = vp;
                withID.idToVar = v;
                if (id.version !== undefined) {
                    if (this.newType === undefined) {
                        this.log(`${id.jName} has version, ID NEW [VERSION|IFNULL|IF NULL] TO is a must`);
                        isOk = false;
                    }
                }
                if (this.idPrevTo !== undefined) {
                    if (id.version === undefined) {
                        this.log(`${id.jName} has not version, PREV TO is meaningless`);
                        isOk = false;
                    }

                    let vp = space.varPointer(this.idPrevTo, false) as NamePointer;
                    if (vp === undefined) {
                        this.log(`变量 ${this.idPrevTo} 没有定义`);
                        isOk = false;
                    }
                    let v = new Var(this.idPrevTo, undefined, undefined);
                    v.pointer = vp;
                    withID.prevToVar = v;
                    this.idPrevTo = undefined;
                }
            }
            if (this.keyVals !== undefined) {
                if (this.idVal !== undefined) {
                    this.log(`WITH ID, there should not be both ID= and KEY`);
                    isOk = false;
                }
                withID.keyVals = this.keyVals.map(v => v[1]);
                let len = this.keyVals.length;
                if (len > 0) {
                    if (keys.length !== len) {
                        this.log('key values count mismatch');
                        isOk = false;
                    }
                    else {
                        for (let i = 0; i < len; i++) {
                            let keyVal = this.keyVals[i];
                            let keyName = keyVal[0];
                            if (keyName === undefined) continue;
                            if (keyName !== keys[i].name) {
                                this.log(`key name '${keyName}' is wrong`);
                                isOk = false;
                            }
                        }
                    }
                }
            }
            else {
                if (this.idVal === undefined) {
                    if (keys.length > 0) {
                        this.log(`WITH ID, there must be either ID= or KEY`);
                        isOk = false;
                    }
                }
                else if (this.idTo !== undefined) {
                    this.log(`WITH ID, there should not be both ID= and ID TO`);
                    isOk = false;
                }
            }
            if (this.stampVal) {
                withID.stampVal = this.stampVal;
            }
            this.idTo = undefined;
        }
        return {
            isOk,
            statementSpace: new IDSpace(space, withID.ID, this.alias, this.set)
        };
    }

    private scanIDX(idx: IDX, space: Space): { isOk: boolean; statementSpace: WithSpace } {
        let isOk: boolean = true;
        let withIDX = new WithIDX();
        withIDX.IDX = idx;
        this.with.with = withIDX;
        if (this.verifyNotID(idx) === false) {
            isOk = false;
        }
        if (this.with.act?.type !== 'truncate') {
            if (this.idVal === undefined) {
                isOk = false;
                this.log('IDX need id=');
            }
            if (this.iVal !== undefined) {
                isOk = false;
                this.log('IDX not need IX=');
            }
            if (this.keyVals !== undefined) {
                if (this.keyVals.length > 0) {
                    isOk = false;
                    this.log('IDX not need KEY');
                }
            }
            withIDX.idVal = this.idVal;
        }
        return {
            isOk,
            statementSpace: new IDXSpace(space, withIDX.IDX, this.alias, this.set)
        };
    }

    private verifyNotID(entity: Entity): boolean {
        let ok = true;
        let type = entity.type.toUpperCase();
        if (this.idTo !== undefined) {
            ok = false;
            this.log(`WITH ${type} should not ID TO`);
        }
        if (this.newType !== undefined) {
            ok = false;
            this.log(`WITH ${type} should not ID NEW TO`);
        }
        if (this.idPrevTo !== undefined) {
            ok = false;
            this.log(`WITH ${type} should not PREV TO`);
        }
        return ok;
    }

    private scanIX(IX: IX, space: Space): { isOk: boolean; statementSpace: WithSpace } {
        let isOk = true;
        let withIX = new WithIX();
        withIX.IX = IX;
        this.with.with = withIX;
        let type = this.with.act?.type;
        if (this.verifyNotID(IX) === false) {
            isOk = false;
        }
        if (type !== 'truncate') {
            if (this.iVal === undefined) {
                if (type !== 'del') {
                    isOk = false;
                    this.log('WITH must define IX');
                }
            }

            withIX.ixxVal = this.ixxVal;
            let { ixx } = IX;
            if (ixx) {
                if (!this.ixxVal) {
                    isOk = false;
                    this.log(`${IX.jName} must have ixx`);
                }
            }
            else {
                if (this.ixxVal) {
                    isOk = false;
                    this.log(`${IX.jName} does not have ixx`);
                }
            }
            if (this.iVal === undefined && this.xVal === undefined) {
                isOk = false;
                this.log('IX need either i= or x= or key(');
            }
            withIX.iVal = this.iVal;
            withIX.xVal = this.xVal;
            if (this.keyVals !== undefined) {
                if (this.keyVals.length > 0) {
                    isOk = false;
                    this.log('IX do not need key(');
                }
            }
        }
        return {
            isOk,
            statementSpace: new IXSpace(space, withIX.IX, this.alias, this.set)
        };
    }

    private scanSet(space: WithSpace): boolean {
        if (!this.set) return true;
        let ok = true;
        let { sets, setsOnNew } = this.set;
        if (this.scanSets(space, sets) === false) ok = false;
        if (this.scanSets(space, setsOnNew) === false) ok = false;
        return ok;
    }

    private scanSets(space: WithSpace, sets: { [name: string]: SetValue }): boolean {
        if (!sets) return true;
        let ok = true;
        for (let i in sets) {
            let setValue = sets[i];
            let { name, equ, value } = setValue;
            let field = space.getField(name);
            if (field === undefined) {
                this.log(`${name} is not field of ${this.table}`);
                ok = false;
            }
            if (name === 'id') {
                this.log(`id can not be set`);
                ok = false;
            }
            if (name === 'ix') {
                this.log(`ix can not be set`);
                ok = false;
            }
            if (space.isKey(name) === true) {
                this.log(`key field ${name} can not be set`);
                ok = false;
            }
            if (value.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

abstract class WithSpace extends Space {
    protected readonly actSet: WithActSet;
    protected readonly alias: string;
    constructor(outer: Space, alias: string, actSet: WithActSet) {
        super(outer);
        this.alias = alias;
        this.actSet = actSet;
    }

    protected abstract get entityTable(): EntityWithTable;

    getField(name: string): Field {
        return this.entityTable.getField(name);
    }

    isKey(name: string): boolean { return false; }

    protected _varPointer(name: string, isField: boolean): Pointer {
        if (isField === true) {
            return this.entityTable.fieldPointer(name);
        }
    }

    protected _getEntityTable(name: string): Entity & Table {
        return;
    }

    protected _getTableByAlias(alias: string): Table {
        if (this.alias === alias) {
            return this.entityTable;
        }
    }
}

class IDSpace extends WithSpace {
    private id: ID;
    constructor(outer: Space, id: ID, alias: string, actSet: WithActSet) {
        super(outer, alias, actSet);
        this.id = id;
    }
    protected get entityTable(): EntityWithTable { return this.id; }
}

class IDXSpace extends WithSpace {
    private idx: IDX;
    constructor(outer: Space, idx: IDX, alias: string, actSet: WithActSet) {
        super(outer, alias, actSet);
        this.idx = idx;
    }
    protected get entityTable(): EntityWithTable { return this.idx; }
}

class IXSpace extends WithSpace {
    private ix: IX;
    constructor(outer: Space, ix: IX, alias: string, actSet: WithActSet) {
        super(outer, alias, actSet);
        this.ix = ix;
    }
    protected get entityTable(): EntityWithTable { return this.ix; }
    isKey(name: string): boolean { return this.ix.keys.findIndex(v => v.name === name) >= 0; }
}

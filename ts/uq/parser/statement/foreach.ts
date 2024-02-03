import { Space } from '../space';
import { Token } from '../tokens';
import {
    ForEach, Select, Arr, Table, Entity,
    Pointer, VarPointer, Var, createDataType, ForSelect, ForArr, ForQueue
    , Queue, ValueExpression, BigInt, BizPhraseType, BizIn, ForBizInOutArr, BizBudArr
} from '../../il';
import { PStatement } from './statement';

const wordsAfterOf = ['select', 'queue'];

export class PForEach extends PStatement<ForEach> {
    private bizDetail: string;
    private arrName: string;
    private vars: Var[];
    private select: Select;
    private queueName: string;
    private queueIx: ValueExpression;

    protected _parse() {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            this.ts.assertKey('var');
            this.ts.readToken();
            this.parseVars();
            if (this.ts.token as any !== Token.VAR || this.ts.varBrace === true) {
                this.ts.expect(...wordsAfterOf);
            }
            switch (this.ts.lowerVar) {
                default:
                    this.ts.expect(...wordsAfterOf);
                    break;
                case 'select':
                    this.ts.readToken();
                    let select = new Select();
                    select.inForeach = true;
                    let parser = select.parser(this.context);
                    parser.parse();
                    this.select = select;
                    break;
                case 'queue':
                    this.ts.readToken();
                    if (this.ts.token as any !== Token.VAR) {
                        this.ts.expectToken(Token.VAR);
                    }
                    this.queueName = this.ts.lowerVar;
                    this.ts.readToken();
                    if (this.ts.isKeyword('of') === true) {
                        this.ts.readToken();
                        this.queueIx = new ValueExpression();
                        this.queueIx.parser(this.context).parse();
                    }
                    break;
            }
            this.ts.assertToken(Token.RPARENTHESE);
            this.ts.readToken();
        }
        else if (this.ts.token === Token.VAR) {
            let vars: string[] = [this.ts.lowerVar];
            this.ts.readToken();
            if (this.ts.token as any === Token.DOT) {
                this.ts.readToken();
                if (this.ts.token !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                vars.push(this.ts.lowerVar);
                this.ts.readToken();
            }
            if (this.ts.isKeyword('in') === true) {
                if (vars.length === 2) {
                    this.ts.error('FOR a.b IN c is not valid');
                }
                this.ts.readToken();
                this.vars = [new Var(vars[0], new BigInt(), undefined)];
                if (this.ts.isKeyword('detail') === true) {
                    this.ts.readToken();
                    this.bizDetail = this.ts.mayPassVar();
                    if (this.bizDetail === undefined) this.bizDetail = null;
                }
            }
            else {
                this.arrName = vars.join('.');
            }
        }
        else {
            this.expect('(', 'arr名称');
        }
        let statement = this.element.statements = this.context.createStatements(this.element);
        statement.level = this.element.level;
        let parser = statement.parser(this.context);
        parser.parse();
    }

    private parseVars() {
        this.vars = [];
        for (; ;) {
            if (this.ts.token !== Token.VAR) this.expect('变量名称');
            let name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== Token.VAR) {
                this.expect('类型');
            }
            let dataType = createDataType(this.ts.lowerVar);
            if (dataType === undefined) {
                this.expect('类型');
            }
            this.ts.readToken();
            let parser = dataType.parser(this.context);
            parser.parse();
            let v: Var = new Var(name, dataType, undefined);
            this.vars.push(v);
            switch (this.ts.token as any) {
                case Token.COMMA:
                    this.ts.readToken();
                    continue;
                case Token.VAR:
                    if (this.ts.lowerVar === 'of') {
                        this.ts.readToken();
                        return;
                    }
                    this.expect('of');
                    return;
                default:
                    this.expectToken(Token.COMMA);
                    return;
            }
        }
    }

    private createBizInArrSpace(space: Space): Space {
        let bizEntity = space.getBizEntity(undefined);
        if (bizEntity === undefined) return;
        if (bizEntity.bizPhraseType !== BizPhraseType.in) return;
        let bizIn = bizEntity as BizIn;
        let bizInArr = bizIn.props.get(this.arrName) as BizBudArr; // .arrs[this.arrName];
        if (bizInArr === undefined) return;
        this.element.list = new ForBizInOutArr(bizInArr);
        return new ForBizInOutArrSpace(space, bizInArr);
    }

    scan(space: Space): boolean {
        let ok = true;
        let theSpace: Space;
        this.element.isInProc = space.getActionBase()?.type === 'proc';
        if (this.arrName !== undefined) {
            let arr = space.getArr(this.arrName);
            if (arr !== undefined) {
                theSpace = new ForEachArrSpace(space, arr);
                this.element.list = new ForArr(arr);
            }
            else {
                theSpace = this.createBizInArrSpace(space);
                if (theSpace === undefined) {
                    ok = false;
                    this.log('参数没有ARR ' + this.arrName);
                }
            }
        }
        else if (this.select !== undefined) {
            if (this.select.pelement.scan(space) === false) ok = false;
            theSpace = new ForEachVarsSpace(space, this.vars);
            let { columns } = this.select;
            let len = this.vars.length;
            if (len !== columns.length) {
                this.log('foreach 变量数跟后面的select列数不相等');
                ok = false;
            }
            for (let i = 0; i < len; i++) {
                let v = this.vars[i];
                let vName = v.name;
                let col = columns[i];
                let { alias } = col;
                if (alias === undefined) {
                    col.alias = vName;
                }
                else if (alias !== vName) {
                    this.log('foreach select column name must be the same as variable name');
                    ok = false;
                }
                let vp = v.pointer = new VarPointer();
                let no = theSpace.getVarNo();
                vp.no = no;
                theSpace.setVarNo(no + 1);
            };
            this.element.list = new ForSelect(this.vars, this.select);
        }
        else if (this.queueName) {
            let entity = space.getEntity(this.queueName);
            if (entity === undefined) {
                ok = false;
                this.log(`QUEUE ${this.queueName} is not defined`);
            }
            else {
                if (entity.type !== 'queue') {
                    this.log(`${this.queueName} is not QUEUE`);
                }
                let len = this.vars.length;
                if (len !== 1) {
                    this.log('FOR QUEUE 只能定义一个变量');
                    ok = false;
                }
                theSpace = new ForEachVarsSpace(space, this.vars);
                for (let i = 0; i < len; i++) {
                    let v = this.vars[i];
                    let vp = v.pointer = new VarPointer();
                    let no = theSpace.getVarNo();
                    vp.no = no;
                    theSpace.setVarNo(no + 1);
                };
                if (this.queueIx !== undefined) {
                    if (this.queueIx.pelement.scan(theSpace) === false) ok = false;
                }
                this.element.list = new ForQueue(this.vars, entity as Queue, this.queueIx);
            }
        }
        else if (this.bizDetail !== undefined) {
            // biz detail 相关的处理
            theSpace = new ForEachVarsSpace(space, this.vars);
            let vp = this.vars[0].pointer = new VarPointer();
            let no = theSpace.getVarNo();
            vp.no = no;
            theSpace.setVarNo(no + 1);
            let list = this.element.list = this.element.createBizForDetail(this.bizDetail, this.vars);
            let ret = list.check();
            if (ret !== undefined) {
                this.log(ret);
                ok = false;
            }
        }
        else {
            throw '解析错误: 没有arr也没有select';
        }
        let statement = this.element.statements;
        if (statement !== undefined) {
            if (statement.pelement.scan(theSpace) === false) ok = false;
        }
        if (this.vars !== undefined) {
            for (let v of this.vars) {
                let { pelement } = v.dataType;
                if (pelement !== undefined) {
                    if (pelement.scan(space) === false) {
                        ok = false;
                    }
                }
            }
        }
        return ok;
    }
}

class ForBizInOutArrSpace extends Space {
    private readonly arr: BizBudArr;
    constructor(space: Space, arr: BizBudArr) {
        super(space);
        this.arr = arr;
    }
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (this.arr.props.has(name) === true) {
            return new VarPointer(name);
        }
    }
}

class ForEachArrSpace extends Space {
    private arr: Arr;
    constructor(outer: Space, arr: Arr) {
        super(outer);
        this.arr = arr;
    }
    get inLoop(): boolean { return true; }
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let ret = this.arr.fields.find(v => v.name === name);
        if (ret === undefined) return;
        let vp = new VarPointer();
        vp.arr = this.arr.name;
        return vp;
    }
}

class ForEachVarsSpace extends Space {
    private vars: Var[];
    constructor(outer: Space, vars: Var[]) {
        super(outer);
        this.vars = vars;
    }
    get inLoop(): boolean { return true; }
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let vr = this.vars.find(v => v.name === name);
        if (vr === undefined) return;
        return vr.pointer;
    }
}

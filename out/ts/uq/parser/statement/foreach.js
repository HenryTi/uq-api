"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PForEach = void 0;
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const statement_1 = require("./statement");
const wordsAfterOf = ['select', 'queue'];
class PForEach extends statement_1.PStatement {
    _parse() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            this.ts.assertKey('var');
            this.ts.readToken();
            this.parseVars();
            if (this.ts.token !== tokens_1.Token.VAR || this.ts.varBrace === true) {
                this.ts.expect(...wordsAfterOf);
            }
            switch (this.ts.lowerVar) {
                default:
                    this.ts.expect(...wordsAfterOf);
                    break;
                case 'select':
                    this.ts.readToken();
                    let select = new il_1.Select();
                    select.inForeach = true;
                    let parser = select.parser(this.context);
                    parser.parse();
                    this.select = select;
                    break;
                case 'queue':
                    this.ts.readToken();
                    if (this.ts.token !== tokens_1.Token.VAR) {
                        this.ts.expectToken(tokens_1.Token.VAR);
                    }
                    this.queueName = this.ts.lowerVar;
                    this.ts.readToken();
                    if (this.ts.isKeyword('of') === true) {
                        this.ts.readToken();
                        this.queueIx = new il_1.ValueExpression();
                        this.queueIx.parser(this.context).parse();
                    }
                    break;
            }
            this.ts.assertToken(tokens_1.Token.RPARENTHESE);
            this.ts.readToken();
        }
        else if (this.ts.token === tokens_1.Token.VAR) {
            let vars = [this.ts.lowerVar];
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.DOT) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                vars.push(this.ts.lowerVar);
                this.ts.readToken();
            }
            if (this.ts.isKeyword('in') === true) {
                if (vars.length === 2) {
                    this.ts.error('FOR a.b IN c is not valid');
                }
                this.ts.readToken();
                this.vars = [new il_1.Var(vars[0], new il_1.BigInt(), undefined)];
                if (this.ts.isKeyword('detail') === true) {
                    this.ts.readToken();
                    this.bizDetail = this.ts.mayPassVar();
                    if (this.bizDetail === undefined)
                        this.bizDetail = null;
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
    parseVars() {
        this.vars = [];
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR)
                this.expect('变量名称');
            let name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.expect('类型');
            }
            let dataType = (0, il_1.createDataType)(this.ts.lowerVar);
            if (dataType === undefined) {
                this.expect('类型');
            }
            this.ts.readToken();
            let parser = dataType.parser(this.context);
            parser.parse();
            let v = new il_1.Var(name, dataType, undefined);
            this.vars.push(v);
            switch (this.ts.token) {
                case tokens_1.Token.COMMA:
                    this.ts.readToken();
                    continue;
                case tokens_1.Token.VAR:
                    if (this.ts.lowerVar === 'of') {
                        this.ts.readToken();
                        return;
                    }
                    this.expect('of');
                    return;
                default:
                    this.expectToken(tokens_1.Token.COMMA);
                    return;
            }
        }
    }
    createBizInArrSpace(space) {
        let bizEntity = space.getBizEntity(undefined);
        if (bizEntity === undefined)
            return;
        if (bizEntity.bizPhraseType !== il_1.BizPhraseType.in)
            return;
        let bizIn = bizEntity;
        let bizInArr = bizIn.props.get(this.arrName); // .arrs[this.arrName];
        if (bizInArr === undefined)
            return;
        this.element.list = new il_1.ForBizInOutArr(bizInArr);
        return new ForBizInOutArrSpace(space, bizInArr);
    }
    scan(space) {
        var _a;
        let ok = true;
        let theSpace;
        this.element.isInProc = ((_a = space.getActionBase()) === null || _a === void 0 ? void 0 : _a.type) === 'proc';
        if (this.arrName !== undefined) {
            let arr = space.getArr(this.arrName);
            if (arr !== undefined) {
                theSpace = new ForEachArrSpace(space, arr);
                this.element.list = new il_1.ForArr(arr);
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
            if (this.select.pelement.scan(space) === false)
                ok = false;
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
                let vp = v.pointer = new il_1.VarPointer();
                let no = theSpace.getVarNo();
                vp.no = no;
                theSpace.setVarNo(no + 1);
            }
            ;
            this.element.list = new il_1.ForSelect(this.vars, this.select);
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
                    let vp = v.pointer = new il_1.VarPointer();
                    let no = theSpace.getVarNo();
                    vp.no = no;
                    theSpace.setVarNo(no + 1);
                }
                ;
                if (this.queueIx !== undefined) {
                    if (this.queueIx.pelement.scan(theSpace) === false)
                        ok = false;
                }
                this.element.list = new il_1.ForQueue(this.vars, entity, this.queueIx);
            }
        }
        else if (this.bizDetail !== undefined) {
            // biz detail 相关的处理
            theSpace = new ForEachVarsSpace(space, this.vars);
            let vp = this.vars[0].pointer = new il_1.VarPointer();
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
            if (statement.pelement.scan(theSpace) === false)
                ok = false;
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
exports.PForEach = PForEach;
class ForBizInOutArrSpace extends space_1.Space {
    constructor(space, arr) {
        super(space);
        this.arr = arr;
    }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        return;
    }
}
class ForEachArrSpace extends space_1.Space {
    constructor(outer, arr) {
        super(outer);
        this.arr = arr;
    }
    get inLoop() { return true; }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        let ret = this.arr.fields.find(v => v.name === name);
        if (ret === undefined)
            return;
        let vp = new il_1.VarPointer();
        vp.arr = this.arr.name;
        return vp;
    }
}
class ForEachVarsSpace extends space_1.Space {
    constructor(outer, vars) {
        super(outer);
        this.vars = vars;
    }
    get inLoop() { return true; }
    _getEntityTable(name) { return; }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        let vr = this.vars.find(v => v.name === name);
        if (vr === undefined)
            return;
        return vr.pointer;
    }
}
//# sourceMappingURL=foreach.js.map
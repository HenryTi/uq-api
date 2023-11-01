import * as _ from 'lodash';
import * as Exp from '../../il/Exp';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';
import {
    createDataType, Entity, Table, GroupType,
    Pointer,
    BizExp
} from '../../il';
import { PContext } from '../pContext';
import { DATEPARTS, TIMESTAMPDIFFPARTS } from '../../il/DATEPARTS';
import { functions, uqFunctions } from '../../il/functions';

export abstract class PAtom extends PElement {
    atom: Exp.Atom;
    constructor(atom: Exp.Atom, context: PContext) {
        super(atom, context);
        this.atom = atom;
    }
}

export abstract class PExpression extends PElement {
    protected expression: Exp.Expression;
    constructor(expression: Exp.Expression, context: PContext) {
        super(expression, context);
        this.expression = expression;
    }

    scan(space: Space) {
        let ok = true;
        let groupType: GroupType;
        let atoms = this.expression.atoms;
        for (let i in atoms) {
            let v = atoms[i];
            let { pelement } = v;
            if (pelement === undefined) {
                if (groupType === undefined) groupType = GroupType.Both;
                continue;
            }
            let theSpace = new ExpressionSpace(space);
            if (pelement.scan(theSpace) === false) ok = false;
            let gt = theSpace.groupType;
            if (groupType === undefined)
                groupType = theSpace.groupType;
            else if (gt === GroupType.Both)
                continue;
            else if ((gt & groupType) === 0)
                this.log('混合了group和非group');
        }
        space.groupType = groupType;
        return ok;
    }

    private add(atom: Exp.Atom) {
        this.expression.atoms.push(atom);
    }

    protected abstract _internalParse(): void;

    protected _parse() {
        this._internalParse();
    }

    protected expCompare() {
        this.B();
        for (; ;) {
            if (this.ts.token === Token.OR || this.ts.isKeyword('or') === true) {
                this.ts.readToken();
                this.B();
                this.add(new Exp.OpOr());
            }
            else break;
        }
    }

    private B() {
        this.C();
        for (; ;) {
            if (this.ts.token === Token.AND || this.ts.isKeyword('and') === true) {
                this.ts.readToken();
                this.C();
                this.add(new Exp.OpAnd());
            }
            else break;
        }
    }

    private C() {
        if (this.ts.token == Token.NOT ||
            this.ts.isKeyword('not')) {
            this.ts.readToken();
            this.C();
            this.add(new Exp.OpNot());
            return;
        }
        if (this.ts.isKeyword('exists') === true) {
            this.ts.readToken();
            this.ts.assertToken(Token.LPARENTHESE);
            this.ts.readToken();
            let selectOperand = this.maySelectOperand();
            if (selectOperand === undefined) {
                this.ts.expect(': or FROM');
            }
            this.ts.assertToken(Token.RPARENTHESE);
            this.ts.readToken();
            let exists = new Exp.ExistsSubOperand();
            this.add(exists);
            return;
        }
        this.expValue();
        switch (this.ts.token) {
            default:
                switch (this.ts.lowerVar) {
                    case 'is':
                        this.ts.readToken();
                        if (this.ts.isKeyword('null') === true) {
                            this.ts.readToken();
                            this.add(new Exp.OpIsNull());
                        }
                        else if (this.ts.isKeyword('not') === true) {
                            this.ts.readToken();
                            if (this.ts.isKeyword('null') === true) {
                                this.ts.readToken();
                                this.add(new Exp.OpIsNotNull());
                            }
                            else {
                                this.expect("NULL");
                            }
                        }
                        else {
                            this.expect("NULL");
                        }
                        break;
                    case 'in':
                        this.ts.readToken();
                        this.ts.passToken(Token.LPARENTHESE);
                        let selectOperand = this.maySelectOperand();
                        if (selectOperand === undefined) {
                            for (let i = 0; ; i++) {
                                this.expValue();
                                if (this.ts.token !== Token.COMMA) {
                                    this.add(new Exp.OpIn(i + 2));
                                    break;
                                }
                                this.ts.readToken();
                            }
                        }
                        if (this.ts.token != Token.RPARENTHESE) this.expectToken(Token.RPARENTHESE);
                        this.ts.readToken();
                        break;
                    case 'like':
                        this.ts.readToken();
                        this.expValue();
                        this.add(new Exp.OpLike());
                        break;
                    case 'between':
                        this.ts.readToken();
                        this.expValue();
                        if (this.ts.token != Token.AND) this.expect("AND");
                        this.ts.readToken();
                        this.expValue();
                        this.add(new Exp.OpBetween());
                        break;
                    case 'not':
                        this.ts.readToken();
                        if (this.ts.isKeyword('between')) this.expect("BETWEEN");
                        this.ts.readToken();
                        this.expValue();
                        if (this.ts.token != Token.AND) this.expect("AND");
                        this.ts.readToken();
                        this.expValue();
                        this.add(new Exp.OpNotBetween());
                        break;
                }
                break;
            case Token.LE:
                this.ts.readToken();
                this.expValue();
                this.add(new Exp.OpLE());
                break;
            case Token.LT:
                this.ts.readToken();
                this.expValue();
                this.add(new Exp.OpLT());
                break;
            case Token.EQU:
                this.ts.readToken();
                this.expValue();
                this.checkVarEqVar();
                this.add(new Exp.OpEQ());
                break;
            case Token.NE:
                this.ts.readToken();
                this.expValue();
                this.add(new Exp.OpNE());
                break;
            case Token.GT:
                this.ts.readToken();
                this.expValue();
                this.add(new Exp.OpGT());
                break;
            case Token.GE:
                this.ts.readToken();
                this.expValue();
                this.add(new Exp.OpGE());
                break;
        }
    }

    // delete from a where f1=f2; 会造成整个表删除。
    private checkVarEqVar() {
        let ret = this.expression.isVarEqVar();
        if (ret === true) {
            this.error('不支持条件表达式：变量=变量。建议使用表别名');
        }
    }

    protected expValue() {
        this.t();
        for (; ;) {
            switch (this.ts.token) {
                default:
                    return;
                case Token.ADD:
                    this.ts.readToken();
                    this.t();
                    this.add(new Exp.OpAdd());
                    break;
                case Token.SUB:
                    this.ts.readToken();
                    this.t();
                    this.add(new Exp.OpSub());
                    break;
            }
        }
    }

    private t() {
        this.bitWise();
        for (; ;) {
            switch (this.ts.token) {
                default:
                    return;
                case Token.VAR:
                    if (this.ts.isKeyword('div') === true) {
                        this.ts.readToken();
                        this.bitWise();
                        this.add(new Exp.OpDiv());
                    }
                    else if (this.ts.isKeyword('mod') === true) {
                        this.ts.readToken();
                        this.bitWise();
                        this.add(new Exp.OpMod());
                    }
                    return;
                case Token.MUL:
                    this.ts.readToken();
                    this.bitWise();
                    this.add(new Exp.OpMul());
                    break;
                case Token.DIV:
                    this.ts.readToken();
                    this.bitWise();
                    this.add(new Exp.OpDecDiv());
                    break;
                case Token.MOD:
                    this.ts.readToken();
                    this.bitWise();
                    this.add(new Exp.OpMod());
                    break;
            }
        }
    }

    private bitWise() {
        this.f();
        for (; ;) {
            switch (this.ts.token) {
                default: return;
                case Token.BITWISEAND:
                    this.ts.readToken();
                    this.f();
                    this.add(new Exp.OpBitwiseAnd());
                    break;
                case Token.DoubleGT:
                    this.ts.readToken();
                    this.f();
                    this.add(new Exp.OpBitRight());
                    break;
                case Token.DoubleLS:
                    this.ts.readToken();
                    this.f();
                    this.add(new Exp.OpBitLeft());
                    break;
                case Token.BITWISEOR:
                    this.ts.readToken();
                    this.f();
                    this.add(new Exp.OpBitwiseOr());
                    break;
                case Token.AT:
                    this.ts.readToken();
                    let opAt = this.context.parse(Exp.OpAt);
                    this.add(opAt);
            }
        }
    }

    private maySelectOperand(): Exp.Atom {
        if (this.ts.isKeyword('select') === true) {
            this.ts.readToken();
            let ret = new Exp.SubSelectOperand();
            let parser = ret.parser(this.context);
            parser.parse();
            this.add(ret);
            return ret;
        }
        if (this.ts.token === Token.SHARP) {
            this.ts.readToken();
            let ret = new Exp.BizExpOperand();
            this.context.parseElement(ret);
            this.add(ret);
            return ret;
        }
        /*
        if (this.ts.token === Token.COLON || this.ts.isKeyword('from') === true) {
            this.ts.readToken();
            let ret = new Exp.BizSelectOperand();
            let parser = ret.parser(this.context);
            parser.parse();
            this.add(ret);
            return ret;
        }
        */
    }

    private f() {
        let lowerVar: string;
        switch (this.ts.token) {
            case Token.BITWISEINVERT:
                this.ts.readToken();
                this.f();
                this.add(new Exp.OpBitwiseInvert());
                return;
            case Token.SUB:
                this.ts.readToken();
                if (this.ts.token === Token.GT as any) {
                    this.ts.readToken();
                    if (this.ts.token === Token.GT as any) {
                        this.ts.readToken();
                        this.f();
                        this.add(new Exp.OpJsonProp());
                        return;
                    }
                }
                this.f();
                this.add(new Exp.OpNeg());
                return;
            case Token.LPARENTHESE:
                this.ts.readToken();
                let selectOperand = this.maySelectOperand();
                if (selectOperand === undefined) {
                    this._internalParse();
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    this.add(selectOperand);
                    return;
                }
                this.expectToken(Token.RPARENTHESE);
                return;
            case Token.STRING:
                this.add(new Exp.TextOperand(this.ts.text));
                this.ts.readToken();
                return;
            case Token.NUM:
                this.add(new Exp.NumberOperand(this.ts.dec));
                this.ts.readToken();
                return;
            case Token.HEX:
                this.add(new Exp.HexOperand(this.ts.text));
                this.ts.readToken();
                return;
            case Token.DOLLARVAR:
                lowerVar = this.ts.lowerVar.substring(1);
                if (Exp.OpDollarVar.isValid(lowerVar) === false) {
                    this.error(lowerVar + '不是系统变量');
                }
                let opDollarVar = new Exp.OpDollarVar(lowerVar);
                let opDollarVarParser = opDollarVar.parser(this.context);
                opDollarVarParser.parse();
                this.add(opDollarVar);
                this.ts.readToken();
                return;
            case Token.MOD:
                this.ts.readToken();
                let bizField = new Exp.BizFieldOperand();
                this.context.parseElement(bizField);
                this.add(bizField);
                break;
            case Token.DOT:
                let varOperand = new Exp.VarOperand();
                varOperand.dotFirst = true;
                this.ts.readToken();
                if (this.ts.token as any !== Token.VAR) {
                    this.error('dot符号之后，只能跟一个字段名');
                }
                varOperand._var.push(this.ts.lowerVar);
                this.ts.readToken();
                let parser = varOperand.parser(this.context);
                parser.parse();
                this.add(varOperand);
                return;
            case Token.VAR:
                this.parseVar();
                break;
            default:
                //this.func();
                this.error('语法错误', this.ts._var);
                return;
        }
    }

    private parseVar() {
        let { lowerVar, varBrace } = this.ts;
        if (varBrace === false) {
            switch (lowerVar) {
                case 'typeof':
                    this.ts.readToken();
                    this.parseTypeof();
                    return;
                case 'nameof':
                    this.ts.readToken();
                    this.parseNameof();
                    return;
                case 'match':
                    this.ts.readToken();
                    this.parseMatch();
                    return;
                case 'null':
                    this.add(new Exp.NullOperand());
                    this.ts.readToken();
                    return;
                case 'case':
                    this.ts.readToken();
                    if (this.ts.isKeyword('when') === true) {
                        let whenCount = 1;
                        let hasElse = false;
                        this.ts.readToken();
                        //this.operators.Add(new OpCaseBoolWhen());
                        this.expCompare();
                        if (this.ts.isKeyword('then') === false) this.expect("THEN");
                        this.ts.readToken();
                        this.expValue();
                        while (this.ts.isKeyword('when') === true) {
                            this.ts.readToken();
                            this.expCompare();
                            if (this.ts.isKeyword('then') === false) this.expect("THEN");
                            this.ts.readToken();
                            this.expValue();
                            //this.operators.Add(new OpCaseBoolWhen());
                            whenCount++;
                        }
                        if (this.ts.isKeyword('else') === true) {
                            this.ts.readToken();
                            this.expValue();
                            //this.operators.Add(new OpCaseElse());
                            hasElse = true;
                        }
                        else if (this.ts.isKeyword('end') === false) this.expect("END");
                        this.ts.readToken();
                        this.add(new Exp.OpSearchCase(whenCount, hasElse));
                        return;
                    }
                    else {
                        let whenCount = 0;
                        let hasElse = false;
                        this.expValue();
                        while (this.ts.isKeyword('when') === true) {
                            this.ts.readToken();
                            this.expValue();
                            if (this.ts.isKeyword('then') === false) this.expect("THEN");
                            this.ts.readToken();
                            this.expValue();
                            //this.operators.Add(new OpCaseEquWhen());
                            whenCount++;
                        }
                        if (this.ts.isKeyword('else') === true) {
                            this.ts.readToken();
                            this.expValue();
                            //if (this.tokenStream.token != Token.END) this.tokenStream.ThrowException(this, "应该是END");
                            //this.tokenStream.ReadToken();
                            //this.operators.Add(new OpCaseElse());
                            //return;
                            hasElse = true;
                        }
                        if (this.ts.isKeyword('end') === false) this.expect("END");
                        this.ts.readToken();
                        this.add(new Exp.OpSimpleCase(whenCount, hasElse));
                        return;
                    }
                /*
                case 'tagname':
                    this.ts.readToken();
                    this.parseTag();
                    return;
                */
            }
        }

        this.ts.readToken();
        switch (this.ts.token as any) {
            default:
            case Token.DOT:
                let varOperand = new Exp.VarOperand();
                varOperand._var.push(lowerVar);
                let parser = varOperand.parser(this.context);
                parser.parse();
                this.add(varOperand);
                return;
            case Token.LPARENTHESE:
                this.func(lowerVar);
                return;
        }
    }

    private parseTypeof() {
        let opTypeof = new Exp.OpTypeof();
        let parser = opTypeof.parser(this.context);
        parser.parse();
        this.add(opTypeof);
    }

    private parseNameof() {
        let opNameof = new Exp.OpNameof();
        let parser = opNameof.parser(this.context);
        parser.parse();
        this.add(opNameof);
    }

    private parseMatch() {
        let opMatch = new Exp.OpMatch();
        let parser = opMatch.parser(this.context);
        parser.parse();
        this.add(opMatch);
    }

    private static groupFuncs = ['count', 'max', 'min', 'sum', 'avg'];
    private func(func: string) {
        this.ts.readToken();
        if (this.predefinedFunc(func) === true) return;
        if (func === 'count') {
            let op = new Exp.OpGroupCountFunc(func);
            let parser = op.parser(this.context);
            parser.parse();
            this.add(op);
            return;
        }
        if (PExpression.groupFuncs.indexOf(func) >= 0) {
            let op = new Exp.OpGroupFunc(func);
            let parser = op.parser(this.context);
            parser.parse();
            this.add(op);
            return;
        }
        if (func === 'uminute') debugger;
        let v = functions[func];
        let isUqFunc: boolean = false;
        let isUqDefined: boolean = false;
        if (v === undefined) {
            v = uqFunctions[func];
            if (v === undefined) {
                isUqDefined = true;
                // this.error('未知的函数 ' + func);
            }
            else {
                isUqFunc = true;
            }
        }
        let paramCount = this.readFuncParameters();
        if (isUqDefined === true) {
            let expFunc = new Exp.OpUqDefinedFunction(func, paramCount);
            this.context.parseElement(expFunc);
            this.add(expFunc);
        }
        else {
            this.add(new Exp.OpFunction(func, paramCount, isUqFunc));
        }
        if (Array.isArray(v)) {
            let min = v[0], max = v[1];
            if (paramCount < min) {
                this.error('函数 ' + func + ' 至少 ' + min + '个参数');
            }
            else if (paramCount > max) {
                this.error('函数 ' + func + ' 最多 ' + max + '个参数');
            }
        }
        else if (v >= 0 && v !== paramCount) {
            this.error('函数 ' + func + ' 只能是 ' + v + '个参数');
        }
    }
    private predefinedFunc(func: string): boolean {
        let paramCount = 0;
        switch (func) {
            default:
                return false;
            case 'dateadd':
                this.readDatePart();
                if (this.ts.token != Token.COMMA) this.error("DateAdd应该有3参数");
                this.ts.readToken();
                paramCount = 1 + this.readFuncParameters();
                if (paramCount != 3) this.error("DateAdd应该有3参数");
                this.add(new Exp.OpFunction(func, 3));
                break;
            case 'datepart':
                this.readDatePart();
                if (this.ts.token != Token.COMMA) this.error("DatePart应该有2参数");
                this.ts.readToken();
                paramCount = 1 + this.readFuncParameters();
                if (paramCount != 2) this.error("DatePart应该有2参数");
                this.add(new Exp.OpFunction(func, 2));
                break;
            case 'datediff':
                this.readDatePart();
                if (this.ts.token != Token.COMMA) this.error("DateAdd应该有3参数");
                this.ts.readToken();
                paramCount = 1 + this.readFuncParameters();
                if (paramCount != 3) this.error("DateAdd应该有3参数");
                this.add(new Exp.OpFunction(func, 3));
                break;
            case 'timestampdiff':
                this.readDatePart(TIMESTAMPDIFFPARTS);
                if (this.ts.token != Token.COMMA) this.error("TimeStampDiff应该有3参数");
                this.ts.readToken();
                paramCount = 1 + this.readFuncParameters();
                if (paramCount != 3) this.error("TimeStampDiff应该有3参数");
                this.add(new Exp.OpFunction(func, 3));
                break;
            case 'cast':
                this.add(this.parseCast());
                break;
            case 'isrole':
                this.add(this.parseOpRole());
                break;
            case 'id':
                this.add(this.parseOpID());
                break;
            case 'uminute':
                this.add(this.parseOpUMinute());
                break;
            case 'no':
                this.add(this.parseOpNO());
                break;
            case 'if':
                this.expCompare();
                if (this.ts.token != Token.COMMA) this.error("IF应该有3参数");
                this.ts.readToken();
                paramCount = 1 + this.readFuncParameters();
                if (paramCount != 3) this.error("IF应该有3参数");
                this.add(new Exp.OpFunction(func, 3));
                break;
            case 'convert':
                this.parseConverter();
                break;
            case 'entityid':
                this.add(this.parseOpEntityId());
                break;
            case 'entityname':
                this.add(this.parseOpEntityName());
                break;
            case 'queue':
                this.add(this.parseOpQueue());
                break;
            case 'search':
                this.add(this.parseOpSearch());
                break;
        }
        return true;
    }

    private parseCast() {
        this.expValue();
        let ret = new Exp.OpCast();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpRole() {
        let ret = new Exp.OpRole();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpID() {
        let ret = new Exp.OpID();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpUMinute() {
        let ret = new Exp.OpUMinute();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpNO() {
        let ret = new Exp.OpNO();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpEntityId() {
        let ret = new Exp.OpEntityId();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpEntityName() {
        let ret = new Exp.OpEntityName();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpQueue() {
        let ret = new Exp.OpQueue();
        ret.parser(this.context).parse();
        return ret;
    }

    private parseOpSearch() {
        let ret = new Exp.OpSearch();
        this.context.parseElement(ret);
        return ret;
    }
    /*
        private parseOpSpecId() {
            let ret = new Exp.OpSpecId();
            ret.parser(this.context).parse();
            return ret;
        }
    
        private parseOpSpecValue() {
            let ret = new Exp.OpSpecValue();
            ret.parser(this.context).parse();
            return ret;
        }
    */
    private parseCount() {
        if (this.ts.token === Token.MUL) {
            this.ts.readToken();
            this.add(new Exp.StarOperand());
        }
        else {
            this.expValue();
        }
        this.ts.assertToken(Token.RPARENTHESE);
        this.ts.readToken();
        this.add(new Exp.OpGroupFunc('count'));
    }

    private parseConverter() {
        let dataType = createDataType(this.ts.lowerVar as any); // FieldType.ParseSimple(this.tokenStream);
        if (dataType === undefined) {
            this.expect('合法的数据类型');
        }
        this.ts.readToken();
        if (this.ts.token != Token.COMMA) this.expectToken(Token.COMMA);
        this.ts.readToken();
        let paramCount = 1;
        this.expValue();
        if (this.ts.token == Token.COMMA) {
            this.ts.readToken();
            this.expValue();
            paramCount++;
        }
        if (this.ts.token != Token.RPARENTHESE) this.expectToken(Token.RPARENTHESE);
        this.ts.readToken();
        this.add(new Exp.OpConverter(dataType, paramCount));
    }

    private readFixCountFunc(func: string, count: number) {
        let paramCount = this.readFuncParameters();
        if (count != paramCount) this.error('函数' + func + '需要' + count + '个参数');
        this.add(new Exp.OpFunction(func, count));
    }

    private readVariableParameters(func: string, min: number, max: number) {
        let paramCount = this.readFuncParameters();
        if (paramCount < min) this.error('函数' + func + '至少需要' + min + '个参数');
        if (paramCount > max) this.error('函数' + func + '最多需要' + max + '个参数');
        this.add(new Exp.OpFunction(func, paramCount));
    }

    private readFuncParameters(): number {
        if (this.ts.token == Token.RPARENTHESE) {
            this.ts.readToken();
            return 0;
        }
        let n = 0;
        for (; ;) {
            this.expValue();
            n++;
            if (this.ts.token == Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token as any == Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
        return n;
    }

    static OperationExpression() {
        // Array.Sort<string>(DATEPARTS, StringComparer.CurrentCultureIgnoreCase);
    }

    private readDatePart(dateParts?: string[]) {
        if (this.ts.token !== Token.VAR) {
            this.expect('datepart');
        }
        let v = this.ts.lowerVar;
        let n = _.sortedIndexOf(dateParts || DATEPARTS, v);
        if (n >= 0) {
            this.add(new Exp.DatePartOperand(v));
            this.ts.readToken();
            return;
        }
        this.error("不是正确的DatePart");
    }
}

export class ExpressionSpace extends Space {
    private _groupType: GroupType = GroupType.Both;
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer { return; }
    get groupType(): GroupType { return this._groupType; }
    set groupType(value: GroupType) { this._groupType = value; }
}

export class PValueExpression extends PExpression {
    _internalParse() {
        this.expValue();
        const { atoms } = this.expression;
        if (atoms.length === 1) {
            const atom = atoms[0];
            (this.expression as Exp.ValueExpression).scalarValue = atom.scalarValue;
        }
    }
}

export class PCompareExpression extends PExpression {
    _internalParse() {
        this.expCompare();
    }
}

export class PComparePartExpression extends PExpression {
    _internalParse() {
        this.expValue();
    }
}

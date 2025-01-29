import { OpGroupFunc, ValueExpression, GroupType, StarOperand } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';
import { ExpressionSpace } from './expression';
import { PContext } from '../pContext';

export class POpGroupFunc extends PElement {
    protected opGroupFunc: OpGroupFunc;
    constructor(opGroupFunc: OpGroupFunc, context: PContext) {
        super(opGroupFunc, context);
        this.opGroupFunc = opGroupFunc;
    }

    _parse() {
        let exp = this.opGroupFunc.value = new ValueExpression();
        let parser = exp.parser(this.context);
        parser.parse();
        this.ts.assertToken(Token.RPARENTHESE);
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        space.groupType = GroupType.Group;
        let exp = this.opGroupFunc.value;
        let { pelement } = exp;
        if (pelement === undefined) return true;
        let theSpace = new ExpressionSpace(space);
        let ok = pelement.scan(theSpace);
        if (theSpace.groupType === GroupType.Group) {
            this.log('group function的参数里面不可以再包含group function');
            ok = false;
        }
        return ok;
    }
}

export class POpGroupCountFunc extends POpGroupFunc {
    _parse() {
        let exp = this.opGroupFunc.value = new ValueExpression();
        if (this.ts.token === Token.MUL) {
            exp.add(new StarOperand());
            this.ts.readToken();
        }
        else {
            let parser = exp.parser(this.context);
            parser.parse();
        }
        this.ts.assertToken(Token.RPARENTHESE);
        this.ts.readToken();
    }
}

/*
class OpGroupFuncSpace extends Space {
    private opGroupFunc: OpGroupFunc;
    private _isGrouped: boolean = false;
    constructor(outer:Space, opGroupFunc: OpGroupFunc) {
        super(outer);
        this.opGroupFunc = opGroupFunc;
    }
    protected _getEntity(name: string): EntityWithTable {return;}
    protected _getTableByAlias(alias: string): Table {return;}
    protected _isVar(name: string): boolean {return false;}
    get isGrouped():boolean {return this._isGrouped;}
    set isGrouped(value:boolean) {this._isGrouped = value;}
}
*/
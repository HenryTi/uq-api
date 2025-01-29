"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpGroupCountFunc = exports.POpGroupFunc = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const expression_1 = require("./expression");
class POpGroupFunc extends element_1.PElement {
    constructor(opGroupFunc, context) {
        super(opGroupFunc, context);
        this.opGroupFunc = opGroupFunc;
    }
    _parse() {
        let exp = this.opGroupFunc.value = new il_1.ValueExpression();
        let parser = exp.parser(this.context);
        parser.parse();
        this.ts.assertToken(tokens_1.Token.RPARENTHESE);
        this.ts.readToken();
    }
    scan(space) {
        space.groupType = il_1.GroupType.Group;
        let exp = this.opGroupFunc.value;
        let { pelement } = exp;
        if (pelement === undefined)
            return true;
        let theSpace = new expression_1.ExpressionSpace(space);
        let ok = pelement.scan(theSpace);
        if (theSpace.groupType === il_1.GroupType.Group) {
            this.log('group function的参数里面不可以再包含group function');
            ok = false;
        }
        return ok;
    }
}
exports.POpGroupFunc = POpGroupFunc;
class POpGroupCountFunc extends POpGroupFunc {
    _parse() {
        let exp = this.opGroupFunc.value = new il_1.ValueExpression();
        if (this.ts.token === tokens_1.Token.MUL) {
            exp.add(new il_1.StarOperand());
            this.ts.readToken();
        }
        else {
            let parser = exp.parser(this.context);
            parser.parse();
        }
        this.ts.assertToken(tokens_1.Token.RPARENTHESE);
        this.ts.readToken();
    }
}
exports.POpGroupCountFunc = POpGroupCountFunc;
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
//# sourceMappingURL=opGroupFunc.js.map
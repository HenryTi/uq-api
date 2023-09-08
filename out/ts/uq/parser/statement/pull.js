"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
export class PPull extends PStatement {
    private entityName: string;
    pull: Pull;
    constructor(pull: Pull, context: PContext) {
        super(pull, context);
        this.pull = pull;
    }
    
    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.expect('book名称');
        }
        this.entityName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('at')) this.ts.readToken();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
            let valueExp = new ValueExpression();
            this.pull.at.push(valueExp);
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
    }

    scan(space: Space): boolean {
        let ok = true;
        let entityName = this.entityName;
        let entity = space.getEntityTable(entityName);
        if (entity === undefined) {
            this.log(entityName + ' 没有定义');
            return false;
        }
        else {
            let {type} = entity;
            let {at} = this.pull;
            if (type === 'map') {
                let map:Map = entity as Map;
                let {keys, from} = map;
                if (from === undefined) {
                    this.log(`Map ${entityName} 不是可导入map，不能拉取`);
                    ok = false;
                }

                if (at.length > keys.length) {
                    this.log(`pull at 字段数超过map ${entityName}的keys数量`);
                    ok = false;
                }
            }
            else if (type === 'tuid') {
                if (at.length !== 1) {
                    this.log(`pull at tuid 只能有一个字段数`);
                    ok = false;
                }
            }
            else {
                this.log(entityName + ' 不是tuid也不是map');
                ok = false;
            }
        }
        this.pull.entity = entity as Map | Tuid;
        return ok;
    }
}
*/ 
//# sourceMappingURL=pull.js.map
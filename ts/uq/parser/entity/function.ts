import { Function, Bus, Uq, FunctionStatement, DataType, createDataType } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PActionBase, ActionBaseSpace } from './entity';

export class PFunction extends PActionBase<Function> {
    protected _parse() {
        this.setName();
        this.parseParams();
        this.ts.passKey('returns');
        let dt = this.ts.passVar();
        let dataType = this.entity.dataType = createDataType(dt);
        this.context.parseElement(dataType);
        let statement = new FunctionStatement(undefined);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
        this.entity.statement = statement;

        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
        }
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let ok = true;
        let names = this.entity.nameUnique();
        const { type, name, jName } = this.entity;
        if (names !== undefined) {
            ok = false;
            this.log(`action ${name} 字段重名: ${names.join(',')}`);
        }
        let { statement, fields } = this.entity;
        if (statement === undefined) {
            this.log(`action ${name} 没有定义语句`);
            ok = false;
        }
        let theSpace = new FunctionSpace(space, this.entity);
        if (statement.pelement.scan(theSpace) === false) ok = false;
        let { dataType } = this.entity;
        for (let field of fields) {
            if (field.dataType.pelement.scan(space) === false) ok = false;
        }
        let ret = this.scanDataType(space, dataType);
        if (ret !== undefined) {
            ok = false;
            this.log(`${type} ${jName} RETURNS type ${ret}`);
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false) ok = false;
        return ok;
    }
}

class FunctionSpace extends ActionBaseSpace {
    private func: Function;
    constructor(outer: Space, func: Function) {
        super(outer, func);
        this.func = func;
    }
    protected _useBusFace(bus: Bus, face: string, arr: string): boolean {
        return false;
    }
}

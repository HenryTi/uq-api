import { BizPhraseType, CompareExpression, Entity, FromTable, ID, IDX, NumberOperand, OpEQ, ValueExpression, VarOperand } from "../il";
import { PSelect } from "./select";
import { Space } from "./space";
import { Token } from "./tokens";

export class PBizSelect extends PSelect {
    private entity: string;
    private joins: { join: '^' | 'x'; entity: string; }[];
    private on: ValueExpression;
    protected _parse(): void {
        this.entity = this.ts.passVar();
        this.ts.passToken(Token.AT);
        this.on = new ValueExpression();
        this.context.parseElement(this.on);
    }

    scan(space: Space): boolean {
        let ok = true;

        if (this.entity !== undefined) {
            let bizEntity = space.getBizEntity(this.entity);
            if (bizEntity === undefined) {
                this.log(`${this.entity} is not defined`);
                ok = false;
            }
            let entity: Entity, tblName: string;
            switch (bizEntity.bizPhraseType) {
                default: debugger; throw new Error(`${bizEntity.name} to be implemented`);
                case BizPhraseType.atom:
                    tblName = 'atom';
                    entity.name = 'atom';
                    break;
                case BizPhraseType.spec:
                    tblName = 'spec';
                    entity = new ID(space.uq);
                    entity.name = 'spec';
                    break;
                case BizPhraseType.sheet:
                    tblName = 'sheet';
                    entity = new ID(space.uq);
                    entity.name = 'sheet';
                    break;
                case BizPhraseType.bin:
                    tblName = 'bin';
                    entity = new IDX(space.uq);
                    entity.name = 'bin';
                    break;
            }
            this.select.from = new FromTable();
            const { from } = this.select;
            from.name = tblName;
            from.entity = entity;
        }

        let expValue = new ValueExpression();
        let one = new VarOperand();
        one._var = ['i'];
        expValue.atoms.push(one);
        this.select.columns = [
            { alias: undefined, value: expValue }
        ];

        this.select.where = new CompareExpression();
        let { where } = this.select;
        where.atoms.push(
            one,
            ...this.on.atoms,
            new OpEQ(),
        );

        if (this.on.pelement.scan(space) === false) {
            ok = false;
        }

        // let limit = new ValueExpression();
        // this.select.limit = limit;
        // limit.atoms.push();
        return ok;
    }
}

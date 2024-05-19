import { FromInPendFieldSpace, FromStatementInPend } from "../../../il";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { FromSpace, PFromStatement } from "./biz.from";

export class PFromStatementInPend extends PFromStatement<FromStatementInPend> {
    protected _parse(): void {
        this.parseTblsOf(this.pFromEntity);
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(Token.SEMICOLON);
    }

    protected createFromSpace(space: Space): FromSpace {
        return new FromInPendSpace(space, this.element);
    }

    override scan(space: Space): boolean {
        return super.scan(space);
    }

    protected setEntityArr(space: Space) {
        const { fromEntity } = this.element;
        let fe = space.getBizEntityArr(undefined);
        if (fe.bizEntityArr.length > 0) debugger;
        Object.assign(fromEntity, fe);
        /*
        fromEntity.bizEntityArr = space.getBizEntityArr(undefined);
        fromEntity.bizPhraseType = BizPhraseType.pend;
        fromEntity.bizEntityTable = EnumSysTable.pend;
        */
        return true;
    }
}

class FromInPendSpace extends FromSpace {
    protected override createBizFieldSpace(from: FromStatementInPend) {
        this.bizFieldSpace = new FromInPendFieldSpace(from);
    }
}

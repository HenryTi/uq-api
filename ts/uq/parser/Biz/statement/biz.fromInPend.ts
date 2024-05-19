import { EnumSysTable, FromStatementInPend, FromInPendFieldSpace } from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
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
        fromEntity.bizEntityArr = space.getBizEntityArr(undefined);
        fromEntity.bizPhraseType = BizPhraseType.pend;
        fromEntity.bizEntityTable = EnumSysTable.pend;
        return true;
    }
}

class FromInPendSpace extends FromSpace {
    protected override createBizFieldSpace(from: FromStatementInPend) {
        this.bizFieldSpace = new FromInPendFieldSpace(from);
    }
}

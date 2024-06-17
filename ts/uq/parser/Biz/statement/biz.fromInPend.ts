import { BizEntity, BizFromEntity, EnumSysTable, FromInPendFieldSpace, FromInPendStatement } from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { FromSpace, PFromStatement } from "./biz.from";

export class PFromStatementInPend extends PFromStatement<FromInPendStatement> {
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
        let ret = super.scan(space);
        /*
        let { pendQuery: { bizPend }, fromEntity } = this.element;
        if (fromEntity.bizEntityArr.length > 0) {
            debugger;
        }
        fromEntity.bizEntityArr.push(bizPend);
        fromEntity.bizPhraseType = BizPhraseType.pend;
        fromEntity.bizEntityTable = EnumSysTable.pend;
        fromEntity.alias = 't1';
        */
        return ret;
    }

    protected scanIDsWithCheck0() {
        let ok = true;
        if (this.scanIDs() === false) {
            ok = false;
        }
        return ok;
    }

    protected setEntityArr(space: Space) {
        const { pendQuery: { bizPend }, fromEntity } = this.element;
        fromEntity.bizEntityArr.push(bizPend);
        fromEntity.bizPhraseType = BizPhraseType.pass;
        fromEntity.bizEntityTable = EnumSysTable.pend;
        return true;
    }
}

class FromInPendSpace extends FromSpace {
    protected override createBizFieldSpace(from: FromInPendStatement) {
        this.bizFieldSpace = new FromInPendFieldSpace(from);
    }
}

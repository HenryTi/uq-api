import { BizBud, IOPeers } from "../../../il";
import { ExpFunc, ExpStr, ExpVal } from "../../sql";
import { JsonContext, JsonValInMain } from "./JsonVal";

export class JsonTrans {
    protected readonly jsonContext: JsonContext

    protected readonly props: Map<string, BizBud>;
    protected readonly ioPeers: IOPeers;
    constructor(jsonContext: JsonContext, ioPeers: IOPeers) {
        this.jsonContext = jsonContext;
        this.props = ioPeers.bizIOBuds;
        this.ioPeers = ioPeers;
    }

    build() {
        let objParams: ExpVal[] = [];
        let jsonVal = new JsonValInMain(this.jsonContext, this.ioPeers);
        for (let [, bud] of this.props) {
            let { peerName, val } = jsonVal.build(bud);
            objParams.push(new ExpStr(peerName), val);
        }
        return new ExpFunc('JSON_OBJECT', ...objParams);
    }
}

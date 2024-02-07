import { Out } from "./Out";

// push给倢科的机构
export class Out2 extends Out {
    protected isPushSuccess(retJson: any) {
        return retJson.success === true;
    }
}

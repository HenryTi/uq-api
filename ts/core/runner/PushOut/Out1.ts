import { Out } from "./Out";

// bz机构之间的push
export class Out1 extends Out {
    protected isPushSuccess(retJson: any) {
        return (retJson.ok === true);
    }
}

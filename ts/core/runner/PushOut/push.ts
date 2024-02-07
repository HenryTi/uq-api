import { Out } from "./Out";
import { Out1 } from "./Out1";
import { Out2 } from "./Out2";

export async function push(type: number, outName: string, outUrl: string, outKey: string, outPassword: string, value: any) {
    let out: Out;
    switch (type) {
        default:
            debugger;
            throw new Error('unknown push out type ' + type);
        case 1:
            out = new Out1(outName, outUrl, outKey, outPassword, value);
            break;
        case 2:
            out = new Out2(outName, outUrl, outKey, outPassword, value);
            break;
    }
    return await out.push();
}

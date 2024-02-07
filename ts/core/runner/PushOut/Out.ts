import { createHash } from "crypto";
import fetch from "node-fetch";

export abstract class Out {
    protected readonly outName: string;
    protected readonly outUrl: string;
    protected readonly outKey: string;
    protected readonly outPassword: string;
    protected readonly value: any;
    constructor(outName: string, outUrl: string, outKey: string, outPassword: string, value: any) {
        this.outName = outName;
        this.outUrl = outUrl;
        this.outKey = outKey;
        this.outPassword = outPassword;
        this.value = value;
    }

    async push(): Promise<any> {
        try {
            let ret = await fetch(this.outUrl, {
                method: 'POST',
                headers: this.buildHeader(),
                body: JSON.stringify(this.buildBody()),
            });
            let retJson = await ret.json();
            if (this.isPushSuccess(retJson) === true) return;
            return retJson;
        }
        catch (err) {
            debugger;
            throw err;
        }
    }

    protected buildHeader() {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }

    protected buildBody() {
        let stamp = Date.now();
        let strData = JSON.stringify(this.value);
        let token: string = md5(stamp + strData + this.outPassword);
        let uiq: number = 0; // queueId;
        return {
            data: this.value,
            stamp,
            appKey: this.outKey,
            appkey: this.outKey,
            token,
            act: this.outName,
            uiq,
        }
    }

    protected isPushSuccess(retJson: any): boolean {
        return true;
    }
}

function md5(content: string) {
    return createHash('md5').update(content).digest('hex');
}

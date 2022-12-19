import fetch from "node-fetch";
import * as config from 'config';

(async function () {
    let port = config.get<number>('local-port');
    let url = `http://localhost:${port}/hello`;
    let resp = await fetch(url);
    let ret = await resp.text();
    console.log(ret);
    process.exit(999);
})();

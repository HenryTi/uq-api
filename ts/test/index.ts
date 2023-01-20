import { startApi } from "../start";
import fetch from "node-fetch";

(async function () {
    //process.env.NODE_ENV = 'developement';
    //let runner = await testNet.getUnitxRunner();
    //await writeDataToBus(runner, 'test', 24, 'a', 101, 8, '{a:1}');

    await startApi();

    let res = await fetch('http://localhost:3015/uq/unitx-test/joint-read-bus', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            unit: 24,
            face: '百灵威系统工程部/WebUser/WebUser',
            queue: 434898000000023
        })
    });
    let ret = await res.json();
    try {
        let s = null;
        let b = s.b;
    }
    catch (err) {
        let t = null;
    }

    /*
    let uqDb = 'salestask$test';
    let net:Net;
    let dbName:string;;
    if (uqDb.endsWith($test) === true) {
        dbName = uqDb.substring(0, uqDb.length - $test.length);
        net = testNet;
    }
    else {
        dbName = uqDb;
        net = prodNet;
    }

    let runner = await net.getRunner(dbName);

    let ret = await runner.tableFromProc('customer', [24, undefined, 431]);

    await pullEntities(runner);
    logger.debug(' ');
    logger.debug('===========================================================');
    logger.debug('=  End of test');
    logger.debug('===========================================================');
    */

    process.exit();
})();

/*
const keypress = async () => {
    (process.stdin as any).setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
      (process.stdin as any).setRawMode(false)
      resolve()
    }))
}
*/
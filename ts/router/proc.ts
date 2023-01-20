import { Router, Request, Response } from 'express';
import { BuildRunner, consts, getDbs } from "../core";

export function buildProcRouter() {
    const router: Router = Router({ mergeParams: true });
    const dbs = getDbs();
    router.get('/', async (req: Request, res: Response) => {
        let { db, proc } = req.params;

        async function buildProc(dbName: string): Promise<any> {
            try {
                let db = await dbs.getDbUq(dbName);
                let runner = new BuildRunner(db);
                await runner.buildProc(proc);
                return;
            }
            catch (err) {
                return err;
            }
        }

        /*
        if (proc.toLowerCase().startsWith('t v_') === false) {
            proc = 't v_' + proc;
        }
        */

        let dbProd = db;
        let dbTest = db + consts.$test;
        let errProd = await buildProc(dbProd);
        let errTest = await buildProc(dbTest);
        let message: string;
        if (!errProd && !errTest) {
            message = `${dbProd} and ${dbTest}`;
        }
        else if (!errProd) {
            message = dbTest;
        }
        else if (!errTest) {
            message = dbProd;
        }
        else {
            message = undefined;
        }
        if (message) {
            message += ` stored procedure ${proc} built successfully`;
        }
        else {
            message = `faild to build ${proc} in ${dbProd} and ${dbTest}`;
        }

        res.json({
            message
        });
    });

    return router;
}
import { Router, Request, Response } from 'express';
import { BizApiRunner } from '../../core';
import { RouterWebBuilder } from "../routerBuilder";

export function buildApiRouter(rb: RouterWebBuilder) {
    let router: Router = Router();
    router.get('/', async (req: Request, res: Response) => {
        let apiRunner = new BizApiRunner();
        let ret = await apiRunner.hello();
        res.json({
            ok: true,
            res: {
                ret,
            }
        });
    });

    router.post('/', async (req: Request, res: Response) => {
        let apiRunner = new BizApiRunner();
        console.log(req.headers);
        let ret = await apiRunner.saveIOInQueue(req.body);
        res.json(ret);
    });
    return router;
}

function auth(userName: string, token: string): boolean {
    if (Number.isNaN(Number(token)) === true) {
        return false;
    }
    return true;
}
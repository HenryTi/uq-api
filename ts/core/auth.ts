import { Router, Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as config from 'config';
import * as crypto from 'crypto';
import { logger } from '../tool';

//export const debugUser = config.get<number>('debugUser');
//export const debugUnit = config.get<number>('debugUnit');
export interface AuthUser {
    db: string,
    //id: number,
    //unit: number,
    roles?: string,
}

let userTokenSecret = config.get<string>('secret');

export default class Auth {
    //private roles: string[];
    //private anyRole: boolean;
    private noUser: boolean;
    constructor(roles: string[]) {
        if (roles === undefined) {
            this.noUser = true;
            return;
        }
        if (roles[0] === '*') {
            //this.anyRole = true;
            return;
        }
        //this.roles = roles;
    }
    /*
    hasRole(roles:string): boolean {
        if (this.anyRole === true) return true;
        if (roles === undefined) return false;
        let rs: string[] = roles.split(',');
        for (let r of rs) {
            for (let role of this.roles)
                if (r === role) return true;
        }
        return false;
    }
    */
    check(req: Request, res: Response, next: NextFunction) {
        if (this.noUser === true) {
            if (next !== undefined) next();
            return;
        }
        let token = req.header('Authorization');
        if (token === undefined) {
            token = req.header('sec-websocket-protocol');
        }
        if (token === undefined) {
            let err = 'not authorized request';
            logger.debug(err);
            if (res !== undefined) res.end(err);
            return;
        }
        let unit = req.header('unit');
        //let secret = config.get<string>('secret'); // .appSecret;
        //logger.debug('auth check: secret=%s, token=%s', secret, token);
        jwt.verify(token, userTokenSecret,
            (err, decoded: AuthUser) => {
                if (err === null) {
                    decoded.db = req.params.db;
                    if (!(decoded as any).unit) {
                        if (unit !== undefined) {
                            (decoded as any).unit = Number(unit);
                        }
                    }
                    (req as any).user = decoded;
                    next();
                    return;
                    /*
                    if (this.hasRole(decoded.roles) === true) {
                        if (next !== undefined) next();
                        return;
                    }
                    */
                }
                if ((decoded as any).id === 0) {
                    res.status(401);
                    res.json(
                        {
                            error: {
                                type: 'unauthorized',
                                unauthorized: true,
                                message: 'Unauthorized user=0 unit=' + (decoded as any).unit,
                            }
                        });
                }
                if (res !== undefined) {
                    res.status(401);
                    res.json(
                        {
                            error: {
                                type: 'unauthorized',
                                unauthorized: true,
                                message: 'Unauthorized'
                            }
                        });
                }
            });
    }
    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            this.check(req, res, next);
        }
    }
    middlewareDebug() {
        return (req: Request, res: Response, next: NextFunction) => {
            (req as any).user = {
                db: req.params.db,
                //id: debugUser,
                //unit: debugUnit,
                roles: undefined,
            }
            next();
        }
    }
    middlewareUnitx() {
        let self = this;
        return function (req: Request, res: Response, next: NextFunction) {
            (req as any).user = {
                db: req.params.db,
            }
            next();
        }
    }
    middlewareJoint() {
        let self = this;
        return function (req: Request, res: Response, next: NextFunction) {
            let unit = req.header('unit');
            (req as any).user = {
                db: req.params.db,
                unit: unit
            }
            next();
        }
    }
}

export const authCheck = new Auth(['*']).middleware();
export const authDebug = new Auth(['*']).middlewareDebug();
export const authUnitx = new Auth(['*']).middlewareUnitx();
export const authJoint = new Auth(['*']).middlewareJoint();

const uqBuildPublicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuOQAki2EFEiaPZSuuw8a
aRFTuSmJfZE4YFDMQqKTcmf5GAgeC4YFqcpBboT1nEJonTbEZSDfJbl5QQcaYAC6
uRI53OqTSrjECpyfuTx0YLFfywk0+UHSmzvhOwgwd3zwUSADyJVw1uBLO9ehnBW1
qu9L3GmRmATBxpW8AC9BSz6yT/lopewAMwDlWO1nVcnwaKeGeV6pkz8GzKGc12Sz
Qx2poLk4l1LFjanP6QCOj+qLXyB0jn/dECalbMvwOw/WeR3NWdoOpO1L/rGcSheF
mWxLG3DQflraor5LIeDgMC5+3C+ivVzm9tctU0JpPd9JDBsoQCS+Bt9KMQfPGBdt
0O+IMkniHDEvaBWwlU8bg2+Ae6f9odwlfptCx6MQ6esWjXRXzhcRN1LveBIikA+l
xrwIx2n8aBb/R4zm0kHGgye+CBAC/0wYrSsvzSChvmCqbvWZ1VOLLlkrOcG2n0b2
uE9VTJMjEu0VSTfpWKh72Q9mM/90fIcUzQoeSfy6/WRo5G5edcoAddof6P3mEuqt
0+aSWi1jdR8vGt/Rk6hr69qDFbRcIJsTL7F9BcSgwV3sJDe1in4VbpyBAigh7vJJ
Cb61lMMNHBfTWwcKGzs4zUtnGxla2D6bQ7+wbgGlErEdoWukQasqkVToTaqwGEKQ
xQgjLRiW0VhmoWJFM/Sm/CECAwEAAQ==
-----END PUBLIC KEY-----
`;
let uqBuildSecret: string;

var decryptStringWithRsaPublicKey = function (toDecrypt: string): string {
    var buffer = Buffer.from(toDecrypt, "base64");
    const decrypted = crypto.publicDecrypt(uqBuildPublicKey, buffer);
    return decrypted.toString("utf8");
};
export function setUqBuildSecret(ubs: string) {
    uqBuildSecret = decryptStringWithRsaPublicKey(ubs);
}
/*
function middlewareUqBuildUserToken(req: Request, res: Response, next: NextFunction) {
    let userToken = req.header('user-token');
    if (userToken) {
        let ret = jwt.decode(userToken);
        jwt.verify(userToken, userTokenSecret, (err, decoded) => {
            if (err === null) {
                (req as any).user = decoded;
                if (next !== undefined) next();
                return;
            }
            res.status(401);
            res.json({
                error: {
                    unauthorized: true,
                    message: 'Unauthorized'
                }
            });
        });
    }
}
*/

function middlewareUqBuild(req: Request, res: Response, next: NextFunction) {
    let userToken = req.header('user-token');
    if (userToken) {
        let user = jwt.decode(userToken);
        (req as any).user = user;
    }
    if (req.url === '/start') {
        logger.debug('middlewareUqBuild req.uql /start');
        if (next !== undefined) next();
        return;
    }
    let token = req.header('Authorization');
    if (token === undefined) {
        token = req.header('sec-websocket-protocol');
    }
    if (token === undefined) {
        let err = 'not authorized request';
        logger.debug(err);
        if (res !== undefined) res.end(err);
        return;
    }
    let secret = uqBuildSecret;
    jwt.verify(token, secret,
        (err, decoded: { value: string }) => {
            if (err === null) {
                if (next !== undefined) next();
                return;
            }
            if (res !== undefined) {
                res.status(401);
                res.json(
                    {
                        error: {
                            unauthorized: true,
                            message: 'Unauthorized'
                        }
                    });
            }
        });
}

//export const authUpBuildUserToken = middlewareUqBuildUserToken;
export const authUpBuild = middlewareUqBuild;

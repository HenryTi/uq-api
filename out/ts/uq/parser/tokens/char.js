"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Char = void 0;
const chars = '+-*\\/%(){}[].,;:^=<>&|\'"_?09$@#~!';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const chinesePunctuation = '，。、？！·《》—【】';
class Char {
    static isChinesePunctuation(ch) {
        return chinesePunctuation.includes(String.fromCharCode(ch));
    }
}
exports.Char = Char;
Char.NULL = 0;
Char.TAB = 9;
Char._R = 10;
Char.ENTER = 13;
Char.ENTER_R = 14;
Char.R_ENTER = 15;
Char.SPACE = 32;
Char.PLUS = chars.charCodeAt(0);
Char.MINUS = chars.charCodeAt(1);
Char.STAR = chars.charCodeAt(2);
Char.BACKSLASH = chars.charCodeAt(3);
Char.SLASH = chars.charCodeAt(4);
Char.PERCENT = chars.charCodeAt(5);
Char.LParenthese = chars.charCodeAt(6);
Char.RParenthese = chars.charCodeAt(7);
Char.LBrace = chars.charCodeAt(8);
Char.RBrace = chars.charCodeAt(9);
Char.LBracket = chars.charCodeAt(10);
Char.RBracket = chars.charCodeAt(11);
Char.DOT = chars.charCodeAt(12);
Char.COMMA = chars.charCodeAt(13);
Char.SEMICOLON = chars.charCodeAt(14);
Char.COLON = chars.charCodeAt(15);
Char.TOPANGLE = chars.charCodeAt(16);
Char.EQU = chars.charCodeAt(17);
Char.LS = chars.charCodeAt(18);
Char.GT = chars.charCodeAt(19);
Char.AND = chars.charCodeAt(20);
Char.OR = chars.charCodeAt(21);
Char.Apostrophe = chars.charCodeAt(22); // '
Char.QUOT = chars.charCodeAt(23); // "
Char.UNDERLINE = chars.charCodeAt(24); // _
Char.QUESTION = chars.charCodeAt(25);
Char.ZERO = chars.charCodeAt(26);
Char.NINE = chars.charCodeAt(27);
Char.DOLLAR = chars.charCodeAt(28);
Char.AT = chars.charCodeAt(29);
Char.SHARP = chars.charCodeAt(30);
Char.Tilde = chars.charCodeAt(31);
Char.Exclamation = chars.charCodeAt(32);
Char.a = lowercase.charCodeAt(0);
Char.b = lowercase.charCodeAt(1);
Char.c = lowercase.charCodeAt(2);
Char.d = lowercase.charCodeAt(3);
Char.e = lowercase.charCodeAt(4);
Char.f = lowercase.charCodeAt(5);
Char.g = lowercase.charCodeAt(6);
Char.h = lowercase.charCodeAt(7);
Char.i = lowercase.charCodeAt(8);
Char.j = lowercase.charCodeAt(9);
Char.k = lowercase.charCodeAt(10);
Char.l = lowercase.charCodeAt(11);
Char.m = lowercase.charCodeAt(12);
Char.n = lowercase.charCodeAt(13);
Char.o = lowercase.charCodeAt(14);
Char.p = lowercase.charCodeAt(15);
Char.q = lowercase.charCodeAt(16);
Char.r = lowercase.charCodeAt(17);
Char.s = lowercase.charCodeAt(18);
Char.t = lowercase.charCodeAt(19);
Char.u = lowercase.charCodeAt(20);
Char.v = lowercase.charCodeAt(21);
Char.w = lowercase.charCodeAt(22);
Char.x = lowercase.charCodeAt(23);
Char.y = lowercase.charCodeAt(24);
Char.z = lowercase.charCodeAt(25);
Char.A = uppercase.charCodeAt(0);
Char.B = uppercase.charCodeAt(1);
Char.C = uppercase.charCodeAt(2);
Char.D = uppercase.charCodeAt(3);
Char.E = uppercase.charCodeAt(4);
Char.F = uppercase.charCodeAt(5);
Char.G = uppercase.charCodeAt(6);
Char.H = uppercase.charCodeAt(7);
Char.I = uppercase.charCodeAt(8);
Char.J = uppercase.charCodeAt(9);
Char.K = uppercase.charCodeAt(10);
Char.L = uppercase.charCodeAt(11);
Char.M = uppercase.charCodeAt(12);
Char.N = uppercase.charCodeAt(13);
Char.O = uppercase.charCodeAt(14);
Char.P = uppercase.charCodeAt(15);
Char.Q = uppercase.charCodeAt(16);
Char.R = uppercase.charCodeAt(17);
Char.S = uppercase.charCodeAt(18);
Char.T = uppercase.charCodeAt(19);
Char.U = uppercase.charCodeAt(20);
Char.V = uppercase.charCodeAt(21);
Char.W = uppercase.charCodeAt(22);
Char.X = uppercase.charCodeAt(23);
Char.Y = uppercase.charCodeAt(24);
Char.Z = uppercase.charCodeAt(25);
Char.USPACE = 0x3000;
Char.ChinsePunctuation = 0x3001;
//# sourceMappingURL=char.js.map
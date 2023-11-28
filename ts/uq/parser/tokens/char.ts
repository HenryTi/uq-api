
const chars = '+-*\\/%(){}[].,;:^=<>&|\'"_?09$@#~!';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const chinesePunctuation = '，。、？！·《》—【】';

export class Char {
    static NULL = 0;
    static TAB = 9;
    static _R = 10;
    static ENTER = 13;
    static ENTER_R = 14;
    static R_ENTER = 15;
    static SPACE = 32;

    static PLUS = chars.charCodeAt(0);
    static MINUS = chars.charCodeAt(1);
    static STAR = chars.charCodeAt(2);
    static BACKSLASH = chars.charCodeAt(3);
    static SLASH = chars.charCodeAt(4);
    static PERCENT = chars.charCodeAt(5);
    static LParenthese = chars.charCodeAt(6);
    static RParenthese = chars.charCodeAt(7);
    static LBrace = chars.charCodeAt(8);
    static RBrace = chars.charCodeAt(9);
    static LBracket = chars.charCodeAt(10);
    static RBracket = chars.charCodeAt(11);
    static DOT = chars.charCodeAt(12);
    static COMMA = chars.charCodeAt(13);
    static SEMICOLON = chars.charCodeAt(14);
    static COLON = chars.charCodeAt(15);
    static TOPANGLE = chars.charCodeAt(16);
    static EQU = chars.charCodeAt(17);
    static LS = chars.charCodeAt(18);
    static GT = chars.charCodeAt(19);
    static AND = chars.charCodeAt(20);
    static OR = chars.charCodeAt(21);
    static Apostrophe = chars.charCodeAt(22);     // '
    static QUOT = chars.charCodeAt(23);     // "
    static UNDERLINE = chars.charCodeAt(24);     // _
    static QUESTION = chars.charCodeAt(25);
    static ZERO = chars.charCodeAt(26);
    static NINE = chars.charCodeAt(27);
    static DOLLAR = chars.charCodeAt(28);
    static AT = chars.charCodeAt(29);
    static SHARP = chars.charCodeAt(30);
    static Tilde = chars.charCodeAt(31);
    static Exclamation = chars.charCodeAt(32);

    static a = lowercase.charCodeAt(0);
    static b = lowercase.charCodeAt(1);
    static c = lowercase.charCodeAt(2);
    static d = lowercase.charCodeAt(3);
    static e = lowercase.charCodeAt(4);
    static f = lowercase.charCodeAt(5);
    static g = lowercase.charCodeAt(6);
    static h = lowercase.charCodeAt(7);
    static i = lowercase.charCodeAt(8);
    static j = lowercase.charCodeAt(9);
    static k = lowercase.charCodeAt(10);
    static l = lowercase.charCodeAt(11);
    static m = lowercase.charCodeAt(12);
    static n = lowercase.charCodeAt(13);
    static o = lowercase.charCodeAt(14);
    static p = lowercase.charCodeAt(15);
    static q = lowercase.charCodeAt(16);
    static r = lowercase.charCodeAt(17);
    static s = lowercase.charCodeAt(18);
    static t = lowercase.charCodeAt(19);
    static u = lowercase.charCodeAt(20);
    static v = lowercase.charCodeAt(21);
    static w = lowercase.charCodeAt(22);
    static x = lowercase.charCodeAt(23);
    static y = lowercase.charCodeAt(24);
    static z = lowercase.charCodeAt(25);

    static A = uppercase.charCodeAt(0);
    static B = uppercase.charCodeAt(1);
    static C = uppercase.charCodeAt(2);
    static D = uppercase.charCodeAt(3);
    static E = uppercase.charCodeAt(4);
    static F = uppercase.charCodeAt(5);
    static G = uppercase.charCodeAt(6);
    static H = uppercase.charCodeAt(7);
    static I = uppercase.charCodeAt(8);
    static J = uppercase.charCodeAt(9);
    static K = uppercase.charCodeAt(10);
    static L = uppercase.charCodeAt(11);
    static M = uppercase.charCodeAt(12);
    static N = uppercase.charCodeAt(13);
    static O = uppercase.charCodeAt(14);
    static P = uppercase.charCodeAt(15);
    static Q = uppercase.charCodeAt(16);
    static R = uppercase.charCodeAt(17);
    static S = uppercase.charCodeAt(18);
    static T = uppercase.charCodeAt(19);
    static U = uppercase.charCodeAt(20);
    static V = uppercase.charCodeAt(21);
    static W = uppercase.charCodeAt(22);
    static X = uppercase.charCodeAt(23);
    static Y = uppercase.charCodeAt(24);
    static Z = uppercase.charCodeAt(25);

    static USPACE = 0x3000;
    static ChinsePunctuation = 0x3001;
    static isChinesePunctuation(ch: number) {
        return chinesePunctuation.includes(String.fromCharCode(ch));
    }
}
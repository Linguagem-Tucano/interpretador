export interface Token {
    type: TokenType,
    value: string,
}

export enum TokenType {
    BinaryOperator,
    UnaryOperator,

    ComparatorOperator,

    Assignment,

    Number,
    Real,
    Identifier,
    StringLiteral,

    Reserved,

    Whitespace,

    LParen, // (
    RParen, // )
    LColch, // [
    RColch, // ]
    LChave, // {
    RChave, // }

    DoisPontos,
    Virgula,
    Ponto,

    Aspas,

    EOL,
    EOF,
}

export const reservedWords = [
    "var",
    "int",
    "caractere",
    "real",
    "logico",
    
    "se",
    "senao",
    
    "para",
    "de",
    "faca",

    "enquanto",
    "repita",
    "ate",

    "funcao",
    "retorna",

    "escreva",
    "escreval",
    "leia",

    "classe",
    "construtor",
    "privado",
    "protegido",
    "publico",
    "novo"
];

const binaryOperators = [
    "+",
    "-",
    "*",
    "/",
    "%",
    "//",
    "^",
    "..",
];

const comparatorOperators = [
    "==",
    ">=",
    "<=",
    ">",
    "<",
    "~=",
]

const assign = "=";

const endOfLine = [
    ";",
    "\n",
]

const openAndClose: {[id:string]:TokenType} = {
    "(":TokenType.LParen,
    ")":TokenType.RParen,
    "[":TokenType.LColch,
    "]":TokenType.RColch,
    "{":TokenType.LChave,
    "}":TokenType.RChave,
    ":":TokenType.DoisPontos,
    ",":TokenType.Virgula,
}

function isBinaryOperator(str:string) {
    return binaryOperators.includes(str);
}

function isEndOfLine(str:string) {
    return endOfLine.includes(str);
}

function isAssign(str:string):boolean {
    return (str==assign);
}

function isComparator(str:string):boolean {
    return comparatorOperators.includes(str);
}

function isOpeningOrClosing(str:string) {
    return openAndClose[str]!=null;
}

function isLetter(str: string):boolean {
    return /[a-zA-Z]/.test(str);
}

function isNumber(str: string):boolean {
    return /^\d+$/.test(str);
}

function isComentario(str: string):boolean {
    return "--".includes(str);
}

function isPonto(str: string):boolean {
    return ".".includes(str);
}

function isReal(str:string):boolean {
    return isNumber(str) || str.includes(".");
}

function isAspas(str:string):boolean {
    return "\"".includes(str);
}

function isWhiteSpace(str:string):boolean {
    return /\s/.test(str);
}

function isReservedWord(str:string):boolean {
    return reservedWords.includes(str);
}

function token(value:string,type:TokenType): Token {
    return {value,type};
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>;
    const src = sourceCode.split("");

    //run til end of source code
    while (src.length>0) {
        let testStr = src[0];
        if (testStr=="/") {
            testStr+=src[1];
            
            if (isBinaryOperator(testStr)) {
                tokens.push(token(testStr,TokenType.BinaryOperator));
                for (let i=0; i<testStr.length; i++) {
                    src.shift();
                }
                continue;
            } else if (isBinaryOperator(src[0])) {
                tokens.push(token(src[0],TokenType.BinaryOperator));
                src.shift();
                continue;
            }
        }
        if (isPonto(testStr)) {
            testStr+=src[1];
            if (isBinaryOperator(testStr)) {
                tokens.push(token(testStr,TokenType.BinaryOperator));
                src.shift();
                src.shift();
                continue;
            } else {
                tokens.push(token(testStr,TokenType.Ponto));
                src.shift();
                continue;
            }
            
        }
        if (testStr=="-") {
            testStr+=src[1];
            if (isComentario(testStr)) {
                while (!isEndOfLine(src[0]) && src.length>0) {
                    src.shift();
                }
                src.shift();
                if (src.length<=0) {
                    continue;
                }
            }
        }

        if (isBinaryOperator(src[0])) {
            tokens.push(token(src[0],TokenType.BinaryOperator));
            src.shift();
            continue;
        }
        if (isOpeningOrClosing(src[0])) {
            tokens.push(token(src[0],openAndClose[src[0]]));
            src.shift();
            continue;
        }

        if (testStr=="=" || testStr==">" || testStr=="<" || testStr=="~") {
            testStr+=src[1];
            if (isComparator(testStr)) {
                tokens.push(token(testStr,TokenType.ComparatorOperator));
                src.shift();
                src.shift();
                continue;
            } else if (isComparator(src[0])) {
                tokens.push(token(src[0],TokenType.ComparatorOperator));
                src.shift();
                continue;
            }
        }
        if (isComparator(src[0])) {
            tokens.push(token(src[0],TokenType.ComparatorOperator));
            src.shift();
            continue;
        }

        if (isAssign(src[0])) {
            tokens.push(token(src[0],TokenType.Assignment));
            src.shift();
            continue;
        }
        if (isEndOfLine(src[0])) {
            tokens.push(token(src[0],TokenType.EOL));
            src.shift();
            continue;
        }
        if (isWhiteSpace(src[0])) {
            //tokens.push(token(src[0],TokenType.Whitespace));
            src.shift();
            continue;
        }
        //Time to deal with multichar things

        //deal with integer numbers and real numbers
        if (isReal(src[0])) {
            let number = "";
            while (src.length>0 && isReal(src[0])) {
                number+=src[0];
                src.shift();
            }
            let ttype = TokenType.Number;
            if (number.includes(".")) {ttype=TokenType.Real;} 
            tokens.push(token(number,ttype));
            continue;
        }

        if (isAspas(src[0])) {
            let text = "";
            src.shift(); //eat the "
            while (src.length>0 && !isAspas(src[0])) {
                text+=src[0];
                src.shift();
            }
            src.shift(); //eat the last "
            tokens.push(token(text,TokenType.StringLiteral));
            continue;
        }

        //deal with string literal
        if (isLetter(src[0])) {
            let text = "";
            while (src.length>0 && isLetter(src[0])) {
                text+=src[0];
                src.shift();
            }
            if (isReservedWord(text)) {
                tokens.push(token(text,TokenType.Reserved));
            } else if (text!="") {
                tokens.push(token(text,TokenType.Identifier))
            }
            continue;
        }
    }

    tokens.push(token("EOF",TokenType.EOF));
    return tokens;
}
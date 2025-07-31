// deno-lint-ignore-file no-case-declarations
import { Stmt, Dot, Program, BinaryExpr, Expr, Identifier, IfStmt, NumericLiteral, VarDecl, EndOfLine, AssignmentExpr, StringLiteral, ComparatorExpr, EndScope, RealLiteral, ArgumentExpr, FuncDecl, FuncCall, ReturnExpr, OutputStmt, InputStmt, ForStmt, ListLiteral, ListIdentifier, ForEachStmt, WhileStmt, UntilStmt, Class, AttributeLookup, NewObjectExpr, CallLookup} from "./ast.ts";
import { tokenize, Token, TokenType} from "./lexer.ts";
import { ValueType } from "./values.ts"

export default class Parser {
    private tokens: Token[] = [];

    private insideClass = false;
    private insideClassName = "";

    private at():Token {
        return this.tokens[0] as Token;
    }

    private advance() {
        return this.tokens.shift() as Token;
    }

    private peek() {
        return this.tokens[1] as Token;
    }

    private eatOnly(type:TokenType,err:string) {
        const tk = this.tokens.shift()
        if (tk?.type==type) {
            return tk
        } else {
            throw err;
        }
    }

    public produceAST(sourceCode:string):Program {
        this.tokens = tokenize(sourceCode);
        const program:Program = {
            kind:"Program",
            body:[],
        };

        while (this.notEOF()) {
            program.body.push(this.parseStmt())
        }

        return program;
    }

    private notEOF():boolean {
        return this.tokens[0].type!=TokenType.EOF;
    }

    private parseStmt():Stmt {
        //this is not going to work man...
        switch (this.at().type) {
            case TokenType.Var:
                return this.parseVarDecl();
            case TokenType.Caractere:
                return this.parseVarDecl();
            case TokenType.Int:
                return this.parseVarDecl();
            case TokenType.RealWord:
                return this.parseVarDecl();
            case TokenType.Logico:
                return this.parseVarDecl();
            case TokenType.Se:
                return this.parseIfStmt();
            case TokenType.Funcao:
                return this.parseFuncDecl();
            case TokenType.Retorna:
                return this.parseReturnExpr();
            case TokenType.Escreva:
                return this.parseOutputStmt();
            case TokenType.Escreval:
                return this.parseOutputStmt();
            case TokenType.Leia:
                return this.parseInputStmt();
            case TokenType.Para:
                return this.parseForStmt();
            case TokenType.Enquanto:
                return this.parseWhileStmt();
            case TokenType.Repita:
                return this.parseUntilStmt();
            case TokenType.Classe:
                return this.parseClassStmt();
            case TokenType.Construtor:
                return this.parseConstructor();
            case TokenType.Novo:
                return this.parseNewObjectExpr();
            default:
                return this.parseExpr();
        }
        
    }

    private parseNewObjectExpr(): Stmt {
        this.advance(); // consume 'novo'
        const className = this.eatOnly(TokenType.Identifier, "Esperava o nome da classe").value;
        this.eatOnly(TokenType.LParen, "Esperava '(' após o nome da classe");
        
        const args: Expr[] = [];
        while (this.at().type !== TokenType.RParen && this.at().type !== TokenType.EOF) {
            if (this.at().type == TokenType.Virgula) {
                this.advance();
                continue;
            }
            args.push(this.parseExpr());
        }
        
        this.eatOnly(TokenType.RParen, "Esperava ')'");
        
        return {
            kind: "NewObjectExpr",
            class: className,
            args,
        } as NewObjectExpr;
    }

    private parseClassStmt(): Stmt {
        this.advance(); // consume 'classe'
    
        const identifier = this.eatOnly(TokenType.Identifier, "Esperava o nome da classe").value;
        this.eatOnly(TokenType.LChave, "Esperava '{' após o nome da classe");
    
        const body = [] as Stmt[];
        this.insideClass = true;
    
        while (this.at().type !== TokenType.RChave && this.at().type !== TokenType.EOF) {
            // Construtor
            const s = this.parseStmt();
            
            body.push(s);
        }
    
        this.insideClass = false;
        this.advance(); // consume '}'
        
        const ret = {kind:"Class", identifier, body} as Class;
        return ret;
    }
    
    private parseConstructor(): FuncDecl {
        if (!this.insideClass) {
            throw "Um construtor deve estar sempre dentro de uma classe"
        }

        this.advance(); // consume 'construtor'
    
        this.eatOnly(TokenType.LParen, "Esperava '(' após 'construtor'");
        const args: ArgumentExpr[] = [];
    
        while (this.at().type !== TokenType.RParen && this.at().type !== TokenType.EOF) {
            if (this.at().type === TokenType.Virgula) {
                this.advance();
                continue;
            }
        
            const argname = this.eatOnly(TokenType.Identifier, "Esperava nome de argumento").value;
            let argtype = "NullVal" as ValueType;
        
            if (this.at().type === TokenType.DoisPontos) {
                this.advance(); // consume ':'
                const argumenttype = this.advance();
                switch(argumenttype.type) {
                    case TokenType.Int:
                        argtype="NumberVal";
                        break;
                    case TokenType.Caractere:
                        argtype="StringVal";
                        break;
                    case TokenType.RealWord:
                        argtype="RealVal";
                        break;
                    case TokenType.Logico:
                        argtype="BooleanVal";
                        break;
                    case TokenType.Var:
                        argtype="NullVal";
                        break;
                    default:
                        throw "Esperava um tipo válido de variável. Recebi: "+argtype;
                }
            }
        
            args.push({
                kind: "ArgumentExpr",
                identifier: argname,
                type: argtype,
            });
        }
    
        this.eatOnly(TokenType.RParen, "Esperava ')'");
        this.eatOnly(TokenType.LChave, "Esperava '{' para iniciar corpo do construtor");
    
        const body: Stmt[] = [];
        while (this.at().type !== TokenType.RChave && this.at().type !== TokenType.EOF) {
            body.push(this.parseStmt());
        }
    
        this.advance(); // consume '}'
    
        return {
            kind: "FuncDecl",
            identifier: "construtor",
            type: "any",
            args,
            body,
        } as FuncDecl;
    }
    

    private parseWhileStmt(): Stmt {
        //enquanto () {}
        this.advance() //go past enquanto
        this.eatOnly(TokenType.LParen, "Esperava um (");
        const comparison = this.parseExpr();
        this.eatOnly(TokenType.RParen, "Esperava um )");

        this.eatOnly(TokenType.LChave, "Esperava um {");
        const body = [] as Stmt[];
        //while para pegar o body da função
        while (this.at().type!=TokenType.RChave && this.at().type!=TokenType.EOF) {
            const s = this.parseStmt();
            
            body.push(s);
        }
        this.advance(); //go past }
        return {kind:"WhileStmt", body, comparison} as WhileStmt;
    }

    private parseUntilStmt(): Stmt {
        //repita ate () {}
        this.advance() //go past enquanto
        
        this.eatOnly(TokenType.Ate, "Esperava um 'ate'")
        
        this.eatOnly(TokenType.LParen, "Esperava um (");
        const comparison = this.parseExpr();
        this.eatOnly(TokenType.RParen, "Esperava um )");

        this.eatOnly(TokenType.LChave, "Esperava um {");
        const body = [] as Stmt[];
        //while para pegar o body da função
        while (this.at().type!=TokenType.RChave && this.at().type!=TokenType.EOF) {
            const s = this.parseStmt();
            
            body.push(s);
        }
        this.advance(); //go past }
        return {kind:"UntilStmt", body, comparison} as UntilStmt;
    }

    private parseForStmt(): Stmt {
        //para (i=1,10) faca { }
        this.advance(); //go past para
        this.eatOnly(TokenType.LParen,"Esperava um (");
        const variable = {symbol:this.eatOnly(TokenType.Identifier,"Esperava uma váriavel").value} as Identifier;

        if (this.at().type==TokenType.Assignment) {
            return this.parseForNormalStmt(variable);
        } else if (this.at().type==TokenType.De) {
            return this.parseForEachStmt(variable);
        }

        throw "Erro em definir um laço de repetição para..faça";
    }

    private parseForEachStmt(variable:Identifier):Expr {
        
        this.eatOnly(TokenType.De,"Esperava um 'de'");
        
        const lista = {symbol:this.eatOnly(TokenType.Identifier,"Esperava o nome de uma lista").value} as Identifier;
        
        this.eatOnly(TokenType.RParen,"Esperava um )");
        
        this.eatOnly(TokenType.Faca,"Esperava um 'faça'")
        
        this.eatOnly(TokenType.LChave,"Esperava um {");
        
        const step = {kind:"NumericLiteral",value:1} as NumericLiteral;

        const body = [] as Stmt[];


        //while para pegar o body da função
        while (this.at().type!=TokenType.RChave && this.at().type!=TokenType.EOF) {
            const s = this.parseStmt();
            
            body.push(s);
        }
        this.advance(); //go past }

        return {kind:"ForEachStmt",variable,list:lista,body,step} as ForEachStmt;
    }

    private parseForNormalStmt(variable:Identifier): Expr {
        this.eatOnly(TokenType.Assignment,"Esperava um =");
        const startIndex = this.parseExpr();
        this.eatOnly(TokenType.Virgula,"Esperava uma virgula");
        const endIndex = this.parseExpr();
        this.eatOnly(TokenType.RParen,"Esperava um )");
        this.eatOnly(TokenType.Faca,"Esperava um 'faca'")
        this.eatOnly(TokenType.LChave,"Esperava um {");
        
        const step = {kind:"NumericLiteral",value:1} as NumericLiteral;

        const body = [] as Stmt[];


        //while para pegar o body da função
        while (this.at().type!=TokenType.RChave && this.at().type!=TokenType.EOF) {
            const s = this.parseStmt();
            
            body.push(s);
        }
        this.advance(); //go past }

        return {kind:"ForStmt",variable,startIndex,endIndex,body,step} as ForStmt;
    }

    private parseOutputStmt(): Expr {
        let final = "";
        if (this.at().type==TokenType.Escreval) {final="\n";}
        this.advance(); //go past escreva
        this.eatOnly(TokenType.LParen,"Esperava um '('.");
        let value;
        while (this.at().type!=TokenType.RParen && this.at().type!=TokenType.EOF) {
            value = this.parseStmt();
        }
        this.eatOnly(TokenType.RParen,"Esperava um ')'.");
        return {kind:"OutputStmt", value, final} as OutputStmt;
    }

    private parseInputStmt(): Expr {
        if (this.at().type==TokenType.Leia) {
            this.advance(); //go past leia
            this.eatOnly(TokenType.LParen,"Esperava um '('.");
            let text = null;
            let varname = "";
            if (this.at().type!=TokenType.RParen) {
                text = this.parseExpr();
                if (this.at().type==TokenType.Virgula) {
                    this.advance(); //go past ,
                    varname = this.eatOnly(TokenType.Identifier,"Esperava o nome da variável").value;
                }
            }
            this.eatOnly(TokenType.RParen,"Esperava um ')'.");
            return {kind:"InputStmt", text, varname} as InputStmt;
        }
        return this.parseFuncCall();
    }

    private parseFuncDecl(): Stmt {
        //funcao nome(args:tipo,args:tipo):tipo {}
        this.advance(); //go past funcao
        const identifier = this.eatOnly(TokenType.Identifier,"Esperava um nome de função").value; //get identifier
        this.eatOnly(TokenType.LParen,"Esperava um '('.");
        const args = [] as ArgumentExpr[];
        let returnType = "NullVal" as ValueType;
        const body = [] as Stmt[];
        if (this.at().type==TokenType.RParen) {
            this.advance();
            //Sem argumentos
            if (this.at().type==TokenType.DoisPontos) {
                this.advance(); //go past :
                //com tipo de retorno
                const tipo = this.advance();
                switch(tipo.type) {
                    case TokenType.Int:
                        returnType="NumberVal";
                        break;
                    case TokenType.Caractere:
                        returnType="StringVal";
                        break;
                    case TokenType.RealWord:
                        returnType="RealVal";
                        break;
                    case TokenType.Logico:
                        returnType="BooleanVal";
                        break;
                    case TokenType.Var:
                        returnType="NullVal";
                        break;
                    default:
                        throw "Esperava um tipo válido de variável. Recebi: "+returnType;
                }
            } else {
                //sem tipo de retorno
                returnType = "NullVal";
            }
            this.eatOnly(TokenType.LChave,"Esperava um '{'.");
        } else {
            
            //Com argumentos
            while (this.at().type!=TokenType.RParen && this.at().type!=TokenType.EOF) {
                if (this.at().type==TokenType.Virgula) {this.advance();}
                const argname = this.eatOnly(TokenType.Identifier, "Esperava um nome de argumento").value;
                let argtype = "NullVal" as ValueType;
                if (this.at().type==TokenType.DoisPontos) {
                    this.advance(); //go past :
                    //Com tipo
                    const argumenttype = this.advance();
                    switch(argumenttype.type) {
                        case TokenType.Int:
                            argtype="NumberVal";
                            break;
                        case TokenType.Caractere:
                            argtype="StringVal";
                            break;
                        case TokenType.RealWord:
                            argtype="RealVal";
                            break;
                        case TokenType.Logico:
                            argtype="BooleanVal";
                            break;
                        case TokenType.Var:
                            argtype="NullVal";
                            break;
                        default:
                        throw "Esperava um tipo válido de variável. Recebi: "+argtype;
                    }
                } else {
                    //sem tipo
                    argtype="NullVal";
                }
                args.push({kind: "ArgumentExpr", identifier:argname, type:argtype} as ArgumentExpr);
            }
            this.advance(); //go past )
            if (this.at().type==TokenType.DoisPontos) {
                this.advance(); //go past :
                //com tipo de retorno
                const tipo = this.advance();
                switch(tipo.type) {
                    case TokenType.Int:
                        returnType="NumberVal";
                        break;
                    case TokenType.Caractere:
                        returnType="StringVal";
                        break;
                    case TokenType.RealWord:
                        returnType="RealVal";
                        break;
                    case TokenType.Logico:
                        returnType="BooleanVal";
                        break;
                    case TokenType.Var:
                        returnType="NullVal";
                        break;
                    default:
                        throw "Esperava um tipo válido de variável. Recebi: "+returnType;
                }
            } else {
                //sem tipo de retorno
                returnType = "NullVal";
            }
            this.eatOnly(TokenType.LChave,"Esperava um '{'.");
        }

        //while para pegar o body da função
        while (this.at().type!=TokenType.RChave && this.at().type!=TokenType.EOF) {
            const s = this.parseStmt();
            
            body.push(s);
        }
        this.advance(); //go past }

        return {kind:"FuncDecl", identifier:identifier, body:body, type:returnType, args:args} as FuncDecl;
    }

    private parseReturnExpr(): Expr {
        this.advance(); //go past retorna
        const value = this.parseStmt();
        return {kind:"ReturnExpr",value} as ReturnExpr;
    }

    private parseIfStmt(): Stmt {
        //se (expr) {corpo}
        this.advance(); // passar o se
        
        this.eatOnly(TokenType.LParen,"Esperava um '('.");
        
        const comparison = this.parseExpr();
        
        this.eatOnly(TokenType.RParen,"Esperava um ')'.");
        
        this.eatOnly(TokenType.LChave,"Esperava um '{'.");
        
        const body = [] as Stmt[];
        while (this.at().type!=TokenType.RChave && this.at().type!=TokenType.EOF) {
            const s = this.parseStmt();
            body.push(s);
        }
        this.advance(); //past the }

        let elsebody;

        if (this.at().type == TokenType.Senao) {
            this.advance(); //move past senão
            if (this.at().type==TokenType.LChave) {
                this.advance(); //move past {
                elsebody = [] as Stmt[];
                while (this.at().type!=TokenType.RChave && this.at().type!=TokenType.EOF) {
                    const s = this.parseStmt();
                    elsebody.push(s);
                }
                this.advance(); //move past }
            }
        }
        
        return {kind:"IfStmt", comparison, body, else:elsebody} as IfStmt;
    }

    private parseVarDecl(): Stmt {
        let varType = this.advance().value;
        
        //check if list
        if (this.at().type == TokenType.LColch) {
            this.advance();
            this.eatOnly(TokenType.RColch, "Esperava um ]");
            varType += "[]";
        }

        

        const identifier = this.eatOnly(TokenType.Identifier,"Esperava um nome de variável.")?.value;

        if (this.at().type==TokenType.EOL || this.at().type==TokenType.EOF) {
            return { kind:"VarDecl", identifier} as VarDecl;
        } else if (this.at().type==TokenType.Assignment) {
            const decl = {kind:"VarDecl",value:this.parseExpr(),identifier,type:varType} as VarDecl;
            return decl;  
        } else {
            throw "Esperava ; ou ="
        }
    }

    private parseExpr(): Expr {
        return this.parseListExpr();
    }

    private parseListExpr(): Expr {
        if (this.at().type == TokenType.LColch) {
            this.advance();
            const list = [] as Expr[];
            while (this.at().type!=TokenType.RColch && this.at().type!=TokenType.EOF) {
                if (this.at().type!=TokenType.Virgula) {
                    const s = this.parseStmt();
                    list.push(s);
                } else {
                    this.advance();
                }
            }
            this.advance();
            return {kind:"ListLiteral",values:list} as ListLiteral;
        }
        return this.parseConcatenateExpr();
    }

    private parseConcatenateExpr(): Expr {
        let left = this.parseInputStmt();
        while (this.at().value=="..") {
            const operator = this.advance().value;
            const right = this.parseStmt();
            left = {kind:"BinaryExpr",left,right,operator} as BinaryExpr;
        }
        return left; 
    }

    private parseFuncCall(): Expr {
        if (this.at().type==TokenType.Identifier) {
            const identifier = this.at().value;
            //if (this.peek().type==TokenType.Ponto) {
            //    this.advance();
            //    
            //}
            if (this.peek().type==TokenType.LParen) {
                this.advance(); //go past identifier
                this.advance(); //go past (
                const args = [] as Expr[];
                while(this.at().type!=TokenType.RParen && this.at().type!=TokenType.EOF) {
                    if (this.at().type!=TokenType.Virgula) {
                        const s = this.parseStmt();
                        args.push(s);
                    } else {
                        this.advance();
                    }
                }
                this.advance(); //go past the )
                return {kind:"FuncCall",identifier,args} as FuncCall
            }
        }
        return this.parseComparatorExpr();
    }

    private parseComparatorExpr(): Expr {
        const left = this.parseAssignmentExpr();
        if (this.at().type==TokenType.ComparatorOperator) {
            const operator = this.advance().value; //advance past operator
            const right = this.parseStmt();
            return {kind:"ComparatorExpr",left,right,operator} as ComparatorExpr;
        }
        return left;
    }

    private parseAssignmentExpr(): Expr {
        const left = this.parseLogicalExpr();
        if (this.at().type==TokenType.Assignment) {
            this.advance(); //advance past =
            const value = this.parseStmt();
            return {value, assigne:left,kind:"AssignmentExpr"} as AssignmentExpr;
        }
        return left;
    }

    private parseLogicalExpr(): Expr {
        let left = this.parseAdditiveExpr();
        //if (this.at().type==TokenType.BinaryOperator) {
            while (this.at().value=="e" || this.at().value=="ou" || this.at().value=="xou") {
                const operator = this.advance().value;
                const right = this.parseStmt();
                left = {kind:"BinaryExpr",left,right,operator} as BinaryExpr;
            }
        //}
        return left; 
    }

    private parseAdditiveExpr(): Expr {
        let left = this.parseMultiplicativeExpr();
        while (this.at().value=="+" || this.at().value=="-") {
            const operator = this.advance().value;
            const right = this.parseStmt();
            left = {kind:"BinaryExpr",left,right,operator} as BinaryExpr;
        }
        return left; 
    }

    private parseMultiplicativeExpr(): Expr {
        let left = this.parseExponentialExpr();
        while (this.at().value=="/" || this.at().value=="*" || this.at().value=="%" || this.at().value=="//") {
            const operator = this.advance().value;
            const right = this.parseStmt();
            left = {kind:"BinaryExpr",left,right,operator} as BinaryExpr;
        }
        return left; 
    }

    private parseExponentialExpr(): Expr {
        let left = this.parseAttributeLookup();
        while (this.at().value=="^") {
            const operator = this.advance().value;
            const right = this.parseStmt();
            left = {kind:"BinaryExpr",left,right,operator} as BinaryExpr;
        }
        return left; 
    }

    //private parseAttributeLookup(): Expr {
    //    if (this.at().type == TokenType.Identifier && this.peek().type == TokenType.Ponto) {
    //        const symbol = this.advance().value; // advance past identifier
    //        this.advance(); // advance past dot
    //        const lookup = this.parseStmt(); // parse the expression after the dot
    //        return {kind:"AttributeLookup",symbol,lookup} as AttributeLookup;
    //    }
    //    return this.parsePrimaryExpr();
    //}

    private parseAttributeLookup(): Expr {
        let expr = this.parsePrimaryExpr();
        
        if (expr.kind!="Identifier") { return expr; }
        const newexpr = expr as Identifier
        let property = "";
        while (true) {
            if (this.at().type == TokenType.Ponto) {
                this.advance(); // go past .
                property = this.eatOnly(TokenType.Identifier, "Expected property name after '.'").value;
                expr = {
                    kind: "AttributeLookup",
                    symbol: newexpr.symbol,
                    lookup: property
                } as AttributeLookup;

            } else if (this.at().type == TokenType.LParen) {
                this.advance();

                const args = [] as Expr[];
                while(this.at().type!=TokenType.RParen && this.at().type!=TokenType.EOF) {
                    if (this.at().type!=TokenType.Virgula) {
                        const s = this.parseStmt();
                        args.push(s);
                    } else {
                        this.advance();
                    }
                }
                this.advance(); //go past the )
                expr = {
                    kind: "CallLookup",
                    symbol: newexpr.symbol,
                    call: property,
                    args
                } as CallLookup;

            } else {
                break;
            }
        }

        return expr;
    }



    private parsePrimaryExpr(): Expr {
        const tk = this.at().type;

        switch (tk) {
            case TokenType.Identifier:
                const id = this.advance().value;
                if (this.at().type==TokenType.LColch) {
                    this.advance();

                    const lookup = this.parseStmt();
                    this.eatOnly(TokenType.RColch, "Esperava um ]");
                    return {kind:"ListIdentifier",symbol:id,lookup:lookup} as ListIdentifier;
                }
                return {kind:"Identifier", symbol:id} as Identifier;
            case TokenType.Ponto:
                return {kind:"Dot"} as Dot;
            case TokenType.Number:
                return {kind:"NumericLiteral", value:parseInt(this.advance().value)} as NumericLiteral;
            case TokenType.StringLiteral:
                return {kind: "StringLiteral",value:this.advance().value} as StringLiteral; 
            case TokenType.Real:
                return {kind: "RealLiteral",value:parseFloat(this.advance().value)} as RealLiteral;
            case TokenType.LParen:
                this.advance();
                const value = this.parseStmt();
                this.eatOnly(TokenType.RParen,"\')\' esperado mas não encontrado.");
                return value;
            case TokenType.EOL:
                this.advance();
                return {kind:"EOL"} as EndOfLine;
            case TokenType.Assignment:
                this.advance();
                const valAssign = this.parseStmt();
                return valAssign; 
            case TokenType.RChave:
                return {kind:"EndScope"} as EndScope;
            default:
                console.error("Erro: token inesperado: ", this.at().type);
                throw Error;
        }
    }
}
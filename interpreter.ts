import { ValueType, RuntimeVal, NumberVal, NullVal, MK_NULL, StringVal, BooleanVal, RealVal, StringList, NumberList, RealList, BooleanList, ObjectVal } from "./values.ts";
import { ArgumentExpr, AssignmentExpr, AttributeLookup, BinaryExpr, Class, ComparatorExpr, ForEachStmt, ForStmt, FuncCall, FuncDecl, Identifier, IfStmt, InputStmt, ListIdentifier, ListLiteral, NewObjectExpr, NumericLiteral, ObjectLiteral, OutputStmt, Program, RealLiteral, ReturnExpr, Stmt, StringLiteral, UntilStmt, VarDecl, WhileStmt } from "./ast.ts";
import Environment from "./environment.ts";


export function evaluate(astNode: Stmt, env: Environment):RuntimeVal {
    switch (astNode.kind) {
        case "NumericLiteral":
            return { value:(astNode as NumericLiteral).value, type:"NumberVal" } as NumberVal;
        case "StringLiteral":
            return { value:(astNode as StringLiteral).value, type:"StringVal" } as StringVal;
        case "RealLiteral":
            return { value:(astNode as RealLiteral).value, type:"RealVal" } as RealVal;
        case "ObjectLiteral":
            return {className:(astNode as ObjectLiteral).className, value:"Objeto da classe "+(astNode as ObjectLiteral).className, env, type:"ObjectVal"} as ObjectVal;
        case "ListLiteral":
            return evaluateListLiteral(astNode as ListLiteral, env);
        case "ListIdentifier":
            return evaluateListIdentifier(astNode as ListIdentifier, env);
        case "BinaryExpr":
            return evaluateBinaryExpr(astNode as BinaryExpr,env);
        case "Identifier":
            return evaluateIdentifier(astNode as Identifier,env);
        case "Program":
            return evaluateProgram(astNode as Program,env);
        case "VarDecl":
            return evaluateVarDecl(astNode as VarDecl,env);
        case "AssignmentExpr":
            return evaluateVarAssignment(astNode as AssignmentExpr,env);
        case "ComparatorExpr":
            return evaluateComparison(astNode as ComparatorExpr,env);
        case "IfStmt":
            return evaluateIfStmt(astNode as IfStmt, env);
        case "ForStmt":
            return evaluateForStmt(astNode as ForStmt, env);
        case "ForEachStmt":
            return evaluateForEachStmt(astNode as ForEachStmt, env);
        case "WhileStmt":
            return evaluateWhileStmt(astNode as WhileStmt, env);
        case "UntilStmt":
            return evaluateUntilStmt(astNode as UntilStmt, env);
        case "EOL":
            return MK_NULL();
        case "EndScope":
            return MK_NULL();
        case "FuncDecl":
            return evaluateFuncDecl(astNode as FuncDecl, env);
        case "FuncCall":
            return evaluateFuncCall(astNode as FuncCall, env);
        case "Class":
            return evaluateClassDecl(astNode as Class, env);
        case "OutputStmt":
            return evaluateOutputStmt(astNode as OutputStmt, env);
        case "InputStmt":
            return evaluateInputStmt(astNode as InputStmt, env);
        case "ReturnExpr":
            return evaluateReturnExpr(astNode as ReturnExpr, env);
        case "NewObjectExpr":
            return evaluateNewObjectExpr(astNode as NewObjectExpr, env);
        case "AttributeLookup":
            return evaluateAttributeLookup(astNode as AttributeLookup, env);
        default:
            console.error("Erro de interpretação! Tipo inesperado: ",astNode);
            return MK_NULL();
    }
}

function evaluateAttributeLookup(node: AttributeLookup, env: Environment): RuntimeVal {
    const obj = env.lookupVar(node.symbol) as ObjectVal;
    const objEnv = obj.env;
    const ret = evaluate(node.lookup, objEnv);
    return ret; 
}

function evaluateNewObjectExpr(node: NewObjectExpr, env:Environment): RuntimeVal {
    const nodeClass = env.resolveClass(node.class);
    
    const body = nodeClass.body;
    
    const objectEnv = new Environment(env);

    for (let i = 0; i < body.length; i++) {
        const stmt = body[i];
        evaluate(stmt, objectEnv);
    }
    
    const args = node.args
    const identifier = "construtor"

    const call = {kind: "FuncCall", args, identifier} as FuncCall

    return evaluateFuncCall(call, objectEnv);
}

function evaluateClassDecl(node: Class, env: Environment): RuntimeVal {
    //declare class in environment
    env.declareClass(node);
    return MK_NULL();
}

function evaluateWhileStmt(node: WhileStmt, env:Environment):RuntimeVal {
    const comparison = node.comparison;
    const newEnv = new Environment(env);

    let evaluated = evaluate(comparison, newEnv) as BooleanVal;

    const body = node.body;

    let ending = {} as RuntimeVal;

    while (evaluated.type=="BooleanVal" && evaluated.value==true) {
        for (let index = 0; index < body.length; index++) {
                const s = body[index];    
                ending = evaluate(s, newEnv);
        }
        evaluated = evaluate(comparison, newEnv) as BooleanVal;
    }
    return ending
}

function evaluateUntilStmt(node: UntilStmt, env:Environment):RuntimeVal {
    const comparison = node.comparison;
    const newEnv = new Environment(env);

    let evaluated = evaluate(comparison, newEnv) as BooleanVal;

    const body = node.body;

    let ending = {} as RuntimeVal;

    while (evaluated.type=="BooleanVal" && evaluated.value==false) {
        for (let index = 0; index < body.length; index++) {
                const s = body[index];    
                ending = evaluate(s, newEnv);
        }
        evaluated = evaluate(comparison, newEnv) as BooleanVal;
    }
    return ending
}

function evaluateListIdentifier(node: ListIdentifier, env:Environment): RuntimeVal {
    const symbol = node.symbol;
    if (env.hasVar(symbol)) {
        const list = env.lookupVar(symbol) as StringList;
        const lookup = evaluate(node.lookup,env) as NumberVal;
        return list.value[lookup.value];
    } else {
        throw new Error("Lista não existe");
    }
}

function evaluateListLiteral(node: ListLiteral, env:Environment): RuntimeVal {
    const values = node.values;
    let type = null;
    const list = [];
    for (let i=0; i<=values.length-1; i++) {
        const value = values[i];

        const v = evaluate(value,env);
        if (type==null) {
            type=v.type;
        }

        if (type!=v.type) {
            throw new Error("Tipo inconsistente de dados na lista.");
        }

        list.push(v);
    }
    switch (type) {
        case "StringVal":
            return {type:"StringList", value:list} as StringList;
        case "NumberVal":
            return {type:"NumberList", value:list} as NumberList;
        case "RealVal":
            return {type:"RealList", value:list} as RealList;
        case "BooleanList":
            return {type:"BooleanList", value:list} as BooleanList;
        default:
            return MK_NULL();
    }
}

function evaluateOutputStmt(node: OutputStmt, env:Environment): RuntimeVal {
    const value = node.value;
    if (value!=undefined) {
        const text = evaluate(value,env) as StringVal;
        appendOutput(text.value+node.final);
    }
    return MK_NULL();
}

function evaluateInputStmt(node: InputStmt, env: Environment): RuntimeVal {
    let promptText = "";
    if (node.text) {
        promptText = evaluate(node.text, env).value;
    }
    const ret = prompt(promptText);
    const val = { type: "StringVal", value: ret } as StringVal;
    if (node.varname) {
        if (env.hasVar(node.varname)) {
            env.assignVar(node.varname, val);
        }
        else {
            env.declareVar(node.varname, val, val.type);
        }
    }
    return val;
}

function evaluateReturnExpr(node: ReturnExpr, env:Environment):RuntimeVal {
    return evaluate(node.value,env);
}

function evaluateFuncDecl(node: FuncDecl, env:Environment): RuntimeVal {
    env.declareFunc(node);
    return MK_NULL();
}

function evaluateForStmt(node: ForStmt, env:Environment):RuntimeVal {
    const starti = node.startIndex;
    const i = evaluate(starti,env);
    const endi = node.endIndex;
    const end = evaluate(endi, env);
    const identifier = node.variable.symbol;
    const step = evaluate(node.step,env) as NumberVal;
    
    const newEnv = new Environment(env);

    if (!newEnv.hasVar(identifier)) {
        newEnv.declareVar(identifier,i,"NumberVal");
    } else {
        newEnv.assignVar(identifier, i);
    }

    const body = node.body;
    let ending = {} as RuntimeVal;
    for (let index=i.value; index<=end.value; index+=step.value) {
        newEnv.assignVar(identifier, {value:index, type:"NumberVal"} as NumberVal);
        for (let index = 0; index < body.length; index++) {
                const s = body[index];    
                ending = evaluate(s, newEnv);
        }
    }

    return ending;
}

function evaluateForEachStmt(node: ForEachStmt, env:Environment):RuntimeVal {
    
    const lista = node.list.symbol;
    const identifier = node.variable.symbol;

    let list;
    //check list
    if (env.hasVar(lista)) {
        list = env.lookupVar(lista);
    } else {
        throw new Error("Lista não existe");
    }

    const val = 0
    const valMax = list.value.length-1;

    const startItem = list.value[val];
    
    if (!env.hasVar(identifier)) {
        env.declareVar(identifier,startItem,startItem.type);
    } else {
        env.assignVar(identifier, startItem);
    }

    const body = node.body;
    let ending = {} as RuntimeVal;
    const newEnv = new Environment(env);
    for (let val=0; val<=valMax; val+=1) {
        const item = list.value[val];
        env.assignVar(identifier, item);
        
        for (let index = 0; index < body.length; index++) {
                const s = body[index];    
                ending = evaluate(s, newEnv);
        }
    }

    return ending;
}

function evaluateIfStmt(node: IfStmt, env:Environment):RuntimeVal {
    const comparison = node.comparison;
    const body = node.body;
    const resultComp = evaluate(comparison, env) as BooleanVal;
    let lastRes = MK_NULL() as RuntimeVal;
    if (resultComp.value==true) {
        const newEnv = new Environment(env);
        for (let index = 0; index < body.length; index++) {
            const s = body[index];   
            const curr = evaluate(s, newEnv);
            if (curr.type!="NullVal") {lastRes=curr;} 
        }
    } else if(node.else) {
        const newEnv = new Environment(env);
        for (let index = 0; index < node.else.length; index++) {
            const s = node.else[index];
            const curr = evaluate(s, newEnv);
            if (curr.type!="NullVal") {lastRes=curr;}
        }
    }
    return lastRes;
}

function evaluateComparison(node: ComparatorExpr, env:Environment): RuntimeVal {
    const operator = node.operator;
    const result = { value: false, type:"BooleanVal" } as BooleanVal;
    let left,right;
    try {
        switch (operator) {
            case "==":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                result.value = (left.value==right.value) && (left.type==right.type);
                break;
            case ">=":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                if ((left.type=="RealVal" && right.type=="RealVal") || (left.type=="NumberVal" && right.type=="NumberVal")) {
                    result.value = (left.value>=right.value);
                    break;
                } else {
                    throw new Error("Erro: Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" // "+evaluate(node.right,env).type);
                }
            case "<=":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                if ((left.type=="RealVal" && right.type=="RealVal") || (left.type=="NumberVal" && right.type=="NumberVal")) {
                    result.value = (left.value<=right.value);
                    break;
                } else {
                    throw new Error("Erro: Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" // "+evaluate(node.right,env).type);
                }
            case ">":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                if ((left.type=="RealVal" && right.type=="RealVal") || (left.type=="NumberVal" && right.type=="NumberVal")) {
                    result.value = (left.value>right.value);
                    break;
                } else {
                    throw new Error("Erro: Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" // "+evaluate(node.right,env).type);
                }
            case "<":
                
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                if ((left.type=="RealVal" && right.type=="RealVal") || (left.type=="NumberVal" && right.type=="NumberVal")) {
                    result.value = (left.value<right.value);
                    break;
                } else {
                    throw new Error("Erro: Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" // "+evaluate(node.right,env).type);
                }
                
            case "~=":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                result.value = (left.value!=right.value) || (left.type!=right.type);
        }
        return result;
    } catch {
        throw new Error("Erro: Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" // "+evaluate(node.right,env).type);
    }
}

function evaluateVarDecl(variable:VarDecl,env:Environment):RuntimeVal {
    const value = variable.value ? evaluate(variable.value,env) : MK_NULL();
    let assignedtype = value.type;
    let type = "NullVal";
    switch (variable.type) {
        case "int":
            type="NumberVal";
            if (assignedtype=="RealVal") {assignedtype="NumberVal"; (value as RealVal).value = Math.floor((value as RealVal).value)}
            break;
        case "caractere":
            type="StringVal";
            break;
        case "real":
            type="RealVal";
            if (assignedtype=="NumberVal") {assignedtype="RealVal";}
            break;
        case "logico":
            type="BooleanVal";
            break;
        case "var":
            type = assignedtype; //should work :3
            break;
        case "int[]":
            type="NumberList";
            break;
        case "caractere[]":
            type="StringList";
            break;
        case "real[]":
            type="RealList";
            break;
        case "logico[]":
            type="BooleanList";
            break;
    }

    if (type!=assignedtype) {throw "Erro: tipo de variavel errado. Esperava: "+type+" // Recebi: "+assignedtype}

    env.declareVar(variable.identifier,value,type as ValueType);
    return value;
}

function evaluateVarAssignment(node:AssignmentExpr,env:Environment):RuntimeVal {
    if (node.assigne.kind!="Identifier") {throw "Erro: nome de variavel esperado."}
    const varname = (node.assigne as Identifier);
    
    let valueside = evaluate(node.value,env);

    const vartype = (env.lookupVar(varname.symbol).type as ValueType as string);
    let assigneetype = valueside.type;

    switch (vartype) {
        case "NumberVal":            
            if (assigneetype=="RealVal") {
                assigneetype="NumberVal"; 
                (valueside as NumberVal).value = Math.floor((valueside as NumberVal).value);
                valueside.type=assigneetype;
            }
            break;
        case "RealVal":
            if (assigneetype=="NumberVal") {assigneetype="RealVal"; valueside = (valueside as RealVal)}
            break;
    }

    if (assigneetype==vartype) {
        return env.assignVar(varname.symbol,valueside);
    } else {throw "Erro: tipo de variavel errado. Esperava: "+vartype+" // Recebi: "+assigneetype}
}

function evaluateIdentifier(identifier:Identifier,env:Environment):RuntimeVal {
    //change this
    const val = env.lookupVar(identifier.symbol);
    return val;
}

function evaluateFuncCall(node: FuncCall, env:Environment):RuntimeVal {
    const identifier = node.identifier
    //call function
    const func = env.lookupFunc(identifier);
    const funcType = func.type;
    //get the arguments
    const args = func.args ? func.args : [] as ArgumentExpr[];
    const passedArgs = node.args;
    //get the body
    const body = func.body;
    let lastRes = MK_NULL() as RuntimeVal;
    if (args.length>0) {
        //has arguments
        if (passedArgs.length==args.length) {
            const newEnv = new Environment(env);
            for (let index = 0; index < args.length; index++) {
                const arg = args[index];
                const passed = passedArgs[index];
                const pArg = evaluate(passed,newEnv);
                const passedType = pArg.type;
                if (arg.type==passedType || arg.type=="any") {
                    newEnv.declareVar(arg.identifier, pArg, passedType);
                } else {
                    throw "Esperava argumento número "+(index+1)+" como "+arg.type+" mas recebi "+passedType;
                }
            }
            for (let index = 0; index < body.length; index++) {
                const s = body[index];
                if (s.kind=="ReturnExpr") {
                    let result = evaluate((s as ReturnExpr).value,newEnv);
                    if (funcType!="any") {
                        if (funcType=="NumberVal" && result.type=="RealVal") {result=returnNumber(result as RealVal); result.type="NumberVal";}
                        if (funcType=="RealVal" && result.type=="NumberVal") {result=returnReal(result); result.type="RealVal";}
                        if (result.type!=funcType) {throw "Função retornou valor inválido, esperava "+funcType+" e recebi "+result.type;}
                        
                        return result;
                    } else {
                        return result;
                    }
                }    
                const curr = evaluate(s, newEnv);
                if (curr.type!="NullVal") {lastRes=curr;}
            }
        } else {
            throw "Esperava "+args.length+" argumentos, recebi "+passedArgs.length;
        }
    } else {
        //no arguments
        const newEnv = new Environment(env);
        for (let index = 0; index < body.length; index++) {
            const s = body[index];    
            if (s.kind=="ReturnExpr") {
                let result = evaluate((s as ReturnExpr).value,newEnv);
                if (funcType!="any") {
                    if (funcType=="NumberVal" && result.type=="RealVal") {result=returnNumber(result as RealVal); result.type="NumberVal";}
                    if (funcType=="RealVal" && result.type=="NumberVal") {result=returnReal(result); result.type="RealVal";}
                    if (result.type!=funcType) {throw "Função retornou valor inválido, esperava "+funcType+" e recebi "+result.type;} 
                    return result;
                } else {
                    return result;
                }
            }   
            const curr = evaluate(s, newEnv);
            if (curr.type!="NullVal") {lastRes=curr;} 
        }
    }
    return lastRes;
}

function returnReal(val:RuntimeVal):RuntimeVal {
    if(val.type=="NumberVal") {
        return (val as RealVal);
    }
    return MK_NULL();
}

function returnNumber(val:RealVal):NumberVal {
    //if(val.type=="RealVal") {
        val.value=Math.floor(val.value);
        let result = (val as unknown);
        return result = (result as NumberVal);
    //}
    //return MK_NULL();
}

function evaluateBinaryExpr(binop: BinaryExpr, env: Environment):RuntimeVal {
    const leftHand = evaluate(binop.left,env);
    const rightHand = evaluate(binop.right,env);

    //needs to match to "NumberVal", "RealVal", "NumericLiteral". How do i do that?
    if (leftHand.type=="NullVal" || rightHand.type=="NullVal") {
        return MK_NULL();
    }

    
    if (binop.operator=="..") {
        const l = leftHand as StringVal;
        const r = rightHand as StringVal;
        const v = l.value + r.value;
        const res = {type:"StringVal", value:v} as StringVal;
        const result = res;
        return result;
    } else if (binop.operator=="e" || binop.operator=="ou" || binop.operator=="xou") {
        const v = evaluateLogicalBinaryExpr(leftHand, rightHand, binop.operator);
        return v;
    } else {

        //check if both are numeric values
        if (leftHand.type!="RealVal" && leftHand.type!="NumberVal") {
            throw new Error("Tentativa de fazer operação numérica com valor não numérico: "+leftHand.type);
        }
        if (rightHand.type!="RealVal" && rightHand.type!="NumberVal") {
            throw new Error("Tentativa de fazer operação numérica com valor não numérico: "+rightHand.type);
        }

        const left = leftHand as RealVal;
        const right = rightHand as RealVal;
        const v = evaluateNumericBinaryExpr(left, right, binop.operator);
        
        let result;
        if (leftHand.type=="NumberVal" || rightHand.type=="NumberVal") {
            v.value=Math.floor(v.value);
            result = (v as unknown);
            result = (result as NumberVal);
        } else {result = v;}
        return result;
        
    }
}

function evaluateLogicalBinaryExpr(left:RuntimeVal, right:RuntimeVal,op:string): BooleanVal {
    if (left.type!="BooleanVal" || right.type!="BooleanVal") {
        throw new Error("Tentativa de fazer operação logica com valores não booleanos");
    }

    switch (op) {
        case "e":
            return {type:"BooleanVal",value:left.value && right.value} as BooleanVal;
        case "ou":
            return {type:"BooleanVal",value:left.value || right.value} as BooleanVal;
        case "xou":
            return {type:"BooleanVal",value:left.value != right.value} as BooleanVal;
    }
    return {type:"BooleanVal", value:false} as BooleanVal;
}

function evaluateNumericBinaryExpr(left: RealVal, right: RealVal, op: string):RealVal {
    let result=0;
    switch (op) {
        case "+":
            result=left.value+right.value;
            break;
        case "-":
            result=left.value-right.value;
            break;
        case "*":
            result=left.value*right.value;
            break;
        case "/":
            result=left.value/right.value;
            break;
        case "%":
            result=left.value%right.value;
            break;
        case "//":
            result=Math.floor(left.value/right.value);
            break;
        case "^":
            result=Math.pow(left.value,right.value);
            break;
    }
    return { type:"RealVal", value:result } as RealVal;
}

let outputBuffer = "";
function appendOutput(text: string) {
  outputBuffer += text;
}

function evaluateProgram(program: Program, env: Environment):RuntimeVal {
    outputBuffer = "";
    let lastEvaluated: RuntimeVal = {type:"NullVal",value:"nulo"} as NullVal;
    for (const statement of program.body) {
        lastEvaluated = evaluate(statement,env);
    }

    if (outputBuffer!="") 
        console.log(outputBuffer);

    return lastEvaluated;
}

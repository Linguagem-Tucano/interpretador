import { ValueType, RuntimeVal, NumberVal, NullVal, MK_NULL, StringVal, BooleanVal, RealVal, ListVal, ObjectVal } from "./values.ts";
import { ArgumentExpr, AssignmentExpr, AttributeLookup, BinaryExpr, CallLookup, Class, ComparatorExpr, ConvertExpr, DesenharExpr, ForEachStmt, ForStmt, FuncCall, FuncDecl, Identifier, IfStmt, InputStmt, LimparExpr, ListIdentifier, ListLiteral, NewObjectExpr, NumericLiteral, ObjectLiteral, OutputStmt, Program, RealLiteral, RetaExpr, ReturnExpr, Stmt, StringLiteral, UntilStmt, VarDecl, WhileStmt } from "./ast.ts";
import Environment from "./environment.ts";
import { reportError, drawLine, drawImage, clearCanvas } from "./main.ts";


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
        case "CallLookup":
            return evaluateCallLookup(astNode as CallLookup, env);
        case "RetaExpr":
            return evaluateRetaExpr(astNode as RetaExpr, env);
        case "DesenharExpr":
            return evaluateDesenharExpr(astNode as DesenharExpr, env);
        case "LimparExpr":
            return evaluateLimparExpr(astNode as LimparExpr, env);
        case "ConvertExpr":
            return evaluateConvertExpr(astNode as ConvertExpr, env);
        case "EOL":
            return MK_NULL();
        default:
            throw reportError("Tipo de nó desconhecido: "+astNode.kind, astNode.line);
    }
}

function evaluateConvertExpr(node: ConvertExpr, env:Environment): RuntimeVal {
    const value = evaluate(node.value, env);
    const firstType = value.type as ValueType;
    const desiredType = node.type as ValueType;

    switch (desiredType) {
        case "StringVal":
            if (firstType=="NumberVal") {
                return {type:"StringVal", value:value.value.toString()} as StringVal;
            } else if (firstType=="RealVal") {
                return {type:"StringVal", value:value.value.toFixed(2)} as StringVal;
            } else if (firstType=="BooleanVal") {
                return {type:"StringVal", value:value.value ? "verdadeiro" : "falso"} as StringVal;
            } else if (firstType=="ListVal") {
                const list = value as ListVal;
                const strList = list.value.map(item => item.value).join(", ");
                return {type:"StringVal", value:strList} as StringVal;
            } else {
                throw reportError("Não é possível converter "+firstType+" para caractere.", node.line);
            }
        case "NumberVal":
            if (firstType=="StringVal") {
                const num = parseInt(value.value, 10);
                if (isNaN(num)) {
                    throw reportError("Não é possível converter '"+value.value+"' para número.", node.line);
                }
                return {type:"NumberVal", value:num} as NumberVal;
            } else if (firstType=="RealVal") {
                return {type:"NumberVal", value:Math.floor((value as RealVal).value)} as NumberVal;
            } else if (firstType=="BooleanVal") {
                return {type:"NumberVal", value:value.value ? 1 : 0} as NumberVal;
            } else {
                throw reportError("Não é possível converter "+firstType+" para inteiro.", node.line);
            }
        case "RealVal":
            if (firstType=="StringVal") {
                const num = parseFloat(value.value);
                if (isNaN(num)) {
                    throw reportError("Não é possível converter '"+value.value+"' para real.", node.line);
                }
                return {type:"RealVal", value:num} as RealVal;
            } else if (firstType=="NumberVal") {
                return {type:"RealVal", value:value.value} as RealVal;
            } else if (firstType=="BooleanVal") {
                return {type:"RealVal", value:value.value ? 1.0 : 0.0} as RealVal;
            } else {
                throw reportError("Não é possível converter "+firstType+" para real.", node.line);
            }
        default:
            throw reportError("Tipo de conversão desconhecido: "+desiredType, node.line);
    }
}

function evaluateRetaExpr(node: RetaExpr, env:Environment): RuntimeVal {
    const x1 = evaluate(node.x1,env).value;
    const y1 = evaluate(node.y1,env).value;
    const x2 = evaluate(node.x2,env).value;
    const y2 = evaluate(node.y2,env).value;

    drawLine(x1,y1,x2,y2,node.line);

    return MK_NULL();
}

function evaluateDesenharExpr(node: DesenharExpr, env:Environment): RuntimeVal {
    const x = evaluate(node.x,env).value;
    const y = evaluate(node.y,env).value;
    const w = evaluate(node.w,env).value;
    const h = evaluate(node.h,env).value;
    const img = evaluate(node.img,env).value;

    drawImage(x,y,w,h,img,node.line);

    return MK_NULL();
}

function evaluateLimparExpr(node: LimparExpr, _env:Environment): RuntimeVal {
    clearCanvas(node.line);
    return MK_NULL();
}

function evaluateAttributeLookup(node: AttributeLookup, env: Environment): RuntimeVal {
    const obj = lookupVar(node,node.symbol,env) as ObjectVal;
    const objEnv = obj.env;
    //const ret = evaluate(node.lookup, objEnv); //descobri
    const ret = lookupVar(node,node.lookup,objEnv);
    //console.log(ret);
    return ret; 
}

function evaluateCallLookup(node: CallLookup, env:Environment): RuntimeVal {
    const obj = lookupVar(node,node.symbol,env) as ObjectVal;
    const objEnv = obj.env;

    const c = {identifier: node.call, args: node.args, kind:"FuncCall"} as FuncCall;
    const ret = evaluateFuncCall(c, objEnv, env); //para ele fazer lookup no ambiente normal.
    return ret;
}

function evaluateNewObjectExpr(node: NewObjectExpr, env:Environment): RuntimeVal {
    const nodeClass = env.resolveClass(node.class);
    
    const body = nodeClass.body;
    
    const objectEnv = new Environment(env);
    objectEnv.declareVar("isso",{type:"ObjectVal", value:"Objeto da classe "+node.class, env:objectEnv} as ObjectVal, "ObjectVal")

    for (let i = 0; i < body.length; i++) {
        const stmt = body[i];
        evaluate(stmt, objectEnv);
    }
    
    const args = node.args
    const identifier = "construtor"

    const call = {kind: "FuncCall", args, identifier} as FuncCall
    //console.log(objectEnv);
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
        const list = lookupVar(node,symbol,env) as ListVal;
        const lookup = evaluate(node.lookup,env) as NumberVal;
        return list.value[lookup.value];
    } else {
        throw reportError("Lista não existe", node.line);
    }
}

function evaluateListLiteral(node: ListLiteral, env:Environment): RuntimeVal {
    const values = node.values;
    let type = null;
    const list = [] as RuntimeVal[];
    for (let i=0; i<=values.length-1; i++) {
        const value = values[i];

        const v = evaluate(value,env);
        if (type==null) {
            type=v.type;
        }

        if (type!=v.type) {
            throw reportError("Tipo inconsistente de dados na lista.",node.line);
        }

        list.push(v);
    }
    return {type:"ListVal", value:list, listType:type} as ListVal;
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
        list = lookupVar(node,lista,env);
    } else {
        throw reportError("Lista não existe",node.line);
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
                    throw reportError("Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" e "+evaluate(node.right,env).type,node.line);
                }
            case "<=":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                if ((left.type=="RealVal" && right.type=="RealVal") || (left.type=="NumberVal" && right.type=="NumberVal")) {
                    result.value = (left.value<=right.value);
                    break;
                } else {
                    throw reportError("Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" e "+evaluate(node.right,env).type, node.line);
                }
            case ">":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                if ((left.type=="RealVal" && right.type=="RealVal") || (left.type=="NumberVal" && right.type=="NumberVal")) {
                    result.value = (left.value>right.value);
                    break;
                } else {
                    throw reportError("Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" e "+evaluate(node.right,env).type, node.line);
                }
            case "<":
                
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                if ((left.type=="RealVal" && right.type=="RealVal") || (left.type=="NumberVal" && right.type=="NumberVal")) {
                    result.value = (left.value<right.value);
                    break;
                } else {
                    throw reportError("Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" e "+evaluate(node.right,env).type, node.line);
                }
                
            case "~=":
                left = (evaluate(node.left,env));
                right = (evaluate(node.right,env));
                result.value = (left.value!=right.value) || (left.type!=right.type);
        }
        return result;
    } catch {
        throw reportError("Tentou avaliar dois tipos incompativeis: "+evaluate(node.left,env).type+" e "+evaluate(node.right,env).type, node.line);
    }
}

function evaluateVarDecl(variable:VarDecl,env:Environment):RuntimeVal {
    const value = variable.value ? evaluate(variable.value,env) : MK_NULL();
    let assignedtype = value.type;
    let type = "NullVal" as ValueType;
    let listType = "NullVal" as ValueType;
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
            type="ListVal";
            listType = "NumberVal";
            break;
        case "caractere[]":
            type="ListVal";
            listType="StringVal";
            break;
        case "real[]":
            type="ListVal";
            listType="RealVal";
            break;
        case "logico[]":
            type="ListVal";
            listType="BooleanVal";
            break;
    }

    if (type!=assignedtype) {throw reportError("Tipo de variavel errado. Esperava: "+type+" e recebi: "+assignedtype,variable.line)}

    if (type=="ListVal") {
        if((value as ListVal).listType != listType) {
            throw reportError("Lista com tipo incompatível. Esperava "+type+" e recebi: "+assignedtype,variable.line);
        }
    }

    env.declareVar(variable.identifier,value,type as ValueType);
    return value;
}

function evaluateVarAssignment(node:AssignmentExpr,env:Environment):RuntimeVal {
    if (node.assigne.kind === "AttributeLookup") { return evaluateAttributeAssignment(node, env); }

    const varname = node.assigne as Identifier;
    
    let valueside = evaluate(node.value,env);
    

    const vartype = (lookupVar(node,varname.symbol,env).type as ValueType as string) as ValueType;
    let assigneetype = valueside.type as ValueType;

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

    if (assigneetype==vartype || vartype=="NullVal") {
        return env.assignVar(varname.symbol,valueside);
    } else {throw reportError("Tipo de variavel errado. Esperava: "+vartype+" e recebi: "+assigneetype,node.line)}
}

function evaluateAttributeAssignment(node:AssignmentExpr, env:Environment): RuntimeVal {
    const attLookup = node.assigne as AttributeLookup;
    const obj = lookupVar(node,attLookup.symbol,env) as ObjectVal;
    const objEnv = obj.env;
    const varname = attLookup.lookup;

    let valueside = evaluate(node.value, env);

    const vartype = (lookupVar(node,varname,objEnv).type as ValueType as string);
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
        return objEnv.assignVar(varname,valueside);
    } else {throw reportError("Tipo de variavel errado. Esperava: "+vartype+" e recebi: "+assigneetype,node.line)}
}

function evaluateIdentifier(identifier:Identifier,env:Environment):RuntimeVal {
    //change this
    const val = lookupVar(identifier,identifier.symbol,env);
    return val;
}

function evaluateFuncCall(node: FuncCall, env:Environment, argsEnv?: Environment):RuntimeVal {
    //check if argsEnv was passed
    argsEnv = argsEnv ? argsEnv : env;


    const identifier = node.identifier
    //call function
    const func = env.lookupFunc(identifier);
    const funcType = func.type as ValueType;
    //get the arguments
    const args = func.args ? func.args : [] as ArgumentExpr[];
    const passedArgs = node.args;

    //check if arguments match
    if (args.length != passedArgs.length) {
        throw reportError("Esperava "+args.length+" argumentos, recebi "+passedArgs.length,node.line);
    }


    //get the body
    const body = func.body;
    let lastRes = MK_NULL() as RuntimeVal;
    const newEnv = new Environment(env);
    if (args.length>0) {
        //has arguments
        for (let index = 0; index < args.length; index++) {
            const arg = args[index];
            const passed = passedArgs[index];
            const pArg = evaluate(passed,argsEnv) as RuntimeVal;
            const passedType = pArg.type;
            if (arg.type==passedType || arg.type=="NullVal") {
                newEnv.declareVar(arg.identifier, pArg, passedType);
            } else {
                throw reportError("Esperava argumento número "+(index+1)+" como "+arg.type+" mas recebi "+passedType,node.line);
            }
        }        
    }
    for (let index = 0; index < body.length; index++) {
        const s = body[index];    
        if (s.kind=="ReturnExpr") {
            let result = evaluate((s as ReturnExpr).value,newEnv);
            if (funcType!="NullVal") {
                if (funcType=="NumberVal" && result.type=="RealVal") {result=returnNumber(result as RealVal); result.type="NumberVal";}
                if (funcType=="RealVal" && result.type=="NumberVal") {result=returnReal(result); result.type="RealVal";}
                if (result.type!=funcType) {throw reportError("Função retornou valor inválido, esperava "+funcType+" e recebi "+result.type,node.line);} 
                return result;
            } else {
                return result;
            }
        }   
        const curr = evaluate(s, newEnv);
        lastRes=curr;
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
        const v = evaluateLogicalBinaryExpr(leftHand, rightHand, binop.operator, binop.line);
        return v;
    } else {

        //check if both are numeric values
        if (leftHand.type!="RealVal" && leftHand.type!="NumberVal") {
            throw reportError("Tentativa de fazer operação numérica com valor não numérico: "+leftHand.type,binop.line);
        }
        if (rightHand.type!="RealVal" && rightHand.type!="NumberVal") {
            throw reportError("Tentativa de fazer operação numérica com valor não numérico: "+rightHand.type,binop.line);
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

function evaluateLogicalBinaryExpr(left:RuntimeVal, right:RuntimeVal,op:string,line:number): BooleanVal {
    if (left.type!="BooleanVal" || right.type!="BooleanVal") {
        throw reportError("Tentativa de fazer operação logica com valores não booleanos",line);
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
    //console.log(program.body);
    let lastEvaluated: RuntimeVal = {type:"NullVal",value:"nulo"} as NullVal;
    for (const statement of program.body) {
        lastEvaluated = evaluate(statement,env);
    }

    if (outputBuffer!="") 
        console.log(outputBuffer);

    return lastEvaluated;
}

function lookupVar(node:Stmt,varname: string, env: Environment): RuntimeVal {
    try {
        return env.lookupVar(varname)
    } catch (error) {
        throw reportError(error as string, node.line);
    }
}

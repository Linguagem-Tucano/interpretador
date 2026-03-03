// deno-lint-ignore-file no-case-declarations
import {
    BooleanVal,
    ListVal,
    MK_NULL,
    NullVal,
    NumberVal,
    ObjectVal,
    RealVal,
    RuntimeVal,
    StringVal,
    ValueType,
} from "./values.ts";
import {
    ArgumentExpr,
    AssignmentExpr,
    AttributeLookup,
    BinaryExpr,
    CallLookup,
    ClassExpr,
    ComparatorExpr,
    ConvertExpr,
    ForEachStmt,
    ForStmt,
    FuncCall,
    FuncDecl,
    Identifier,
    IfStmt,
    ListIdentifier,
    ListLiteral,
    NewObjectExpr,
    NumericLiteral,
    ObjectLiteral,
    Program,
    RealLiteral,
    ReturnExpr,
    Stmt,
    StringLiteral,
    SwitchStmt,
    UnaryExpr,
    UntilStmt,
    VarDecl,
    WhileStmt,
} from "./ast.ts";
import Environment from "./environment.ts";
import { reportError } from "./main.ts";
import { Function } from "./function.ts";

export async function evaluate(
    astNode: Stmt,
    env: Environment,
): Promise<RuntimeVal> {
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                value: (astNode as NumericLiteral).value,
                type: "NumberVal",
            } as NumberVal;
        case "StringLiteral":
            return {
                value: (astNode as StringLiteral).value,
                type: "StringVal",
            } as StringVal;
        case "RealLiteral":
            return {
                value: (astNode as RealLiteral).value,
                type: "RealVal",
            } as RealVal;
        case "ObjectLiteral":
            return {
                className: (astNode as ObjectLiteral).className,
                value: "Objeto da classe " +
                    (astNode as ObjectLiteral).className,
                env,
                type: "ObjectVal",
            } as ObjectVal;
        case "ListLiteral":
            return await evaluateListLiteral(astNode as ListLiteral, env);
        case "ListIdentifier":
            return await evaluateListIdentifier(astNode as ListIdentifier, env);
        case "BinaryExpr":
            return await evaluateBinaryExpr(astNode as BinaryExpr, env);
        case "Identifier":
            return await evaluateIdentifier(astNode as Identifier, env);
        case "Program":
            return await evaluateProgram(astNode as Program, env);
        case "VarDecl":
            return await evaluateVarDecl(astNode as VarDecl, env);
        case "AssignmentExpr":
            return await evaluateVarAssignment(astNode as AssignmentExpr, env);
        case "ComparatorExpr":
            return await evaluateComparison(astNode as ComparatorExpr, env);
        case "IfStmt":
            return await evaluateIfStmt(astNode as IfStmt, env);
        case "ForStmt":
            return await evaluateForStmt(astNode as ForStmt, env);
        case "ForEachStmt":
            return await evaluateForEachStmt(astNode as ForEachStmt, env);
        case "WhileStmt":
            return await evaluateWhileStmt(astNode as WhileStmt, env);
        case "UntilStmt":
            return await evaluateUntilStmt(astNode as UntilStmt, env);
        case "FuncDecl":
            return await evaluateFuncDecl(astNode as FuncDecl, env);
        case "FuncCall":
            return await evaluateFuncCall(astNode as FuncCall, env);
        case "ClassExpr":
            return await evaluateClassDecl(astNode as ClassExpr, env);
        case "ReturnExpr":
            return await evaluateReturnExpr(astNode as ReturnExpr, env);
        case "NewObjectExpr":
            return await evaluateNewObjectExpr(astNode as NewObjectExpr, env);
        case "AttributeLookup":
            return await evaluateAttributeLookup(
                astNode as AttributeLookup,
                env,
            );
        case "CallLookup":
            return await evaluateCallLookup(astNode as CallLookup, env);
        case "ConvertExpr":
            return await evaluateConvertExpr(astNode as ConvertExpr, env);
        case "UnaryExpr":
            return await evaluateUnaryExpr(astNode as UnaryExpr, env);
        case "EOL":
            return MK_NULL();
        case "SwitchStmt":
            return await evaluateSwitchStmt(astNode as SwitchStmt, env);
        default:
            throw reportError(
                "Tipo de nó desconhecido: " + astNode.kind,
                astNode.line,
            );
    }
}

async function evaluateSwitchStmt(node: SwitchStmt, env: Environment): Promise<RuntimeVal> {
    const mapaResolvido = new Map<string, Stmt[]>();
    
    for (const [chave, valor] of node.cases) {
        mapaResolvido.set((await evaluate(chave, env)).value, valor);
    }

    const mestre = (await evaluate(node.value, env)).value;

    const body = mapaResolvido.get(mestre)?? [] as Stmt[];

    const newEnv = new Environment(env);

    let ending = {} as RuntimeVal;

    //console.log(mestre);
    //console.log(mapaResolvido);
    //console.log(body);

    for (let index = 0; index < body.length; index++) {
        const s = body[index];
        ending = await evaluate(s, newEnv);
    }

    return ending;
}

async function evaluateUnaryExpr(
    node: UnaryExpr,
    env: Environment,
): Promise<RuntimeVal> {
    switch (node.operator) {
        case "nao":
            const nope = await evaluate(node.value, env) as RuntimeVal;
            if (nope.type != "BooleanVal") {
                throw reportError(
                    "Tentou negar um valor não booleano",
                    node.line,
                );
            }
            nope.value = !nope.value;
            return nope;
        case "-":
            const val = await evaluate(node.value, env);
            if (val.type != "NumberVal" && val.type != "RealVal") {
                throw reportError(
                    "Tentou negativar um valor não numérico",
                    node.line,
                );
            }
            val.value = (-1) * val.value;
            return val;
        default:
            throw reportError(
                "Operador unário desconhecido: " + node.operator,
                node.line,
            );
    }
}

async function evaluateConvertExpr(
    node: ConvertExpr,
    env: Environment,
): Promise<RuntimeVal> {
    const value = await evaluate(node.value, env);
    const firstType = value.type as ValueType;
    const desiredType = node.type as ValueType;

    switch (desiredType) {
        case "StringVal":
            if (firstType == "NumberVal") {
                return {
                    type: "StringVal",
                    value: value.value.toString(),
                } as StringVal;
            } else if (firstType == "RealVal") {
                return {
                    type: "StringVal",
                    value: value.value.toFixed(2),
                } as StringVal;
            } else if (firstType == "BooleanVal") {
                return {
                    type: "StringVal",
                    value: value.value ? "verdadeiro" : "falso",
                } as StringVal;
            } else if (firstType == "ListVal") {
                const list = value as ListVal;
                const strList = list.value.map((item) => item.value).join(", ");
                return { type: "StringVal", value: strList } as StringVal;
            } else {
                throw reportError(
                    "Não é possível converter " + firstType +
                        " para caractere.",
                    node.line,
                );
            }
        case "NumberVal":
            if (firstType == "StringVal") {
                const num = parseInt(value.value, 10);
                if (isNaN(num)) {
                    throw reportError(
                        "Não é possível converter '" + value.value +
                            "' para número.",
                        node.line,
                    );
                }
                return { type: "NumberVal", value: num } as NumberVal;
            } else if (firstType == "RealVal") {
                return {
                    type: "NumberVal",
                    value: Math.floor((value as RealVal).value),
                } as NumberVal;
            } else if (firstType == "BooleanVal") {
                return {
                    type: "NumberVal",
                    value: value.value ? 1 : 0,
                } as NumberVal;
            } else {
                throw reportError(
                    "Não é possível converter " + firstType + " para inteiro.",
                    node.line,
                );
            }
        case "RealVal":
            if (firstType == "StringVal") {
                const num = parseFloat(value.value);
                if (isNaN(num)) {
                    throw reportError(
                        "Não é possível converter '" + value.value +
                            "' para real.",
                        node.line,
                    );
                }
                return { type: "RealVal", value: num } as RealVal;
            } else if (firstType == "NumberVal") {
                return { type: "RealVal", value: value.value } as RealVal;
            } else if (firstType == "BooleanVal") {
                return {
                    type: "RealVal",
                    value: value.value ? 1.0 : 0.0,
                } as RealVal;
            } else {
                throw reportError(
                    "Não é possível converter " + firstType + " para real.",
                    node.line,
                );
            }
        case "BooleanVal":
            if (firstType == "StringVal") {
                return {
                    type: "BooleanVal",
                    value: value.value == "verdadeiro" ? true : false,
                } as BooleanVal;
            } else if (firstType == "NumberVal") {
                return {
                    type: "BooleanVal",
                    value: value.value > 0 ? true : false,
                } as BooleanVal;
            } else if (firstType == "RealVal") {
                return {
                    type: "BooleanVal",
                    value: value.value > 0 ? true : false,
                } as BooleanVal;
            } else {
                throw reportError(
                    "Não é possível converter " + firstType + " para lógico.",
                    node.line,
                );
            }
        default:
            throw reportError(
                "Tipo de conversão desconhecido: " + desiredType,
                node.line,
            );
    }
}

function evaluateAttributeLookup(
    node: AttributeLookup,
    env: Environment,
): RuntimeVal {
    const obj = lookupVar(node, node.symbol, env) as ObjectVal;
    const objEnv = obj.env;
    //const ret = evaluate(node.lookup, objEnv); //descobri
    const ret = lookupVar(node, node.lookup, objEnv);
    //console.log(ret);
    return ret;
}

async function evaluateCallLookup(
    node: CallLookup,
    env: Environment,
): Promise<RuntimeVal> {
    const obj = lookupVar(node, node.symbol, env) as ObjectVal;
    const objEnv = obj.env;

    const c = {
        identifier: node.call,
        args: node.args,
        kind: "FuncCall",
        line: node.line,
    } as FuncCall;
    const ret = await evaluateFuncCall(c, objEnv, env); //para ele fazer lookup no ambiente normal.
    return ret;
}

async function evaluateNewObjectExpr(
    node: NewObjectExpr,
    env: Environment,
): Promise<RuntimeVal> {
    const nodeClass = env.resolveClass(node.class);

    const _parent = nodeClass.parent;
    const body = nodeClass.body;

    const pEnv = env;

    const objectEnv = new Environment(pEnv);

    objectEnv.declareVar(
        "isso",
        {
            type: "ObjectVal",
            value: "Objeto da classe " + node.class,
            env: objectEnv,
        } as ObjectVal,
        "ObjectVal",
    );

    for (let i = 0; i < body.length; i++) {
        const stmt = body[i];
        evaluate(stmt, objectEnv);
    }

    const args = node.args;
    const identifier = "construtor";

    const call = { kind: "FuncCall", args, identifier } as FuncCall;
    //console.log(objectEnv);
    return await evaluateFuncCall(call, objectEnv);
}

function evaluateClassDecl(node: ClassExpr, env: Environment): RuntimeVal {
    //declare class in environment
    env.declareClass(node);
    return MK_NULL();
}

async function evaluateWhileStmt(
    node: WhileStmt,
    env: Environment,
): Promise<RuntimeVal> {
    const comparison = node.comparison;
    const newEnv = new Environment(env);

    let evaluated = await evaluate(comparison, newEnv) as BooleanVal;

    const body = node.body;

    let ending = {} as RuntimeVal;

    while (evaluated.type == "BooleanVal" && evaluated.value == true) {
        for (let index = 0; index < body.length; index++) {
            const s = body[index];
            ending = await evaluate(s, newEnv);
        }
        evaluated = await evaluate(comparison, newEnv) as BooleanVal;
    }
    return ending;
}

async function evaluateUntilStmt(
    node: UntilStmt,
    env: Environment,
): Promise<RuntimeVal> {
    const comparison = node.comparison;
    const newEnv = new Environment(env);

    let evaluated = await evaluate(comparison, newEnv) as BooleanVal;

    const body = node.body;

    let ending = {} as RuntimeVal;

    while (evaluated.type == "BooleanVal" && evaluated.value == false) {
        for (let index = 0; index < body.length; index++) {
            const s = body[index];
            ending = await evaluate(s, newEnv);
        }
        evaluated = await evaluate(comparison, newEnv) as BooleanVal;
    }
    return ending;
}

async function evaluateListIdentifier(
    node: ListIdentifier,
    env: Environment,
): Promise<RuntimeVal> {
    const symbol = node.symbol;
    if (env.hasVar(symbol)) {
        let list = lookupVar(node, symbol, env) as ListVal;
        let i = node.lookup.length - 1;
        let curr = 0;
        while (i > 0) {
            i--;
            const smallLookup = await evaluate(
                node.lookup[curr],
                env,
            ) as NumberVal;
            if (list.listType !== "ListVal") {
                throw reportError(
                    "Tentou buscar um índice em uma variável que não é lista",
                    node.line,
                );
            }
            list = list.value[smallLookup.value] as ListVal;
            curr++;
        }
        const lookup = await evaluate(node.lookup[curr], env) as NumberVal;
        return list.value[lookup.value];
    } else {
        throw reportError("Lista não existe", node.line);
    }
}

async function evaluateListLiteral(
    node: ListLiteral,
    env: Environment,
): Promise<RuntimeVal> {
    const values = node.values;
    let type = null;
    const list = [] as RuntimeVal[];
    for (let i = 0; i <= values.length - 1; i++) {
        const value = values[i];

        const v = await evaluate(value, env);
        if (type == null) {
            type = v.type;
        }

        if (type != v.type) {
            throw reportError(
                "Tipo inconsistente de dados na lista.",
                node.line,
            );
        }

        list.push(v);
    }
    return { type: "ListVal", value: list, listType: type } as ListVal;
}

async function evaluateReturnExpr(
    node: ReturnExpr,
    env: Environment,
): Promise<RuntimeVal> {
    return await evaluate(node.value, env);
}

function evaluateFuncDecl(node: FuncDecl, env: Environment): RuntimeVal {
    env.declareFunc(node);
    return MK_NULL();
}

async function evaluateForStmt(
    node: ForStmt,
    env: Environment,
): Promise<RuntimeVal> {
    const starti = node.startIndex;
    const i = await evaluate(starti, env);
    const endi = node.endIndex;
    const end = await evaluate(endi, env);
    const identifier = node.variable.symbol;
    const step = await evaluate(node.step, env) as NumberVal;

    const body = node.body;
    let ending = {} as RuntimeVal;
    for (let index = i.value; index <= end.value; index += step.value) {
        const newEnv = new Environment(env);

        if (!newEnv.hasVar(identifier)) {
            newEnv.declareVar(
                identifier,
                { value: index, type: "NumberVal" } as NumberVal,
                "NumberVal",
            );
        } else {
            newEnv.assignVar(
                identifier,
                { value: index, type: "NumberVal" } as NumberVal,
            );
        }
        for (let index = 0; index < body.length; index++) {
            const s = body[index];
            ending = await evaluate(s, newEnv);
        }
    }

    return ending;
}

async function evaluateForEachStmt(
    node: ForEachStmt,
    env: Environment,
): Promise<RuntimeVal> {
    const lista = node.list.symbol;
    const identifier = node.variable.symbol;

    let list;
    //check list
    if (env.hasVar(lista)) {
        list = lookupVar(node, lista, env);
    } else {
        throw reportError("Lista não existe", node.line);
    }

    const val = 0;
    const valMax = list.value.length - 1;

    const startItem = list.value[val];

    if (!env.hasVar(identifier)) {
        env.declareVar(identifier, startItem, startItem.type);
    } else {
        env.assignVar(identifier, startItem);
    }

    const body = node.body;
    let ending = {} as RuntimeVal;
    const newEnv = new Environment(env);
    for (let val = 0; val <= valMax; val += 1) {
        const item = list.value[val];
        env.assignVar(identifier, item);

        for (let index = 0; index < body.length; index++) {
            const s = body[index];
            ending = await evaluate(s, newEnv);
        }
    }

    return ending;
}

async function evaluateIfStmt(
    node: IfStmt,
    env: Environment,
): Promise<RuntimeVal> {
    const comparison = node.comparison;
    const body = node.body;
    const resultComp = await evaluate(comparison, env) as BooleanVal;
    let lastRes = MK_NULL() as RuntimeVal;
    if (resultComp.value == true) {
        const newEnv = new Environment(env);
        for (let index = 0; index < body.length; index++) {
            const s = body[index];
            const curr = await evaluate(s, newEnv);
            if (curr.type != "NullVal") lastRes = curr;
        }
    } else if (node.else) {
        const newEnv = new Environment(env);
        for (let index = 0; index < node.else.length; index++) {
            const s = node.else[index];
            const curr = await evaluate(s, newEnv);
            if (curr.type != "NullVal") lastRes = curr;
        }
    }
    return lastRes;
}

async function evaluateComparison(
    node: ComparatorExpr,
    env: Environment,
): Promise<RuntimeVal> {
    const operator = node.operator;
    const result = { value: false, type: "BooleanVal" } as BooleanVal;
    let left, right;
    try {
        switch (operator) {
            case "==":
                left = await evaluate(node.left, env);
                right = await evaluate(node.right, env);
                result.value = (left.value == right.value) &&
                    (left.type == right.type);
                break;
            case ">=":
                left = await evaluate(node.left, env);
                right = await evaluate(node.right, env);
                if (
                    (right.type == "NumberVal" || right.type == "RealVal") &&
                    (left.type == "NumberVal" || left.type == "RealVal")
                ) {
                    result.value = left.value >= right.value;
                    break;
                } else {
                    throw reportError(
                        "Tentou avaliar dois tipos incompativeis: " +
                            (await evaluate(node.left, env)).type + " e " +
                            (await evaluate(node.right, env)).type,
                        node.line,
                    );
                }
            case "<=":
                left = await evaluate(node.left, env);
                right = await evaluate(node.right, env);
                if (
                    (right.type == "NumberVal" || right.type == "RealVal") &&
                    (left.type == "NumberVal" || left.type == "RealVal")
                ) {
                    result.value = left.value <= right.value;
                    break;
                } else {
                    throw reportError(
                        "Tentou avaliar dois tipos incompativeis: " +
                            (await evaluate(node.left, env)).type + " e " +
                            (await evaluate(node.right, env)).type,
                        node.line,
                    );
                }
            case ">":
                left = await evaluate(node.left, env);
                right = await evaluate(node.right, env);
                if (
                    (right.type == "NumberVal" || right.type == "RealVal") &&
                    (left.type == "NumberVal" || left.type == "RealVal")
                ) {
                    result.value = left.value > right.value;
                    break;
                } else {
                    throw reportError(
                        "Tentou avaliar dois tipos incompativeis: " +
                            (await evaluate(node.left, env)).type + " e " +
                            (await evaluate(node.right, env)).type,
                        node.line,
                    );
                }
            case "<":
                left = await evaluate(node.left, env);
                right = await evaluate(node.right, env);
                if (
                    (right.type == "NumberVal" || right.type == "RealVal") &&
                    (left.type == "NumberVal" || left.type == "RealVal")
                ) {
                    result.value = left.value < right.value;
                    break;
                } else {
                    throw reportError(
                        "Tentou avaliar dois tipos incompativeis: " +
                            (await evaluate(node.left, env)).type + " e " +
                            (await evaluate(node.right, env)).type,
                        node.line,
                    );
                }

            case "~=":
                left = await evaluate(node.left, env);
                right = await evaluate(node.right, env);
                result.value = (left.value != right.value) ||
                    (left.type != right.type);
        }
        return result;
    } catch {
        throw "";
    }
}

async function evaluateVarDecl(
    variable: VarDecl,
    env: Environment,
): Promise<RuntimeVal> {
    const value = variable.value
        ? await evaluate(variable.value, env)
        : MK_NULL();
    let assignedtype = value.type;
    let type = "NullVal" as ValueType;
    let listType = "NullVal" as ValueType;
    switch (variable.type) {
        case "int":
            type = "NumberVal";
            if (assignedtype == "RealVal") {
                assignedtype = "NumberVal";
                (value as RealVal).value = Math.floor((value as RealVal).value);
            }
            break;
        case "caractere":
            type = "StringVal";
            break;
        case "real":
            type = "RealVal";
            if (assignedtype == "NumberVal") assignedtype = "RealVal";
            break;
        case "logico":
            type = "BooleanVal";
            break;
        case "var":
            type = assignedtype; //should work :3
            break;
        case "int[]":
            type = "ListVal";
            listType = "NumberVal";
            break;
        case "caractere[]":
            type = "ListVal";
            listType = "StringVal";
            break;
        case "real[]":
            type = "ListVal";
            listType = "RealVal";
            break;
        case "logico[]":
            type = "ListVal";
            listType = "BooleanVal";
            break;
    }

    if (type != assignedtype) {
        throw reportError(
            "Tipo de variavel errado. Esperava: " + type + " e recebi: " +
                assignedtype,
            variable.line,
        );
    }

    if (type == "ListVal") {
        if ((value as ListVal).listType != listType) {
            throw reportError(
                "Lista com tipo incompatível. Esperava " + type +
                    " e recebi: " + assignedtype,
                variable.line,
            );
        }
    }

    const varEnv = variable.global ? GLOBAL_ENV : env;

    try {
        varEnv.declareVar(variable.identifier, value, type as ValueType);
    } catch (error) {
        throw reportError(error as string, variable.line);
    }
    return value;
}

async function evaluateVarAssignment(
    node: AssignmentExpr,
    env: Environment,
): Promise<RuntimeVal> {
    if (node.assigne.kind === "AttributeLookup") {
        return evaluateAttributeAssignment(node, env);
    }

    const varname = node.assigne as Identifier;

    let valueside = await evaluate(node.value, env);

    const vartype =
        (lookupVar(node, varname.symbol, env)
            .type as ValueType as string) as ValueType;
    let assigneetype = valueside.type as ValueType;

    switch (vartype) {
        case "NumberVal":
            if (assigneetype == "RealVal") {
                assigneetype = "NumberVal";
                (valueside as NumberVal).value = Math.floor(
                    (valueside as NumberVal).value,
                );
                valueside.type = assigneetype;
            }
            break;
        case "RealVal":
            if (assigneetype == "NumberVal") {
                assigneetype = "RealVal";
                valueside = valueside as RealVal;
            }
            break;
    }

    if (assigneetype == vartype || vartype == "NullVal") {
        return env.assignVar(varname.symbol, valueside);
    } else {throw reportError(
            "Tipo de variavel errado. Esperava: " + vartype + " e recebi: " +
                assigneetype,
            node.line,
        );}
}

async function evaluateAttributeAssignment(
    node: AssignmentExpr,
    env: Environment,
): Promise<RuntimeVal> {
    const attLookup = node.assigne as AttributeLookup;
    const obj = lookupVar(node, attLookup.symbol, env) as ObjectVal;
    const objEnv = obj.env;
    const varname = attLookup.lookup;

    let valueside = await evaluate(node.value, env);

    const vartype = lookupVar(node, varname, objEnv)
        .type as ValueType as string;
    let assigneetype = valueside.type;

    switch (vartype) {
        case "NumberVal":
            if (assigneetype == "RealVal") {
                assigneetype = "NumberVal";
                (valueside as NumberVal).value = Math.floor(
                    (valueside as NumberVal).value,
                );
                valueside.type = assigneetype;
            }
            break;
        case "RealVal":
            if (assigneetype == "NumberVal") {
                assigneetype = "RealVal";
                valueside = valueside as RealVal;
            }
            break;
    }

    if (assigneetype == vartype) {
        return objEnv.assignVar(varname, valueside);
    } else {throw reportError(
            "Tipo de variavel errado. Esperava: " + vartype + " e recebi: " +
                assigneetype,
            node.line,
        );}
}

function evaluateIdentifier(
    identifier: Identifier,
    env: Environment,
): RuntimeVal {
    //change this
    const val = lookupVar(identifier, identifier.symbol, env);
    return val;
}

async function evaluateFuncCall(
    node: FuncCall,
    env: Environment,
    argsEnv?: Environment,
): Promise<RuntimeVal> {
    //check if argsEnv was passed
    argsEnv = argsEnv ? argsEnv : env;

    const identifier = node.identifier;
    //call function
    let func: Function;
    try {
        func = env.lookupFunc(identifier);
    } catch (error) {
        throw reportError(error as string, node.line);
    }
    //get the arguments
    const args = func.args ? func.args : [] as ArgumentExpr[];
    const passedArgs = node.args;

    //check if arguments match
    if (args.length != passedArgs.length) {
        throw reportError(
            "Esperava " + args.length + " argumentos, recebi " +
                passedArgs.length,
            node.line,
        );
    }

    const newEnv = new Environment(env);
    if (args.length > 0) {
        //has arguments
        for (let index = 0; index < args.length; index++) {
            const arg = args[index];
            const passed = passedArgs[index];
            const pArg = await evaluate(passed, argsEnv) as RuntimeVal;
            const passedType = pArg.type;
            if (arg.type == passedType || arg.type == "NullVal") {
                newEnv.declareVar(arg.identifier, pArg, passedType);
            } else {
                throw reportError(
                    "Esperava argumento número " + (index + 1) + " como " +
                        arg.type + " mas recebi " + passedType,
                    node.line,
                );
            }
        }
    }

    try {
        return func.call(newEnv);
    } catch (error) {
        throw reportError(error as string, node.line);
    }
}

async function evaluateBinaryExpr(
    binop: BinaryExpr,
    env: Environment,
): Promise<RuntimeVal> {
    const leftHand = await evaluate(binop.left, env);
    const rightHand = await evaluate(binop.right, env);

    //needs to match to "NumberVal", "RealVal", "NumericLiteral". How do i do that?
    if (leftHand.type == "NullVal" || rightHand.type == "NullVal") {
        return MK_NULL();
    }

    if (binop.operator == "..") {
        const l = leftHand as StringVal;
        const r = rightHand as StringVal;
        const v = l.value + r.value;
        const res = { type: "StringVal", value: v } as StringVal;
        const result = res;
        return result;
    } else if (
        binop.operator == "e" || binop.operator == "ou" ||
        binop.operator == "xou"
    ) {
        const v = await evaluateLogicalBinaryExpr(
            leftHand,
            rightHand,
            binop.operator,
            binop.line,
        );
        return v;
    } else {
        //check if both are numeric values
        if (leftHand.type != "RealVal" && leftHand.type != "NumberVal") {
            throw reportError(
                "Tentativa de fazer operação numérica com valor não numérico: " +
                    leftHand.type,
                binop.line,
            );
        }
        if (rightHand.type != "RealVal" && rightHand.type != "NumberVal") {
            throw reportError(
                "Tentativa de fazer operação numérica com valor não numérico: " +
                    rightHand.type,
                binop.line,
            );
        }

        const left = leftHand as RealVal;
        const right = rightHand as RealVal;
        const v = await evaluateNumericBinaryExpr(left, right, binop.operator);

        let result;
        if (leftHand.type == "NumberVal" || rightHand.type == "NumberVal") {
            v.value = Math.floor(v.value);
            result = v as unknown;
            result = result as NumberVal;
        } else result = v;
        return result;
    }
}

function evaluateLogicalBinaryExpr(
    left: RuntimeVal,
    right: RuntimeVal,
    op: string,
    line: number,
): BooleanVal {
    if (left.type != "BooleanVal" || right.type != "BooleanVal") {
        throw reportError(
            "Tentativa de fazer operação logica com valores não booleanos",
            line,
        );
    }

    switch (op) {
        case "e":
            return {
                type: "BooleanVal",
                value: left.value && right.value,
            } as BooleanVal;
        case "ou":
            return {
                type: "BooleanVal",
                value: left.value || right.value,
            } as BooleanVal;
        case "xou":
            return {
                type: "BooleanVal",
                value: left.value != right.value,
            } as BooleanVal;
    }
    return { type: "BooleanVal", value: false } as BooleanVal;
}

function evaluateNumericBinaryExpr(
    left: RealVal,
    right: RealVal,
    op: string,
): RealVal {
    let result = 0;
    switch (op) {
        case "+":
            result = left.value + right.value;
            break;
        case "-":
            result = left.value - right.value;
            break;
        case "*":
            result = left.value * right.value;
            break;
        case "/":
            result = left.value / right.value;
            break;
        case "%":
            result = left.value % right.value;
            break;
        case "//":
            result = Math.floor(left.value / right.value);
            break;
        case "^":
            result = Math.pow(left.value, right.value);
            break;
    }
    return { type: "RealVal", value: result } as RealVal;
}

let outputBuffer = "";
export function appendOutput(text: string) {
    outputBuffer += text;
}

export function clearOutputBuffer() {
    outputBuffer = "";
}

export function flushOutputBuffer() {
    if (outputBuffer.endsWith("\n")) {
        console.log(outputBuffer.trimEnd());
        clearOutputBuffer();
    }
}

let GLOBAL_ENV = {} as Environment;
export function setGlobalEnv(env: Environment) {
    GLOBAL_ENV = env;
}

async function evaluateProgram(
    program: Program,
    env: Environment,
): Promise<RuntimeVal> {
    outputBuffer = "";
    let lastEvaluated: RuntimeVal = {
        type: "NullVal",
        value: "nulo",
    } as NullVal;
    GLOBAL_ENV = env;
    for (const statement of program.body) {
        lastEvaluated = await evaluate(statement, env);
    }

    if (outputBuffer != "") {
        console.log(outputBuffer);
    }

    return lastEvaluated;
}

function lookupVar(node: Stmt, varname: string, env: Environment): RuntimeVal {
    try {
        return env.lookupVar(varname);
    } catch (error) {
        throw reportError(error as string, node.line);
    }
}

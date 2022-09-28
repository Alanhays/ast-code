//babel库及文件模块导入
const fs = require('fs');
//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;
const template = require("@babel/template").default;
global.t = types;

//读取文件
let encode_file = "./encode.js",
    decode_file = "./ecode_result.js";

if (process.argv.length > 2) {
    encode_file = process.argv[2];
}

if (process.argv.length > 3) {
    decode_file = process.argv[3];
}

let jscode = fs.readFileSync(encode_file, {encoding: "utf-8"});
//转换为ast树
let ast = parser.parse(jscode);

var getIndex = function (Oa) {
    var za = Oa >> 5;
    Fa = 31 & za;
    La = 31 & za >> 5;
    return [31 & Oa, Fa, La]
}

var getOaValue = function (Oa, Fa, La) {
    let za = (La << 5) + Fa;
    Oa = (za << 5) + Oa
    return Oa
}


const decode_comma = {
    //破解逗号表达式，兼容之前的脚本
    ExpressionStatement(path) {
        //****************************************特征判断
        let {expression} = path.node;
        if (!t.isSequenceExpression(expression)) return;
        let body = [];
        expression.expressions.forEach(express => {
            body.push(t.ExpressionStatement(express));
        })
        path.replaceInline(body);
    },
}

traverse(ast, decode_comma);

const removeSelfExecuting = {
    UnaryExpression(path) {
        const {operator, argument} = path.node;
        if (operator !== "!" || !t.isCallExpression(argument))
            return;
        let {callee, arguments} = argument;
        if (!t.isFunctionExpression(callee) || arguments.length !== 0)
            return;
        path.replaceInline(callee.body.body);
    },
}

traverse(ast, removeSelfExecuting);

const decodeSwitchNesting = {
    // 拆解嵌套switch 合并为一个
    SwitchStatement(path) {
        let {discriminant, cases} = path.node
        //  特征判断 只处理最外层switch
        if (!t.isBinaryExpression(discriminant)) return;
        if (discriminant.right.name != "Oa") return;
        //  删除switch的兄弟节点 VariableDeclaration
        delete path.parent.body[0]
        //  构建一个 `Oa` (Identifier)节点 替换 `31 & Oa` (BinaryExpression)节点 name属性是required的
        path.node.discriminant = {
            type: "Identifier",
            name: "Oa"
        }
        //  遍历所有cases节点
        for (let Oa = 0; Oa < cases.length; Oa++) {
            FaSwitch = cases[Oa].consequent[0]
            //  特征判断 只处理switch类型
            if (!t.isSwitchStatement(FaSwitch)) return;
            FaCases = FaSwitch.cases
            for (let Fa = 0; Fa < FaCases.length; Fa++) {
                //  因为检查过FaCases节点，所以这里不做判断，有报错再做判断也是可以的
                LaSwitch = FaCases[Fa].consequent[0]
                LaCases = LaSwitch.cases
                for (let La = 0; La < LaCases.length; La++) {
                    const {test, consequent} = LaCases[La]
                    OaExpression = consequent[consequent.length - 2]
                    // 替换 test.value
                    test.value = getOaValue(Oa, Fa, La)
                    // 将节点push到OaSwitch的cases中，也就是最外层switch
                    cases.push(LaCases[La])
                }
            }
            // 删除处理过的cases节点
            delete cases[Oa]
        }
    }
}

traverse(ast, decodeSwitchNesting);


function getItemFromTestValue(path, number, is_remove) {
    let {cases} = path.node;
    let tempList = []
    for (const index in cases) {
        let item = cases[index]
        if (item.test.value == number) {
            if (is_remove) {
                return path.node.cases.splice(cases.indexOf(item), 1);
            } else {
                return item;
            }
        }
    }
}


//  判断set元素是否存在
var isSameNowVal = (_arr, val) => {
    let i = 0
    let indexList = []
    _arr.forEach((e, _index) => {
        if (e == val) {
            i += 1
            indexList.push(_index)
        }
    })
    return {
        bool: i >= 1,
        indexList
    }
}

function duplicates(arr) {
    arr.sort();
    let Arr = [];
    arr.forEach((elem, index) => {
        if (elem === arr[index + 1] && Arr.indexOf(elem) === -1) {
            Arr.push(elem);
        }
    })
    return Arr;
}


let allNode = []
let UniqueSuccessorNode = []
const UniqueNodeMerging = {
    SwitchStatement(path) {
        let {discriminant, cases} = path.node
        //  特征判断
        if (!t.isIdentifier(discriminant)) return;
        if (discriminant.name != "Oa") return;
        cases.forEach(caseItem => {
            const {consequent} = caseItem
            let Expression = consequent[consequent.length - 2]
            //  特征判断
            if (!t.isExpressionStatement(Expression)) return;
            if (!t.isAssignmentExpression(Expression.expression)) return;
            //  记录所有switch节点next
            if (!t.isNumericLiteral(Expression.expression.right)) {
                [Expression.expression.right.consequent.value,
                    Expression.expression.right.alternate.value].forEach(
                    value => allNode.push(value)
                )
            } else {
                allNode.push(Expression.expression.right.value)
                UniqueSuccessorNode.push(Expression.expression.right.value)
            }
        })
        //  重复的前驱节点
        let duplicatesNode = duplicates(allNode)
        //  求差集得出前驱节点唯一的节点
        let UniquePredecessorNode = allNode.filter(x => !new Set(duplicatesNode).has(x))
        // 求交集得出拥有唯一的后继节点，且后继节点的前驱节点唯一的节点
        let onlySingleJumpNode = UniquePredecessorNode.filter(x => new Set(UniqueSuccessorNode).has(x))
        //  唯一节点合并
        onlySingleJumpNode.forEach(testValue => {
            let SuccessorIndex = 0, PredecessorIndex = 0;
            for (let index in cases) {
                let caseItem = cases[index]
                const {consequent} = caseItem
                let Expression = consequent[consequent.length - 2]
                //  特征判断
                if (!t.isExpressionStatement(Expression)) continue;
                if (!t.isAssignmentExpression(Expression.expression)) continue;
                if (!t.isNumericLiteral(Expression.expression.right)) {
                    [Expression.expression.right.consequent.value,
                        Expression.expression.right.alternate.value].forEach(value => {
                        if (testValue === value) PredecessorIndex = index;
                    })
                } else if (testValue === Expression.expression.right.value) PredecessorIndex = index;
                if (testValue === caseItem.test.value) SuccessorIndex = index;
                if (SuccessorIndex && PredecessorIndex) break;
            }
            let Successor = cases[SuccessorIndex].consequent
            //  移除无用的跳转 next 和 break
            cases[PredecessorIndex].consequent.pop()
            cases[PredecessorIndex].consequent.pop()
            //  合并节点 后继节点 => 前置节点
            Successor.forEach( item => {
                cases[PredecessorIndex].consequent.push(item)
            })
            console.log(generator(cases[PredecessorIndex]).code)
            //  删除后继节点
            delete path.node.cases[SuccessorIndex]
        })
    }
}
traverse(ast, UniqueNodeMerging);


//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});
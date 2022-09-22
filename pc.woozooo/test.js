var Oa = 10624
function getOaFaLa(Oa) {
    let za = Oa >> 5;
    Fa = 31 & za;
    La = 31 & za >> 5;
    return [31 & Oa, Fa, La]
}
var getOaValue = function (Oa, Fa, La) {
    let za = (La << 5) + Fa;
    Oa = (za << 5) + Oa
    return Oa
}
var a = getOaFaLa(Oa)
console.log(a)
var b = getOaValue(a[0], a[1], a[2])
console.log(b)
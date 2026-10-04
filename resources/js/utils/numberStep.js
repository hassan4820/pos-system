/**
 * Keep native number steppers aligned with the value's decimal part while making
 * each step exactly one whole unit (e.g. 2.35 -> 3.35 -> 4.35).
 */
export function wholeStepBase(value, precision = 3) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';

    const scale = 10 ** precision;
    const scaled = Math.round((number + Number.EPSILON) * scale);
    const remainder = ((scaled % scale) + scale) % scale;
    return String(Number((remainder / scale).toFixed(precision)));
}

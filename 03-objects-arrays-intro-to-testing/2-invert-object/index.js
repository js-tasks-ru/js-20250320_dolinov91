/**
 * invertObj - should swap object keys and values
 * @param {object} obj - the initial object
 * @returns {object | undefined} - returns new object or undefined if nothing did't pass
 */
export function invertObj(obj) {
    if (!obj || typeof obj !== 'object') {
        return undefined
    }

    const result = {}

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[obj[key]] = key
        }
    }

    return result
}
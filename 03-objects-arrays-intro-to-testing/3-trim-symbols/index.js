/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {

    if (!string) return ''
    if (size === undefined) return string
    if (size <= 0) return ''

    const chars = string.split('')
    let result = []
    let count = 1
    let currentChar = chars[0]

    result.push(currentChar)

    for (let i = 1; i < chars.length; i++) {
        if (chars[i] === currentChar) {
            count++
            if (count <= size) {
                result.push(chars[i])
            }
        } else {
            count = 1
            currentChar = chars[i]
            result.push(chars[i])
        }
    }

    return result.join('')
}

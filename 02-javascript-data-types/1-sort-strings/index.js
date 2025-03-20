/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc', language = 'en') {
    const sortedArray = [...arr]
    return sortedArray.sort((a, b) => {
        const locale = ['ru-RU', 'en-US']
        const compare = a.localeCompare(b, locale, { sensitivity: 'variant', caseFirst: 'upper' })
        if (compare !== 0) return param === 'asc' ? compare : param === 'desc' ? -compare : 0
        const isAUpper = a === a.toUpperCase()
        const isBUpper = b === b.toUpperCase()
        return isAUpper === isBUpper ? 0 : isAUpper ? -1 : 1
    })
}
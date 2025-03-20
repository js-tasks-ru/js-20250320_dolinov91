/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
    return function (obj) {
        const props = path.split('.')

        let current = obj

        for (let prop of props) {
            if (current?.hasOwnProperty(prop)) {
                current = current[prop]
            } else {
                return undefined
            }
        }

        return current
    }
}
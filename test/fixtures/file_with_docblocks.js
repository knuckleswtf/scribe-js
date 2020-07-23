/**
 *
 * @param {number} x
 * @param y
 * @returns {number}
 */
function sum(x, y) {
    return x + y;
}

app.get('a', () => {})
/**
 *
 * @param {number} x
 * @param y
 * @returns {number}
 */
function minus(x, y) {
    /**
     *
     * @type {number}
     */
    const absY = Math.abs(y);
    return x - absY;
}

/**
 * Title
 *
 * Description. Still part
 * of the description.
 *
 * @group The group
 * @authenticated
 * @header X-Hello World
 * @urlParam {string} ID The id. This description
 *  spans multiple lines.
 * @queryParam {string} page The page
 * @bodyParam {string} type The type
 * @bodyParam {string} otherType The other type
 */
app.get('b', () => {})


app.get('c', sum)
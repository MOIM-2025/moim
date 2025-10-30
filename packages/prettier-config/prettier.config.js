/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
    plugins: [
        'prettier-plugin-css-order',
        'prettier-plugin-organize-attributes',
        '@trivago/prettier-plugin-sort-imports',
        'prettier-plugin-style-order',
        'prettier-plugin-tailwindcss',
    ],
    endOfLine: 'lf',
    trailingComma: 'es5',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    arrowParens: 'avoid',
    importOrderSortSpecifiers: true,
}

export default config

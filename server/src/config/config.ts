import argv from 'minimist'

const argvOption = argv(process.argv.slice(2))

export const isProduction = Boolean(argvOption.production)

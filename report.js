const table = require('markdown-table')
const before = require(`./pwa/${process.argv[2]}.json`)
const after = require(`./pwa/${process.argv[3]}.json`)

const summaryOptions = [
  { property: 'sumRenders', prefix: 'Rendering total' },
  { property: 'sumRenderTime', prefix: 'Rendering time' },
  { property: 'avgRenderTime', prefix: 'Rendering average time' },
]

const getIcon = diff => {
  if (diff > 0.1) return '⚠️'
  if (diff < -0.1) return '✅'
  return '🆗'
}

const getValue = (target, property) => Object.keys(target).reduce((current, name) => current + target[name][property], 0)

const formatPerc = value => `${value >= 0 ? '+' : '-'}${value.toFixed(0)}%`
const formatNumber = value => value.toFixed(2)
const formatSummary = (options) => {
  const beforeValue = getValue(before, options.property)
  const afterValue = getValue(after, options.property)
  const diff = afterValue - beforeValue

  return `${getIcon(diff)} ${options.prefix} changed by \`${formatPerc(diff)}\` was \`${formatNumber(beforeValue)}\` is \`${formatNumber(afterValue)}\``
}

const message = `
# Benchmark Report  🚨
>  \`${process.env.BRANCH_A}\` against \`${process.env.BRANCH_B}\` 

## Summary
${summaryOptions.map(options => `${formatSummary(options)}\n`).join('')}

## Details
<details><summary>Click to read detailed report.</summary>
<p>

${Object.keys(before).map(pageName => table([
  ['Type', 'Before', 'After'],
  ...Object.keys(before[pageName]).map(valueType => ([
    valueType, before[pageName][valueType], after[pageName][valueType]
  ]))
], { align: ['l', 'r', 'r'] })).join('\n\n')}
`;

console.log(message)
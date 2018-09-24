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
>  \`${process.env.SOURCE_BRANCH}\` against \`${process.env.TARGET_BRANCH}\` 

## Summary
${summaryOptions.map(options => `${formatSummary(options)}\n`).join('')}

## Details
<details><summary>Click to read detailed report.</summary>
<p>

TODO sorry, but thanks for checking
`;

console.log(message)
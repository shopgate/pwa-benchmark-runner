const fs = require('fs')
const cdp = require('chrome-remote-interface');

const pages = [
  ['Homepage', '/'],
  ['Product with Variants', '/item/393132']
] 

const buildStats = (benchmark) => {
  // Total renders and total timing
  const measure = benchmark['GlobalEvents'].measure.inclusive;
  const result = [];

  Object.keys(measure)
    .forEach(action => Object.keys(measure[action])
      .forEach((component) => {
        const found = result.find(r => r.name === component);
        if (found) {
          found.render += measure[action][component].render;
          found.renderTime += measure[action][component].renderTime;
          return;
        }

        result.push({
          name: component,
          render: measure[action][component].render,
          renderTime: measure[action][component].renderTime,
        });
      }));

  const sumRenders = result.reduce((current, acc) => current + acc.render, 0);
  const sumRenderTime = result.reduce((current, acc) => current + acc.renderTime, 0);
  const avgRenderTime = sumRenderTime / sumRenders;

  return {
    sumRenders,
    sumRenderTime,
    avgRenderTime
  }
}

const executePage = async (client, pageTitle, pageUrl) => {
  const { Page, Runtime } = client
  console.log(`Benchmarking ${pageTitle} ...`)

  // Opening page.
  await Page.navigate({url: `http://127.0.0.1:8080${pageUrl}`});
  await Page.loadEventFired();

  // Wait until actions are done.
  return new Promise(resolve =>
    setTimeout(async () => {
      // Evaluate benchmark result.
      await Runtime.evaluate({ expression: 'window.benchmark.print()' })
      const evaluation = await Runtime.evaluate({ expression: 'JSON.stringify(window.benchmark.keyFigures)' })
      const benchmark = JSON.parse(evaluation.result.value)
      resolve(buildStats(benchmark))
    }, 15000)
  )
}

const run = async () => {
  const client = await cdp({ port: 9223 })
  const { Page, Runtime } = client

  // Enable debugging.
  await Page.enable();
  await Runtime.enable();

  // Benchmark each page.
  const results = {};
  for (let [pageTitle, pageUrl] of pages) {
    const stats = await executePage(client, pageTitle, pageUrl)
    results[pageTitle] = stats
  }

  // Output.
  fs.writeFileSync(`${process.argv[2]}.json`, JSON.stringify(results, null, 2))
  process.exit()
}

run()
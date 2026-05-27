import { NextRequest, NextResponse } from 'next/server'

const ALPHA_VANTAGE = process.env.ALPHA_VANTAGE_KEY!
const NEWSAPI = process.env.NEWSAPI_KEY!

// Cache results in memory for 15 minutes
const cache: Record<string, { data: unknown; ts: number }> = {}
function cached(key: string, ttl = 900000) {
  const hit = cache[key]
  if (hit && Date.now() - hit.ts < ttl) return hit.data
  return null
}
function setCache(key: string, data: unknown) {
  cache[key] = { data, ts: Date.now() }
  return data
}

async function getGoldPrice() {
  const c = cached('gold')
  if (c) return c
  const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${ALPHA_VANTAGE}`)
  const data = await res.json()
  const rate = data['Realtime Currency Exchange Rate']
  return setCache('gold', {
    price: parseFloat(rate?.['5. Exchange Rate'] || '2300'),
    change: parseFloat(rate?.['9. Change'] || '0'),
    changePct: parseFloat(rate?.['10. Change Percent']?.replace('%','') || '0'),
    updated: rate?.['6. Last Refreshed']
  })
}

async function getSilverPrice() {
  const c = cached('silver')
  if (c) return c
  const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAG&to_currency=USD&apikey=${ALPHA_VANTAGE}`)
  const data = await res.json()
  const rate = data['Realtime Currency Exchange Rate']
  return setCache('silver', {
    price: parseFloat(rate?.['5. Exchange Rate'] || '27'),
    change: parseFloat(rate?.['9. Change'] || '0'),
    changePct: parseFloat(rate?.['10. Change Percent']?.replace('%','') || '0'),
  })
}

async function getForexRates() {
  const c = cached('forex')
  if (c) return c
  const pairs = [
    ['EUR','USD'], ['GBP','USD'], ['USD','JPY'], ['USD','ILS']
  ]
  const results = await Promise.all(pairs.map(async ([from, to]) => {
    const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE}`)
    const data = await res.json()
    const rate = data['Realtime Currency Exchange Rate']
    return { pair: `${from}/${to}`, rate: parseFloat(rate?.['5. Exchange Rate'] || '1'), change: parseFloat(rate?.['9. Change'] || '0') }
  }))
  return setCache('forex', results)
}

async function getStockQuote(symbol: string) {
  const c = cached(`stock_${symbol}`)
  if (c) return c
  const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE}`)
  const data = await res.json()
  const q = data['Global Quote']
  return setCache(`stock_${symbol}`, {
    symbol, price: parseFloat(q?.['05. price'] || '0'),
    change: parseFloat(q?.['09. change'] || '0'),
    changePct: q?.['10. change percent']?.replace('%','') || '0',
    volume: q?.['06. volume']
  })
}

async function getNews(query: string, category = 'business') {
  const key = `news_${query}`
  const c = cached(key, 600000) // 10 min cache for news
  if (c) return c
  const url = query
    ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=12&language=en&apiKey=${NEWSAPI}`
    : `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=12&language=en&apiKey=${NEWSAPI}`
  const res = await fetch(url)
  const data = await res.json()
  return setCache(key, data.articles || [])
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const query = req.nextUrl.searchParams.get('q') || ''

  try {
    switch (type) {
      case 'gold':       return NextResponse.json(await getGoldPrice())
      case 'silver':     return NextResponse.json(await getSilverPrice())
      case 'forex':      return NextResponse.json(await getForexRates())
      case 'markets': {
        const [gold, silver, sp500, dow, oil] = await Promise.all([
          getGoldPrice(),
          getSilverPrice(),
          getStockQuote('SPY'),
          getStockQuote('DIA'),
          getStockQuote('USO'),
        ])
        return NextResponse.json({ gold, silver, sp500, dow, oil })
      }
      case 'news':       return NextResponse.json(await getNews(query))
      case 'topnews':    return NextResponse.json(await getNews('', 'business'))
      default:           return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Data fetch failed' }, { status: 500 })
  }
}

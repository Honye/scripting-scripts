/**
 * App Store storefronts. `code` is the ISO 3166-1 alpha-2 lowercase value used
 * both as the App Store URL path segment (`apps.apple.com/{code}/...`) and as
 * the iTunes lookup `country` parameter, so it can never be free text.
 *
 * `currency` is only a *default*. Apple bills a number of smaller storefronts in
 * USD rather than the country's own currency, and moves individual storefronts
 * between the two over time, so the account editor lets the user override it —
 * a wrong default here costs one tap, not a wrong balance.
 */
export type Region = {
  code: string
  /** English display name. */
  name: string
  /** Simplified Chinese display name. */
  nameZh: string
  flag: string
  currency: string
}

/** [code, English name, Chinese name, default currency] */
type RegionRow = [string, string, string, string]

const ROWS: RegionRow[] = [
  ['ae', 'United Arab Emirates', '阿拉伯联合酋长国', 'AED'],
  ['ag', 'Antigua & Barbuda', '安提瓜和巴布达', 'USD'],
  ['ai', 'Anguilla', '安圭拉', 'USD'],
  ['al', 'Albania', '阿尔巴尼亚', 'EUR'],
  ['am', 'Armenia', '亚美尼亚', 'AMD'],
  ['ao', 'Angola', '安哥拉', 'USD'],
  ['ar', 'Argentina', '阿根廷', 'USD'],
  ['at', 'Austria', '奥地利', 'EUR'],
  ['au', 'Australia', '澳大利亚', 'AUD'],
  ['az', 'Azerbaijan', '阿塞拜疆', 'AZN'],
  ['ba', 'Bosnia & Herzegovina', '波斯尼亚和黑塞哥维那', 'EUR'],
  ['bb', 'Barbados', '巴巴多斯', 'USD'],
  ['be', 'Belgium', '比利时', 'EUR'],
  ['bf', 'Burkina Faso', '布基纳法索', 'XOF'],
  ['bg', 'Bulgaria', '保加利亚', 'BGN'],
  ['bh', 'Bahrain', '巴林', 'BHD'],
  ['bj', 'Benin', '贝宁', 'XOF'],
  ['bm', 'Bermuda', '百慕大', 'USD'],
  ['bn', 'Brunei', '文莱', 'USD'],
  ['bo', 'Bolivia', '玻利维亚', 'USD'],
  ['br', 'Brazil', '巴西', 'BRL'],
  ['bs', 'Bahamas', '巴哈马', 'USD'],
  ['bt', 'Bhutan', '不丹', 'USD'],
  ['bw', 'Botswana', '博茨瓦纳', 'BWP'],
  ['by', 'Belarus', '白俄罗斯', 'USD'],
  ['bz', 'Belize', '伯利兹', 'USD'],
  ['ca', 'Canada', '加拿大', 'CAD'],
  ['cd', 'Congo - Kinshasa', '刚果（金）', 'USD'],
  ['cg', 'Congo - Brazzaville', '刚果（布）', 'XAF'],
  ['ch', 'Switzerland', '瑞士', 'CHF'],
  ['ci', 'Côte d’Ivoire', '科特迪瓦', 'XOF'],
  ['cl', 'Chile', '智利', 'CLP'],
  ['cm', 'Cameroon', '喀麦隆', 'XAF'],
  ['cn', 'China', '中国', 'CNY'],
  ['co', 'Colombia', '哥伦比亚', 'COP'],
  ['cr', 'Costa Rica', '哥斯达黎加', 'USD'],
  ['cv', 'Cape Verde', '佛得角', 'CVE'],
  ['cy', 'Cyprus', '塞浦路斯', 'EUR'],
  ['cz', 'Czechia', '捷克', 'CZK'],
  ['de', 'Germany', '德国', 'EUR'],
  ['dk', 'Denmark', '丹麦', 'DKK'],
  ['dm', 'Dominica', '多米尼克', 'USD'],
  ['do', 'Dominican Republic', '多米尼加共和国', 'USD'],
  ['dz', 'Algeria', '阿尔及利亚', 'DZD'],
  ['ec', 'Ecuador', '厄瓜多尔', 'USD'],
  ['ee', 'Estonia', '爱沙尼亚', 'EUR'],
  ['eg', 'Egypt', '埃及', 'EGP'],
  ['es', 'Spain', '西班牙', 'EUR'],
  ['fi', 'Finland', '芬兰', 'EUR'],
  ['fj', 'Fiji', '斐济', 'USD'],
  ['fm', 'Micronesia', '密克罗尼西亚', 'USD'],
  ['fr', 'France', '法国', 'EUR'],
  ['ga', 'Gabon', '加蓬', 'XAF'],
  ['gb', 'United Kingdom', '英国', 'GBP'],
  ['gd', 'Grenada', '格林纳达', 'USD'],
  ['ge', 'Georgia', '格鲁吉亚', 'GEL'],
  ['gh', 'Ghana', '加纳', 'GHS'],
  ['gm', 'Gambia', '冈比亚', 'GMD'],
  ['gr', 'Greece', '希腊', 'EUR'],
  ['gt', 'Guatemala', '危地马拉', 'USD'],
  ['gw', 'Guinea-Bissau', '几内亚比绍', 'XOF'],
  ['gy', 'Guyana', '圭亚那', 'USD'],
  ['hk', 'Hong Kong SAR China', '中国香港特别行政区', 'HKD'],
  ['hn', 'Honduras', '洪都拉斯', 'USD'],
  ['hr', 'Croatia', '克罗地亚', 'EUR'],
  ['hu', 'Hungary', '匈牙利', 'HUF'],
  ['id', 'Indonesia', '印度尼西亚', 'IDR'],
  ['ie', 'Ireland', '爱尔兰', 'EUR'],
  ['il', 'Israel', '以色列', 'ILS'],
  ['in', 'India', '印度', 'INR'],
  ['iq', 'Iraq', '伊拉克', 'USD'],
  ['is', 'Iceland', '冰岛', 'EUR'],
  ['it', 'Italy', '意大利', 'EUR'],
  ['jm', 'Jamaica', '牙买加', 'USD'],
  ['jo', 'Jordan', '约旦', 'USD'],
  ['jp', 'Japan', '日本', 'JPY'],
  ['ke', 'Kenya', '肯尼亚', 'KES'],
  ['kg', 'Kyrgyzstan', '吉尔吉斯斯坦', 'USD'],
  ['kh', 'Cambodia', '柬埔寨', 'USD'],
  ['kn', 'St. Kitts & Nevis', '圣基茨和尼维斯', 'USD'],
  ['kr', 'South Korea', '韩国', 'KRW'],
  ['kw', 'Kuwait', '科威特', 'KWD'],
  ['ky', 'Cayman Islands', '开曼群岛', 'USD'],
  ['kz', 'Kazakhstan', '哈萨克斯坦', 'KZT'],
  ['la', 'Laos', '老挝', 'USD'],
  ['lb', 'Lebanon', '黎巴嫩', 'USD'],
  ['lc', 'St. Lucia', '圣卢西亚', 'USD'],
  ['lk', 'Sri Lanka', '斯里兰卡', 'USD'],
  ['lr', 'Liberia', '利比里亚', 'USD'],
  ['lt', 'Lithuania', '立陶宛', 'EUR'],
  ['lu', 'Luxembourg', '卢森堡', 'EUR'],
  ['lv', 'Latvia', '拉脱维亚', 'EUR'],
  ['ly', 'Libya', '利比亚', 'USD'],
  ['md', 'Moldova', '摩尔多瓦', 'EUR'],
  ['me', 'Montenegro', '黑山', 'EUR'],
  ['mg', 'Madagascar', '马达加斯加', 'MGA'],
  ['mk', 'North Macedonia', '北马其顿', 'EUR'],
  ['ml', 'Mali', '马里', 'XOF'],
  ['mm', 'Myanmar (Burma)', '缅甸', 'USD'],
  ['mn', 'Mongolia', '蒙古', 'USD'],
  ['mo', 'Macao SAR China', '中国澳门特别行政区', 'HKD'],
  ['mr', 'Mauritania', '毛里塔尼亚', 'MRU'],
  ['ms', 'Montserrat', '蒙特塞拉特', 'USD'],
  ['mt', 'Malta', '马耳他', 'EUR'],
  ['mu', 'Mauritius', '毛里求斯', 'MUR'],
  ['mw', 'Malawi', '马拉维', 'MWK'],
  ['mx', 'Mexico', '墨西哥', 'MXN'],
  ['my', 'Malaysia', '马来西亚', 'MYR'],
  ['mz', 'Mozambique', '莫桑比克', 'MZN'],
  ['na', 'Namibia', '纳米比亚', 'NAD'],
  ['ne', 'Niger', '尼日尔', 'XOF'],
  ['ng', 'Nigeria', '尼日利亚', 'NGN'],
  ['ni', 'Nicaragua', '尼加拉瓜', 'USD'],
  ['nl', 'Netherlands', '荷兰', 'EUR'],
  ['no', 'Norway', '挪威', 'NOK'],
  ['np', 'Nepal', '尼泊尔', 'USD'],
  ['nz', 'New Zealand', '新西兰', 'NZD'],
  ['om', 'Oman', '阿曼', 'OMR'],
  ['pa', 'Panama', '巴拿马', 'USD'],
  ['pe', 'Peru', '秘鲁', 'PEN'],
  ['pg', 'Papua New Guinea', '巴布亚新几内亚', 'USD'],
  ['ph', 'Philippines', '菲律宾', 'PHP'],
  ['pk', 'Pakistan', '巴基斯坦', 'PKR'],
  ['pl', 'Poland', '波兰', 'PLN'],
  ['pt', 'Portugal', '葡萄牙', 'EUR'],
  ['pw', 'Palau', '帕劳', 'USD'],
  ['py', 'Paraguay', '巴拉圭', 'USD'],
  ['qa', 'Qatar', '卡塔尔', 'QAR'],
  ['ro', 'Romania', '罗马尼亚', 'RON'],
  ['rs', 'Serbia', '塞尔维亚', 'EUR'],
  ['ru', 'Russia', '俄罗斯', 'RUB'],
  ['rw', 'Rwanda', '卢旺达', 'RWF'],
  ['sa', 'Saudi Arabia', '沙特阿拉伯', 'SAR'],
  ['sb', 'Solomon Islands', '所罗门群岛', 'USD'],
  ['sc', 'Seychelles', '塞舌尔', 'SCR'],
  ['se', 'Sweden', '瑞典', 'SEK'],
  ['sg', 'Singapore', '新加坡', 'SGD'],
  ['si', 'Slovenia', '斯洛文尼亚', 'EUR'],
  ['sk', 'Slovakia', '斯洛伐克', 'EUR'],
  ['sl', 'Sierra Leone', '塞拉利昂', 'USD'],
  ['sn', 'Senegal', '塞内加尔', 'XOF'],
  ['sr', 'Suriname', '苏里南', 'USD'],
  ['st', 'São Tomé & Príncipe', '圣多美和普林西比', 'USD'],
  ['sv', 'El Salvador', '萨尔瓦多', 'USD'],
  ['sz', 'Eswatini', '斯威士兰', 'USD'],
  ['tc', 'Turks & Caicos Islands', '特克斯和凯科斯群岛', 'USD'],
  ['td', 'Chad', '乍得', 'XAF'],
  ['th', 'Thailand', '泰国', 'THB'],
  ['tj', 'Tajikistan', '塔吉克斯坦', 'USD'],
  ['tm', 'Turkmenistan', '土库曼斯坦', 'USD'],
  ['tn', 'Tunisia', '突尼斯', 'TND'],
  ['tr', 'Türkiye', '土耳其', 'TRY'],
  ['tt', 'Trinidad & Tobago', '特立尼达和多巴哥', 'USD'],
  ['tw', 'Taiwan', '台湾', 'TWD'],
  ['tz', 'Tanzania', '坦桑尼亚', 'TZS'],
  ['ua', 'Ukraine', '乌克兰', 'UAH'],
  ['ug', 'Uganda', '乌干达', 'USD'],
  ['us', 'United States', '美国', 'USD'],
  ['uy', 'Uruguay', '乌拉圭', 'USD'],
  ['uz', 'Uzbekistan', '乌兹别克斯坦', 'USD'],
  ['vc', 'St. Vincent & Grenadines', '圣文森特和格林纳丁斯', 'USD'],
  ['ve', 'Venezuela', '委内瑞拉', 'USD'],
  ['vg', 'British Virgin Islands', '英属维尔京群岛', 'USD'],
  ['vn', 'Vietnam', '越南', 'VND'],
  ['vu', 'Vanuatu', '瓦努阿图', 'USD'],
  ['ws', 'Samoa', '萨摩亚', 'USD'],
  ['xk', 'Kosovo', '科索沃', 'EUR'],
  ['ye', 'Yemen', '也门', 'USD'],
  ['za', 'South Africa', '南非', 'ZAR'],
  ['zm', 'Zambia', '赞比亚', 'ZMW'],
  ['zw', 'Zimbabwe', '津巴布韦', 'USD']
]

/**
 * Regional indicator letters, derived from the code rather than typed out: a
 * hand-written flag table is 170 chances to paste the wrong country.
 */
function flagOf(code: string): string {
  const base = 0x1f1e6
  const upper = code.toUpperCase()
  return String.fromCodePoint(
    base + upper.charCodeAt(0) - 65,
    base + upper.charCodeAt(1) - 65
  )
}

export const REGIONS: Region[] = ROWS.map(([code, name, nameZh, currency]) => ({
  code,
  name,
  nameZh,
  flag: flagOf(code),
  currency
}))

/** Every currency any storefront defaults to, for the manual override picker. */
export const CURRENCIES: string[] = Array.from(
  new Set(REGIONS.map((r) => r.currency))
).sort()

export const DEFAULT_REGION = 'us'

const BY_CODE = new Map(REGIONS.map((r) => [r.code, r]))

export function regionFor(code: string): Region {
  return BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_REGION)!
}

export function currencyFor(code: string): string {
  return regionFor(code).currency
}

/** Display name in the device language; the code itself stays the identifier. */
export function regionName(region: Region): string {
  return Device.systemLocale.startsWith('zh') ? region.nameZh : region.name
}

/** Matches on code, English name and Chinese name so either language can search. */
export function searchRegions(query: string): Region[] {
  const q = query.trim().toLowerCase()
  if (q === '') return REGIONS
  return REGIONS.filter(
    (r) =>
      r.code.includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.nameZh.includes(query.trim())
  )
}

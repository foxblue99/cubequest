/** WCA赛事名称英→中翻译映射 */
const TERM_MAP: Record<string, string> = {
  'Please Be Quiet': '盲拧安静赛', 'Small Cubes': '小魔方赛', 'Big Cubes': '大魔方赛',
  'GraDUAL 3x3': '三阶双人赛',
  Championship: '锦标赛', Summer: '夏季赛', Winter: '冬季赛',
  Spring: '春季赛', Autumn: '秋季赛',
  Afternoon: '下午赛', Special: '特别赛', Open: '公开赛',
  September: '九月', October: '十月', November: '十一月', December: '十二月',
  January: '一月', February: '二月', March: '三月', April: '四月',
  May: '五月', June: '六月', July: '七月', August: '八月',
  III: '三', VII: '七', VIII: '八', II: '二', IV: '四', VI: '六', IX: '九', V: '五', I: '一',
};
const TERM_KEYS = Object.keys(TERM_MAP).sort((a, b) => b.length - a.length);

const CITY_ZH: Record<string, string> = {
  Beijing: '北京', Shanghai: '上海', Guangzhou: '广州', Shenzhen: '深圳',
  Chengdu: '成都', Hangzhou: '杭州', Wuhan: '武汉', Nanjing: '南京',
  Chongqing: '重庆', Xian: '西安', Hefei: '合肥', Changsha: '长沙',
  Zhengzhou: '郑州', Jinan: '济南', Qingdao: '青岛', Dalian: '大连',
  Suzhou: '苏州', Kunming: '昆明', Xiamen: '厦门', Fuzhou: '福州',
  Nanchang: '南昌', Nanning: '南宁', Guiyang: '贵阳', Lanzhou: '兰州',
  Shenyang: '沈阳', Harbin: '哈尔滨', Changchun: '长春', Shijiazhuang: '石家庄',
  Taiyuan: '太原', Hohhot: '呼和浩特', Wuhu: '芜湖', Jiajiang: '夹江',
  Maoming: '茂名', Zhanjiang: '湛江', Leshan: '乐山', Ulanqab: '乌兰察布',
  Zhuhai: '珠海', Dongguan: '东莞', Foshan: '佛山', Zhongshan: '中山',
  Shantou: '汕头', Huizhou: '惠州', Wenzhou: '温州', Ningbo: '宁波',
  Wuxi: '无锡', Yangzhou: '扬州', Luoyang: '洛阳', Kaifeng: '开封',
  Yantai: '烟台', Weihai: '威海', Haikou: '海口', Sanya: '三亚',
};

const PROV_ZH: Record<string, string> = {
  Guangdong: '广东', Beijing: '北京', Shanghai: '上海', Sichuan: '四川',
  Zhejiang: '浙江', Jiangsu: '江苏', Shandong: '山东', Fujian: '福建',
  Hubei: '湖北', Hunan: '湖南', Henan: '河南', Hebei: '河北',
  Shaanxi: '陕西', Anhui: '安徽', Liaoning: '辽宁', Jilin: '吉林',
  Heilongjiang: '黑龙江', Yunnan: '云南', Guizhou: '贵州', Gansu: '甘肃',
  Jiangxi: '江西', Hainan: '海南', InnerMongolia: '内蒙古',
};

export function translateWcaName(enName: string, enCity: string): { nameZh: string; cityZh: string } {
  const [cityEn, provEn] = enCity.split(',').map(s => s.trim());
  const cityZh = CITY_ZH[cityEn] || cityEn;
  const provZh = provEn ? (PROV_ZH[provEn.replace(/\s+/g, '')] || provEn) : '';
  const cityZhFull = provZh ? `${cityZh}, ${provZh}` : cityZh;

  let nameZh = enName;
  for (const en of Object.keys(CITY_ZH).sort((a,b) => b.length - a.length)) {
    nameZh = nameZh.replace(new RegExp(en, 'g'), CITY_ZH[en]);
  }
  for (const en of TERM_KEYS) {
    nameZh = nameZh.replace(new RegExp(en, 'g'), TERM_MAP[en]);
  }

  return { nameZh, cityZh: cityZhFull };
}

// Centralized Official Saudi Administrative Regions, Governorates, Cities and Education Directorates

export interface SaudiRegion {
  id: string;
  name: string;
  nameEn: string;
  capital: string;
  lat: number;
  lng: number;
  directorate: string;
  governorates: SaudiGovernorate[];
}

export interface SaudiGovernorate {
  id: string;
  regionId: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  directorate: string;
  cities: SaudiCity[];
}

export interface SaudiCity {
  id: string;
  governorateId: string;
  regionId: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  postalCodePrefix?: string;
  districts: string[];
}

export const SAUDI_REGIONS: SaudiRegion[] = [
  {
    id: 'reg-riyadh',
    name: 'منطقة الرياض',
    nameEn: 'Riyadh Region',
    capital: 'مدينة الرياض',
    lat: 24.7136,
    lng: 46.6753,
    directorate: 'الإدارة العامة للتعليم بمنطقة الرياض',
    governorates: [
      {
        id: 'gov-kharj',
        regionId: 'reg-riyadh',
        name: 'محافظة الخرج',
        nameEn: 'Al-Kharj Governorate',
        lat: 24.1556,
        lng: 47.3119,
        directorate: 'إدارة التعليم بمحافظة الخرج',
        cities: [
          {
            id: 'city-saihat-kharj',
            governorateId: 'gov-kharj',
            regionId: 'reg-riyadh',
            name: 'مدينة السيح',
            nameEn: 'Al-Saihat / As-Saih',
            lat: 24.1500,
            lng: 47.3100,
            postalCodePrefix: '11942',
            districts: ['حي الخزامى', 'حي البرج', 'حي السلام', 'حي الورود', 'حي الأندلس', 'حي الفيصلية', 'حي النهضة', 'حي الروضة', 'حي النزهة', 'حي اليرموك', 'حي المنتزه', 'حي الخالدية', 'حي الزاهر', 'حي السعادة']
          },
          {
            id: 'city-dilam',
            governorateId: 'gov-kharj',
            regionId: 'reg-riyadh',
            name: 'مدينة الدلم',
            nameEn: 'Ad-Dilam',
            lat: 23.9917,
            lng: 47.1611,
            postalCodePrefix: '11992',
            districts: ['حي الصحنة', 'حي الناصرية', 'حي العليا', 'حي السعيدان', 'حي الريان']
          },
          {
            id: 'city-hayathim',
            governorateId: 'gov-kharj',
            regionId: 'reg-riyadh',
            name: 'مركز الهياثم',
            nameEn: 'Al-Hayathim',
            lat: 24.1800,
            lng: 47.2200,
            postalCodePrefix: '11942',
            districts: ['حي الهياثم القديم', 'حي المخطط الجديد', 'حي الورود']
          },
          {
            id: 'city-najan',
            governorateId: 'gov-kharj',
            regionId: 'reg-riyadh',
            name: 'مركز نعجان',
            nameEn: 'Naajan',
            lat: 24.0800,
            lng: 47.1900,
            postalCodePrefix: '11942',
            districts: ['حي نعجان الشمالي', 'حي المخطط العام']
          },
          {
            id: 'city-dhubaiyah',
            governorateId: 'gov-kharj',
            regionId: 'reg-riyadh',
            name: 'مركز الضبيعة',
            nameEn: 'Al-Dhubaiyah',
            lat: 24.1200,
            lng: 47.2400,
            postalCodePrefix: '11942',
            districts: ['حي الروضة بالضبيعة', 'حي المخطط السكني']
          },
          {
            id: 'city-sulaimiyah',
            governorateId: 'gov-kharj',
            regionId: 'reg-riyadh',
            name: 'مركز السلمية',
            nameEn: 'As-Sulaimiyah',
            lat: 24.1950,
            lng: 47.3300,
            postalCodePrefix: '11942',
            districts: ['حي السلمية الشرقي', 'حي السلمية الغربي']
          },
          {
            id: 'city-yamamah',
            governorateId: 'gov-kharj',
            regionId: 'reg-riyadh',
            name: 'مركز اليمامة',
            nameEn: 'Al-Yamamah',
            lat: 24.1850,
            lng: 47.2800,
            postalCodePrefix: '11942',
            districts: ['حي اليمامة التراثي', 'حي المخطط الحديث']
          }
        ]
      },
      {
        id: 'gov-riyadh-city',
        regionId: 'reg-riyadh',
        name: 'مدينة الرياض',
        nameEn: 'Riyadh City',
        lat: 24.7136,
        lng: 46.6753,
        directorate: 'الإدارة العامة للتعليم بمنطقة الرياض',
        cities: [
          {
            id: 'city-riyadh-north',
            governorateId: 'gov-riyadh-city',
            regionId: 'reg-riyadh',
            name: 'شمال الرياض',
            nameEn: 'North Riyadh',
            lat: 24.7900,
            lng: 46.6600,
            postalCodePrefix: '11564',
            districts: ['حي الياسمين', 'حي النرجس', 'حي الملقا', 'حي حطين', 'حي الصحافة', 'حي العارض']
          },
          {
            id: 'city-riyadh-east',
            governorateId: 'gov-riyadh-city',
            regionId: 'reg-riyadh',
            name: 'شرق الرياض',
            nameEn: 'East Riyadh',
            lat: 24.7600,
            lng: 46.7800,
            postalCodePrefix: '11432',
            districts: ['حي الروضة', 'حي القدس', 'حي الحمراء', 'حي اليرموك', 'حي الخليج', 'حي قرطبة']
          },
          {
            id: 'city-riyadh-west',
            governorateId: 'gov-riyadh-city',
            regionId: 'reg-riyadh',
            name: 'غرب الرياض',
            nameEn: 'West Riyadh',
            lat: 24.6500,
            lng: 46.5900,
            postalCodePrefix: '11564',
            districts: ['حي البديعة', 'حي السويدي', 'حي العريجاء', 'حي طويق', 'حي ظهرة لبن']
          },
          {
            id: 'city-riyadh-south',
            governorateId: 'gov-riyadh-city',
            regionId: 'reg-riyadh',
            name: 'جنوب ووسط الرياض',
            nameEn: 'South & Central Riyadh',
            lat: 24.6300,
            lng: 46.7100,
            postalCodePrefix: '11421',
            districts: ['حي الملز', 'حي المربع', 'حي الشفاء', 'حي العزيزية', 'حي الدار البيضاء']
          }
        ]
      },
      {
        id: 'gov-diriyah',
        regionId: 'reg-riyadh',
        name: 'محافظة الدرعية',
        nameEn: 'Diriyah Governorate',
        lat: 24.7333,
        lng: 46.5833,
        directorate: 'الإدارة العامة للتعليم بمنطقة الرياض (مكتب الدرعية)',
        cities: [
          {
            id: 'city-diriyah',
            governorateId: 'gov-diriyah',
            regionId: 'reg-riyadh',
            name: 'مدينة الدرعية',
            nameEn: 'Diriyah',
            lat: 24.7333,
            lng: 46.5833,
            postalCodePrefix: '13711',
            districts: ['حي البجيري', 'حي الطريف', 'حي الخالدية', 'حي العلب', 'حي ظهرة العودة']
          }
        ]
      },
      {
        id: 'gov-majmaah',
        regionId: 'reg-riyadh',
        name: 'محافظة المجمعة',
        nameEn: 'Al-Majmaah Governorate',
        lat: 25.9000,
        lng: 45.3333,
        directorate: 'إدارة التعليم بمحافظة المجمعة',
        cities: [
          {
            id: 'city-majmaah',
            governorateId: 'gov-majmaah',
            regionId: 'reg-riyadh',
            name: 'مدينة المجمعة',
            nameEn: 'Al-Majmaah',
            lat: 25.9000,
            lng: 45.3333,
            postalCodePrefix: '11952',
            districts: ['حي اليرموك', 'حي المستقبل', 'حي الأندلس', 'حي المطار', 'حي الفيحاء']
          }
        ]
      },
      {
        id: 'gov-dawadmi',
        regionId: 'reg-riyadh',
        name: 'محافظة الدوادمي',
        nameEn: 'Ad-Dawadmi Governorate',
        lat: 24.5000,
        lng: 44.4000,
        directorate: 'إدارة التعليم بمحافظة الدوادمي',
        cities: [
          {
            id: 'city-dawadmi',
            governorateId: 'gov-dawadmi',
            regionId: 'reg-riyadh',
            name: 'مدينة الدوادمي',
            nameEn: 'Ad-Dawadmi',
            lat: 24.5000,
            lng: 44.4000,
            postalCodePrefix: '11911',
            districts: ['حي الروضة', 'حي الملك فهد', 'حي الخليج', 'حي السلام']
          }
        ]
      },
      {
        id: 'gov-wadi-dawasir',
        regionId: 'reg-riyadh',
        name: 'محافظة وادي الدواسر',
        nameEn: 'Wadi Ad-Dawasir',
        lat: 20.4833,
        lng: 44.8167,
        directorate: 'إدارة التعليم بمحافظة وادي الدواسر',
        cities: [
          {
            id: 'city-wadi-dawasir',
            governorateId: 'gov-wadi-dawasir',
            regionId: 'reg-riyadh',
            name: 'وادي الدواسر',
            nameEn: 'Wadi Ad-Dawasir',
            lat: 20.4833,
            lng: 44.8167,
            postalCodePrefix: '11991',
            districts: ['حي الخماسين', 'حي النويعمة', 'حي اللدام']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-makkah',
    name: 'منطقة مكة المكرمة',
    nameEn: 'Makkah Region',
    capital: 'مكة المكرمة',
    lat: 21.3891,
    lng: 39.8579,
    directorate: 'الإدارة العامة للتعليم بمنطقة مكة المكرمة',
    governorates: [
      {
        id: 'gov-makkah-city',
        regionId: 'reg-makkah',
        name: 'العاصمة المقدسة (مكة المكرمة)',
        nameEn: 'Holy Makkah',
        lat: 21.3891,
        lng: 39.8579,
        directorate: 'الإدارة العامة للتعليم بمنطقة مكة المكرمة',
        cities: [
          {
            id: 'city-makkah',
            governorateId: 'gov-makkah-city',
            regionId: 'reg-makkah',
            name: 'مدينة مكة المكرمة',
            nameEn: 'Makkah',
            lat: 21.3891,
            lng: 39.8579,
            postalCodePrefix: '21955',
            districts: ['حي العزيزية', 'حي الشوقية', 'حي بطحاء قريش', 'حي النزهة', 'حي العوالي', 'حي الزاهر', 'حي الشرائع']
          }
        ]
      },
      {
        id: 'gov-jeddah',
        regionId: 'reg-makkah',
        name: 'محافظة جدة',
        nameEn: 'Jeddah Governorate',
        lat: 21.5433,
        lng: 39.1728,
        directorate: 'الإدارة العامة للتعليم بمحافظة جدة',
        cities: [
          {
            id: 'city-jeddah',
            governorateId: 'gov-jeddah',
            regionId: 'reg-makkah',
            name: 'مدينة جدة',
            nameEn: 'Jeddah',
            lat: 21.5433,
            lng: 39.1728,
            postalCodePrefix: '21442',
            districts: ['حي الشاطئ', 'حي الروضة', 'حي السلامة', 'حي النعيم', 'حي الحمراء', 'حي المرجان', 'حي البساتين', 'حي الصفا', 'حي أبحر الشمالية']
          }
        ]
      },
      {
        id: 'gov-taif',
        regionId: 'reg-makkah',
        name: 'محافظة الطائف',
        nameEn: 'Taif Governorate',
        lat: 21.2854,
        lng: 40.4244,
        directorate: 'الإدارة العامة للتعليم بمحافظة الطائف',
        cities: [
          {
            id: 'city-taif',
            governorateId: 'gov-taif',
            regionId: 'reg-makkah',
            name: 'مدينة الطائف',
            nameEn: 'Taif',
            lat: 21.2854,
            lng: 40.4244,
            postalCodePrefix: '21944',
            districts: ['حي شهار', 'حي الفيصلية', 'حي قروى', 'حي القمرية', 'حي الوشحاء', 'حي نخب', 'حي الحوية']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-eastern',
    name: 'المنطقة الشرقية',
    nameEn: 'Eastern Province',
    capital: 'الدمام',
    lat: 26.4207,
    lng: 50.0888,
    directorate: 'الإدارة العامة للتعليم بالمنطقة الشرقية',
    governorates: [
      {
        id: 'gov-dammam',
        regionId: 'reg-eastern',
        name: 'حاضرة الدمام',
        nameEn: 'Dammam Metropolitan',
        lat: 26.4207,
        lng: 50.0888,
        directorate: 'الإدارة العامة للتعليم بالمنطقة الشرقية',
        cities: [
          {
            id: 'city-dammam',
            governorateId: 'gov-dammam',
            regionId: 'reg-eastern',
            name: 'مدينة الدمام',
            nameEn: 'Dammam',
            lat: 26.4207,
            lng: 50.0888,
            postalCodePrefix: '31411',
            districts: ['حي الشاطئ الشرقي', 'حي الشاطئ الغربي', 'حي المزروعية', 'حي الفيصلية', 'حي النورس', 'حي الفاخرية']
          },
          {
            id: 'city-khobar',
            governorateId: 'gov-dammam',
            regionId: 'reg-eastern',
            name: 'مدينة الخبر',
            nameEn: 'Al-Khobar',
            lat: 26.2172,
            lng: 50.1971,
            postalCodePrefix: '31952',
            districts: ['حي الحزام الذهبي', 'حي الحزام الأخضر', 'حي العليا', 'حي العقربية', 'حي الكورنيش', 'حي الراكة']
          },
          {
            id: 'city-dhahran',
            governorateId: 'gov-dammam',
            regionId: 'reg-eastern',
            name: 'مدينة الظهران',
            nameEn: 'Dhahran',
            lat: 26.2700,
            lng: 50.1500,
            postalCodePrefix: '31261',
            districts: ['حي الدوحة الجنوبية', 'حي الدوحة الشمالية', 'حي الجامعة', 'حي الدانة']
          }
        ]
      },
      {
        id: 'gov-ahsa',
        regionId: 'reg-eastern',
        name: 'محافظة الأحساء',
        nameEn: 'Al-Ahsa Governorate',
        lat: 25.3833,
        lng: 49.6000,
        directorate: 'الإدارة العامة للتعليم بمحافظة الأحساء',
        cities: [
          {
            id: 'city-hofuf',
            governorateId: 'gov-ahsa',
            regionId: 'reg-eastern',
            name: 'الهفوف والمبرز',
            nameEn: 'Al-Hofuf & Al-Mubarraz',
            lat: 25.3833,
            lng: 49.6000,
            postalCodePrefix: '31982',
            districts: ['حي الجامعة', 'حي المزروع', 'حي الشهابية', 'حي الخالدية', 'حي البندرية', 'حي النزهة']
          }
        ]
      },
      {
        id: 'gov-jubail',
        regionId: 'reg-eastern',
        name: 'محافظة الجبيل',
        nameEn: 'Al-Jubail Governorate',
        lat: 27.0174,
        lng: 49.6601,
        directorate: 'مكتب التعليم بمحافظة الجبيل',
        cities: [
          {
            id: 'city-jubail',
            governorateId: 'gov-jubail',
            regionId: 'reg-eastern',
            name: 'مدينة الجبيل الصناعية والبلد',
            nameEn: 'Jubail Industrial & City',
            lat: 27.0174,
            lng: 49.6601,
            postalCodePrefix: '31951',
            districts: ['حي الفناتير', 'حي جلمودة', 'حي الدفي', 'حي نجد', 'حي الحويلات']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-madinah',
    name: 'منطقة المدينة المنورة',
    nameEn: 'Madinah Region',
    capital: 'المدينة المنورة',
    lat: 24.5247,
    lng: 39.5692,
    directorate: 'الإدارة العامة للتعليم بمنطقة المدينة المنورة',
    governorates: [
      {
        id: 'gov-madinah-city',
        regionId: 'reg-madinah',
        name: 'المدينة المنورة',
        nameEn: 'Madinah City',
        lat: 24.5247,
        lng: 39.5692,
        directorate: 'الإدارة العامة للتعليم بمنطقة المدينة المنورة',
        cities: [
          {
            id: 'city-madinah',
            governorateId: 'gov-madinah-city',
            regionId: 'reg-madinah',
            name: 'مدينة المدينة المنورة',
            nameEn: 'Madinah',
            lat: 24.5247,
            lng: 39.5692,
            postalCodePrefix: '41411',
            districts: ['حي قباء', 'حي العوالي', 'حي العزيزية', 'حي باقدو', 'حي قربان', 'حي سلطانة', 'حي الملك فهد']
          }
        ]
      },
      {
        id: 'gov-yanbu',
        regionId: 'reg-madinah',
        name: 'محافظة ينبع',
        nameEn: 'Yanbu Governorate',
        lat: 24.0891,
        lng: 38.0637,
        directorate: 'إدارة التعليم بمحافظة ينبع',
        cities: [
          {
            id: 'city-yanbu',
            governorateId: 'gov-yanbu',
            regionId: 'reg-madinah',
            name: 'مدينة ينبع البحر والصناعية',
            nameEn: 'Yanbu Al-Bahr & Industrial',
            lat: 24.0891,
            lng: 38.0637,
            postalCodePrefix: '41912',
            districts: ['حي السميري', 'حي النواة', 'حي العيون', 'حي الصهاريج', 'حي خالد']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-qassim',
    name: 'منطقة القصيم',
    nameEn: 'Al-Qassim Region',
    capital: 'بريدة',
    lat: 26.3592,
    lng: 43.9818,
    directorate: 'الإدارة العامة للتعليم بمنطقة القصيم',
    governorates: [
      {
        id: 'gov-buraidah',
        regionId: 'reg-qassim',
        name: 'مدينة بريدة',
        nameEn: 'Buraidah',
        lat: 26.3592,
        lng: 43.9818,
        directorate: 'الإدارة العامة للتعليم بمنطقة القصيم',
        cities: [
          {
            id: 'city-buraidah',
            governorateId: 'gov-buraidah',
            regionId: 'reg-qassim',
            name: 'مدينة بريدة',
            nameEn: 'Buraidah',
            lat: 26.3592,
            lng: 43.9818,
            postalCodePrefix: '51411',
            districts: ['حي الفايزية', 'حي الإسكان', 'حي الصفراء', 'حي الريان', 'حي المنتزه', 'حي النهضة']
          }
        ]
      },
      {
        id: 'gov-onizah',
        regionId: 'reg-qassim',
        name: 'محافظة عنيزة',
        nameEn: 'Onaizah Governorate',
        lat: 26.0844,
        lng: 43.9936,
        directorate: 'إدارة التعليم بمحافظة عنيزة',
        cities: [
          {
            id: 'city-onizah',
            governorateId: 'gov-onizah',
            regionId: 'reg-qassim',
            name: 'مدينة عنيزة',
            nameEn: 'Onaizah',
            lat: 26.0844,
            lng: 43.9936,
            postalCodePrefix: '51911',
            districts: ['حي الأشرفية', 'حي الفاخرية', 'حي الصالحية', 'حي الخزامى']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-asir',
    name: 'منطقة عسير',
    nameEn: 'Asir Region',
    capital: 'أبها',
    lat: 18.2164,
    lng: 42.5053,
    directorate: 'الإدارة العامة للتعليم بمنطقة عسير',
    governorates: [
      {
        id: 'gov-abha',
        regionId: 'reg-asir',
        name: 'مدينة أبها',
        nameEn: 'Abha City',
        lat: 18.2164,
        lng: 42.5053,
        directorate: 'الإدارة العامة للتعليم بمنطقة عسير',
        cities: [
          {
            id: 'city-abha',
            governorateId: 'gov-abha',
            regionId: 'reg-asir',
            name: 'مدينة أبها',
            nameEn: 'Abha',
            lat: 18.2164,
            lng: 42.5053,
            postalCodePrefix: '61411',
            districts: ['حي المنسك', 'حي المفتاحة', 'حي الخالدية', 'حي النزهة', 'حي البديع', 'حي المحالة']
          }
        ]
      },
      {
        id: 'gov-khamis-mushait',
        regionId: 'reg-asir',
        name: 'محافظة خميس مشيط',
        nameEn: 'Khamis Mushait',
        lat: 18.3000,
        lng: 42.7333,
        directorate: 'مكتب التعليم بمحافظة خميس مشيط',
        cities: [
          {
            id: 'city-khamis',
            governorateId: 'gov-khamis-mushait',
            regionId: 'reg-asir',
            name: 'مدينة خميس مشيط',
            nameEn: 'Khamis Mushait',
            lat: 18.3000,
            lng: 42.7333,
            postalCodePrefix: '61961',
            districts: ['حي الرصراص', 'حي شباعة', 'حي الموسى', 'حي الإسكان', 'حي طيبة']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-tabuk',
    name: 'منطقة تبوك',
    nameEn: 'Tabuk Region',
    capital: 'تبوك',
    lat: 28.3835,
    lng: 36.5662,
    directorate: 'الإدارة العامة للتعليم بمنطقة تبوك',
    governorates: [
      {
        id: 'gov-tabuk-city',
        regionId: 'reg-tabuk',
        name: 'مدينة تبوك',
        nameEn: 'Tabuk City',
        lat: 28.3835,
        lng: 36.5662,
        directorate: 'الإدارة العامة للتعليم بمنطقة تبوك',
        cities: [
          {
            id: 'city-tabuk',
            governorateId: 'gov-tabuk-city',
            regionId: 'reg-tabuk',
            name: 'مدينة تبوك',
            nameEn: 'Tabuk',
            lat: 28.3835,
            lng: 36.5662,
            postalCodePrefix: '71411',
            districts: ['حي المروج', 'حي الورود', 'حي العليا', 'حي السليمانية', 'حي الريان']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-hail',
    name: 'منطقة حائل',
    nameEn: 'Hail Region',
    capital: 'حائل',
    lat: 27.5114,
    lng: 41.7208,
    directorate: 'الإدارة العامة للتعليم بمنطقة حائل',
    governorates: [
      {
        id: 'gov-hail-city',
        regionId: 'reg-hail',
        name: 'مدينة حائل',
        nameEn: 'Hail City',
        lat: 27.5114,
        lng: 41.7208,
        directorate: 'الإدارة العامة للتعليم بمنطقة حائل',
        cities: [
          {
            id: 'city-hail',
            governorateId: 'gov-hail-city',
            regionId: 'reg-hail',
            name: 'مدينة حائل',
            nameEn: 'Hail',
            lat: 27.5114,
            lng: 41.7208,
            postalCodePrefix: '81411',
            districts: ['حي صديان', 'حي النقرة', 'حي الوسيطاء', 'حي الجامعيين', 'حي المحطة']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-northern',
    name: 'منطقة الحدود الشمالية',
    nameEn: 'Northern Borders Region',
    capital: 'عرعر',
    lat: 30.9753,
    lng: 41.0381,
    directorate: 'الإدارة العامة للتعليم بمنطقة الحدود الشمالية',
    governorates: [
      {
        id: 'gov-arar-city',
        regionId: 'reg-northern',
        name: 'مدينة عرعر',
        nameEn: 'Arar City',
        lat: 30.9753,
        lng: 41.0381,
        directorate: 'الإدارة العامة للتعليم بمنطقة الحدود الشمالية',
        cities: [
          {
            id: 'city-arar',
            governorateId: 'gov-arar-city',
            regionId: 'reg-northern',
            name: 'مدينة عرعر',
            nameEn: 'Arar',
            lat: 30.9753,
            lng: 41.0381,
            postalCodePrefix: '73311',
            districts: ['حي المساعدية', 'حي المحمدية', 'حي الخالدية', 'حي الصالحية']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-jazan',
    name: 'منطقة جازان',
    nameEn: 'Jazan Region',
    capital: 'جازان',
    lat: 16.8892,
    lng: 42.5706,
    directorate: 'الإدارة العامة للتعليم بمنطقة جازان',
    governorates: [
      {
        id: 'gov-jazan-city',
        regionId: 'reg-jazan',
        name: 'مدينة جازان',
        nameEn: 'Jazan City',
        lat: 16.8892,
        lng: 42.5706,
        directorate: 'الإدارة العامة للتعليم بمنطقة جازان',
        cities: [
          {
            id: 'city-jazan',
            governorateId: 'gov-jazan-city',
            regionId: 'reg-jazan',
            name: 'مدينة جازان',
            nameEn: 'Jazan',
            lat: 16.8892,
            lng: 42.5706,
            postalCodePrefix: '45142',
            districts: ['حي الشاطئ', 'حي المطار', 'حي السويس', 'حي الروضة']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-najran',
    name: 'منطقة نجران',
    nameEn: 'Najran Region',
    capital: 'نجران',
    lat: 17.4924,
    lng: 44.1277,
    directorate: 'الإدارة العامة للتعليم بمنطقة نجران',
    governorates: [
      {
        id: 'gov-najran-city',
        regionId: 'reg-najran',
        name: 'مدينة نجران',
        nameEn: 'Najran City',
        lat: 17.4924,
        lng: 44.1277,
        directorate: 'الإدارة العامة للتعليم بمنطقة نجران',
        cities: [
          {
            id: 'city-najran',
            governorateId: 'gov-najran-city',
            regionId: 'reg-najran',
            name: 'مدينة نجران',
            nameEn: 'Najran',
            lat: 17.4924,
            lng: 44.1277,
            postalCodePrefix: '75411',
            districts: ['حي الفهد', 'حي الخالدية', 'حي القابل', 'حي الفيصلية']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-baha',
    name: 'منطقة الباحة',
    nameEn: 'Al-Baha Region',
    capital: 'الباحة',
    lat: 20.0129,
    lng: 41.4677,
    directorate: 'الإدارة العامة للتعليم بمنطقة الباحة',
    governorates: [
      {
        id: 'gov-baha-city',
        regionId: 'reg-baha',
        name: 'مدينة الباحة',
        nameEn: 'Al-Baha City',
        lat: 20.0129,
        lng: 41.4677,
        directorate: 'الإدارة العامة للتعليم بمنطقة الباحة',
        cities: [
          {
            id: 'city-baha',
            governorateId: 'gov-baha-city',
            regionId: 'reg-baha',
            name: 'مدينة الباحة',
            nameEn: 'Al-Baha',
            lat: 20.0129,
            lng: 41.4677,
            postalCodePrefix: '65511',
            districts: ['حي الظفير', 'حي البلد', 'حي شهبة', 'حي الحاوية']
          }
        ]
      }
    ]
  },
  {
    id: 'reg-jouf',
    name: 'منطقة الجوف',
    nameEn: 'Al-Jouf Region',
    capital: 'سكاكا',
    lat: 29.9697,
    lng: 40.2064,
    directorate: 'الإدارة العامة للتعليم بمنطقة الجوف',
    governorates: [
      {
        id: 'gov-sakaka-city',
        regionId: 'reg-jouf',
        name: 'مدينة سكاكا',
        nameEn: 'Sakaka City',
        lat: 29.9697,
        lng: 40.2064,
        directorate: 'الإدارة العامة للتعليم بمنطقة الجوف',
        cities: [
          {
            id: 'city-sakaka',
            governorateId: 'gov-sakaka-city',
            regionId: 'reg-jouf',
            name: 'مدينة سكاكا',
            nameEn: 'Sakaka',
            lat: 29.9697,
            lng: 40.2064,
            postalCodePrefix: '72311',
            districts: ['حي الشلهوب', 'حي اللقائط', 'حي الصفا', 'حي المعاقلة']
          }
        ]
      }
    ]
  }
];

// Helper Functions
export function getAllSaudiRegions(): SaudiRegion[] {
  return SAUDI_REGIONS;
}

export function getRegionById(regionId: string): SaudiRegion | undefined {
  return SAUDI_REGIONS.find(r => r.id === regionId || r.name === regionId);
}

export function getGovernoratesByRegionId(regionId: string): SaudiGovernorate[] {
  const reg = SAUDI_REGIONS.find(r => r.id === regionId || r.name === regionId);
  return reg ? reg.governorates : [];
}

export function getCitiesByGovernorateId(govId: string): SaudiCity[] {
  for (const reg of SAUDI_REGIONS) {
    const gov = reg.governorates.find(g => g.id === govId || g.name === govId);
    if (gov) return gov.cities;
  }
  return [];
}

export function findGeoByCoordinates(lat: number, lng: number): {
  region?: SaudiRegion;
  governorate?: SaudiGovernorate;
  city?: SaudiCity;
} {
  // Approximate nearest city calculation (Euclidean approximation)
  let closestCity: SaudiCity | undefined;
  let closestGov: SaudiGovernorate | undefined;
  let closestReg: SaudiRegion | undefined;
  let minDistance = Infinity;

  for (const reg of SAUDI_REGIONS) {
    for (const gov of reg.governorates) {
      for (const city of gov.cities) {
        const d = Math.hypot(city.lat - lat, city.lng - lng);
        if (d < minDistance) {
          minDistance = d;
          closestCity = city;
          closestGov = gov;
          closestReg = reg;
        }
      }
    }
  }

  return {
    region: closestReg,
    governorate: closestGov,
    city: closestCity
  };
}

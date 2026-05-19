// ================================================================
//  Данные профориентационного теста — Университет «Дубна»
//  Методики: RIASEC, Климов, Учебные склонности
// ================================================================

var BLOCKS = [
  { id:"riasec", label:"RIASEC", num:1,
    intro:"Блок 1 из 3 — RIASEC. Отвечайте честно: 1 — совсем не согласен, 5 — полностью согласен.",
    groups:[
      { key:"R", name:"Реалистичный", questions:[
        [1,"Мне нравится работать с техникой и механизмами."],
        [2,"Я получаю удовольствие от практической работы руками."],
        [3,"Мне интересны инженерные задачи."],
        [4,"Я предпочёл бы работу в лаборатории или на производстве, чем в офисе."],
        [5,"Мне нравится разбираться, как устроены приборы."],
        [6,"Я легко осваиваю технические инструменты."]
      ]},
      { key:"I", name:"Исследовательский", questions:[
        [7,"Мне нравится анализировать сложные проблемы."],
        [8,"Я люблю точные науки (физику, химию, математику)."], //+
        [9,"Мне интересно проводить различные исследования."], //+
        [10,"Я люблю логические задачи."],
        [11,"Мне нравится искать закономерности в природе."],//+
        [12,"Я предпочитаю интеллектуальный труд физическому."]
      ]},
      { key:"A", name:"Артистический", questions:[
        [13,"Мне нравится выражать себя творчески."],
        [14,"Я интересуюсь языками, культурой, искусством."],
        [15,"Я люблю писать, рисовать или выступать."],
        [16,"Я ценю оригинальность и нестандартность."],
        [17,"Мне нравится придумывать новые идеи."],
        [18,"Я не люблю строгие инструкции."]
      ]},
      { key:"S", name:"Социальный", questions:[
        [19,"Мне нравится помогать людям."],
        [20,"Я умею слушать и поддерживать."],
        [21,"Мне интересно разбираться в психологии людей."],
        [22,"Я хотел(а) бы работать с людьми."],
        [23,"Мне нравится обучать или объяснять."],
        [24,"Я чувствую удовлетворение, когда кому-то помог."]
      ]},
      { key:"E", name:"Предпринимательский", questions:[
        [25,"Мне нравится организовывать людей."],
        [26,"Я хочу влиять на решения."],
        [27,"Мне интересны управление и бизнес."], //+
        [28,"Я часто беру на себя ответственность."],
        [29,"Я умею убеждать."],
        [30,"Мне нравится конкуренция."]
      ]},
      { key:"C", name:"Конвенциональный", questions:[
        [31,"Я люблю порядок и структуру."],
        [32,"Мне комфортно работать по инструкциям."],
        [33,"Я внимателен к деталям."],
        [34,"Мне нравится работать с таблицами и данными."],
        [35,"Я аккуратен в документации."],
        [36,"Я предпочитаю чёткие правила."]
      ]}
    ]},
  { id:"klimov", label:"Климов", num:2,
    intro:"Блок 2 из 3 — Методика Климова. Определяет предпочтительный предмет труда.",
    groups:[
      { key:"ЧЧ", name:"Человек — Человек", questions:[
        [37,"Мне комфортно работать с людьми напрямую."],
        [42,"Я хотел бы консультировать людей."],
        [47,"Мне нравится обучать других."], //+
        [56,"Я хотел(а) бы заниматься управлением коллективом."]
      ]},
      { key:"ЧП", name:"Человек — Природа", questions:[
        [38,"Мне интересно изучать природу и экологию."],
        [46,"Я бы хотел работать в сфере экологии или химии."],
        [51,"Мне интересно изучать физические процессы."],
        [55,"Мне интересно исследовать свойства различных материалов."]
      ]},
      { key:"ЧЗ", name:"Человек — Знаковые системы", questions:[
        [39,"Я предпочитаю работать с программами и цифрами."],
        [44,"Я люблю анализировать статистику."],
        [49,"Мне комфортно работать с кодом или формулами."],
        [52,"Я люблю систематизировать информацию."]
      ]},
      { key:"ЧТ", name:"Человек — Техника", questions:[
        [40,"Мне нравится взаимодействовать с оборудованием."],
        [43,"Мне интересно проектирование техники."],
        [48,"Я люблю решать инженерные задачи."],
        [54,"Я люблю точность и расчёты."]
      ]},
      { key:"ЧХ", name:"Человек — Художественный образ", questions:[
        [41,"Мне интересна художественная деятельность."],
        [45,"Мне нравится творческая самореализация."],
        [50,"Я люблю творчество: от текстов до дизайна."], //+
        [53,"Мне нравится участвовать в переговорах."]
      ]}
    ]},
  { id:"study", label:"Учебные склонности", num:3,
    intro:"Блок 3 из 3 — Учебные склонности. Интерес к предметам и сферам деятельности.",
    groups:[
      { key:"IT",         name:"IT / Программирование", questions:[
        [58,"Я люблю программирование или хотел(а) бы его изучать."],
        [69,"Я люблю исследовать новые технологии."],
        [72,"Я хотел(а) бы работать в IT."]
      ]},
      { key:"Math",       name:"Математика / Данные", questions:[
        [57,"Математика даётся мне легко."],
        [66,"Я люблю анализировать большие объёмы информации."],
        [76,"Мне нравится системная работа с данными."]
      ]},
      { key:"Physics",    name:"Физика / Наука", questions:[
        [63,"Мне интересна физика."],
        [67,"Мне нравится проводить эксперименты."],
        [75,"Я хочу заниматься наукой."]
      ]},
      { key:"Chemistry",  name:"Химия",                  questions:[[62,"Я люблю химию."]]},
      { key:"Ecology",    name:"Биология / Экология",    questions:[[64,"Мне интересна биология или экология."]]},
      { key:"Psychology", name:"Психология / Социальное", questions:[
        [59,"Мне интересна психология."],
        [73,"Мне интересна социальная работа."]
      ]},
      { key:"Languages",  name:"Языки / Публичность", questions:[
        [60,"Я люблю иностранные языки."],
        [68,"Я легко выступаю публично."]
      ]},
      { key:"Management", name:"Менеджмент",             questions:[[65,"Мне интересен менеджмент."]]},
      { key:"Law",        name:"Юриспруденция / Документы", questions:[
        [61,"Мне интересна юриспруденция."],
        [70,"Мне нравится работать с документами."]
      ]},
      { key:"Energy",     name:"Энергетика / Проектирование", questions:[
        [71,"Мне интересна энергетика."],
        [74,"Мне нравится проектирование."]
      ]}
    ]}
];

var DIRECTIONS = {
  "Авиастроение":                                  [["R","I"],  "ЧТ", ["Energy","Physics"]],
  "Автоматизация технологических процессов":       [["R","I"],  "ЧТ", ["Energy","Math"]],
  "Информатика и вычислительная техника":          [["I","C"],  "ЧЗ", ["IT","Math"]],
  "Информационные системы и технологии":           [["I","C"],  "ЧЗ", ["Math","IT"]],
  "Клиническая психология":                        [["S","I"],  "ЧЧ", ["Psychology"]],
  "Конструирование и технология электронных средств":[["R","I"],"ЧТ", ["Energy","Physics"]],
  "Лингвистика":                                   [["A","S"],  "ЧХ", ["Languages"]],
  "Менеджмент":                                    [["E","S"],  "ЧЧ", ["Management"]],
  "Прикладная информатика":                        [["I","C"],  "ЧЗ", ["IT","Math"]],
  "Программная инженерия":                         [["R","I"],  "ЧЗ", ["IT","Math"]],
  "Психология":                                    [["S","I"],  "ЧЧ", ["Psychology"]],
  "Социология":                                    [["I","S"],  "ЧЧ", ["Psychology","Math"]],
  "Технология геологической разведки":             [["R","I"],  "ЧП", ["Ecology","Physics"]],
  "Физика":                                        [["I"],      "ЧП", ["Physics","Math"]],
  "Химия":                                         [["I","R"],  "ЧП", ["Chemistry","Physics"]],
  "Химия, физика и механика материалов":           [["I","R"],  "ЧТ", ["Chemistry","Physics"]],
  "Экология и природопользование":                 [["I","S"],  "ЧП", ["Ecology"]],
  "Электроэнергетика и электротехника":            [["R","I"],  "ЧТ", ["Energy","Math"]],
  "Юриспруденция":                                 [["E","C"],  "ЧЗ", ["Law"]],
  "Ядерные физика и технологии":                   [["I","R"],  "ЧТ", ["Physics","Energy","Math"]]
};

var W = { riasec:0.40, klimov:0.30, study:0.30 };

// ======================================================================
// ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ О НАПРАВЛЕНИЯХ
// ======================================================================

var PROGRAM_DETAILS = {
  "Ядерные физика и технологии": {
    code: "14.03.02",
    exams: "Физика, Русский язык, Химия (по выбору), Математика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 225,
    budget_places: 36,
    url: "https://uni-dubna.ru/directions/bachelor/yadernye-fizika-i-tehnologii-ochnaya/yaderno-fizicheskie-tehnologii-v-biologii-i-meditsine",
    cost_semester: ""
  },
  "Авиастроение": {
    code: "24.03.04",
    exams: "Русский язык, Математика, Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 209,
    budget_places: 30,
    url: "https://uni-dubna.ru/directions/bachelor/aviastroenie-ochnaya/konstruirovanie-i-tehnologiya-letatelnyh-apparatov",
    cost_semester: ""
  },
  "Автоматизация технологических процессов и производств": {
    code: "15.03.04",
    exams: "Русский язык, Математика, Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 216,
    budget_places: 10,
    url: "https://uni-dubna.ru/directions/bachelor/avtomatizatsiya-tehnologicheskih-protsessov-i-proizvodstv-ochnaya/intellektualnye-sistemy-upravleniya-robotizirovannymi-tehnologicheskimi-protsessami",
    cost_semester: ""
  },
  // Дубликат
  "Автоматизация технологических процессов": {
    code: "15.03.04",
    exams: "Русский язык, Математика, Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 216,
    budget_places: 10,
    url: "https://uni-dubna.ru/directions/bachelor/avtomatizatsiya-tehnologicheskih-protsessov-i-proizvodstv-ochnaya/intellektualnye-sistemy-upravleniya-robotizirovannymi-tehnologicheskimi-protsessami",
    cost_semester: ""
  },
  "Информатика и вычислительная техника": {
    code: "09.03.01",
    exams: "Русский язык, Математика, Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 220,
    budget_places: 33,
    url: "https://uni-dubna.ru/directions/bachelor/informatika-i-vychislitelnaya-tehnika-ochnaya/inzheneriya-sistem-iskusstvennogo-intellekta",
    cost_semester: ""
  },
  "Информационные системы и технологии": {
    code: "09.03.02",
    exams: "Русский язык, Математика, Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 214,
    budget_places: 20,
    url: "https://uni-dubna.ru/directions/bachelor/informatsionnye-sistemy-i-tehnologii-ochnaya/geoanalitika",
    cost_semester: ""
  },
  "Клиническая психология": {
    code: "37.05.01",
    exams: "Русский язык, Биология, Химия (по выбору), Обществознание (по выбору), Математика (по выбору)",
    score_budget: 234,
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/klinicheskaya-psihologiya-ochnaya/patopsihologicheskaya-diagnostika-i-psihoterapiya",
    cost_semester: ""
  },
  "Конструирование и технология электронных средств": {
    code: "11.03.03",
    exams: "Физика, Русский язык, Химия (по выбору), Математика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 205,
    budget_places: 25,
    url: "https://uni-dubna.ru/directions/bachelor/konstruirovanie-i-tehnologiya-elektronnyh-sredstv-ochnaya/proektirovanie-i-tehnologiya-intellektualnyh-radioelektronnyh-ustroystv",
    cost_semester: ""
  },
  "Лингвистика": {
    code: "45.03.02",
    exams: "Русский язык, Английский язык, Обществознание (по выбору), Литература (по выбору), История (по выбору)",
    score_budget: 196,
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/lingvistika-ochnaya/perevod-i-mezhkulturnaya-kommunikatsiya",
    cost_semester: ""
  },
  "Менеджмент": {
    code: "38.03.02",
    exams: "Русский язык, Математика, Обществознание (по выбору), История (по выбору), Информатика и ИКТ (по выбору), Английский язык (по выбору)",
    score_budget: "н/д",
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/menedzhment-ochnaya/tsifrovye-tehnologii-v-biznese",
    cost_semester: ""
  },
  "Прикладная информатика": {
    code: "09.03.03",
    exams: "Русский язык, Математика, Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 214,
    budget_places: 33,
    url: "https://uni-dubna.ru/directions/bachelor/prikladnaya-informatika-ochnaya/prikladnaya-informatika-v-upravlenii-korporativnymi-sistemami",
    cost_semester: ""
  },
  "Программная инженерия": {
    code: "09.03.04",
    exams: "Русский язык, Математика, Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 231,
    budget_places: 40,
    url: "https://uni-dubna.ru/directions/bachelor/programmnaya-inzheneriya-ochnaya/razrabotka-programmno-informatsionnyh-sistem",
    cost_semester: ""
  },
  "Психология": {
    code: "37.03.01",
    exams: "Русский язык, Биология, Обществознание (по выбору), Математика (по выбору)",
    score_budget: "н/д",
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/psihologiya-ochnaya/psihologicheskoe-konsultirovanie-i-psihodiagnostika",
    cost_semester: ""
  },
  "Социология": {
    code: "39.03.01",
    exams: "Русский язык, Обществознание, Математика (по выбору), История (по выбору), Английский язык (по выбору)",
    score_budget: "н/д",
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/sotsiologiya-ochnaya/sotsiologicheskie-i-marketingovye-issledovaniya",
    cost_semester: ""
  },
  "Технология геологической разведки": {
    code: "21.05.03",
    exams: "Русский язык, Математика, Химия (по выбору), Физика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: "н/д",
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/tehnologiya-geologicheskoy-razvedki-ochnaya/geofizicheskie-metody-poiska-i-razvedki-mestorozhdeniy-poleznyh-iskopaemyh",
    cost_semester: ""
  },
  "Физика": {
    code: "03.03.02",
    exams: "Физика, Русский язык, Химия (по выбору), Математика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 233,
    budget_places: 16,
    url: "https://uni-dubna.ru/directions/bachelor/fizika-ochnaya/teoreticheskaya-i-eksperimentalnaya-fizika-mikromira",
    cost_semester: ""
  },
  "Химия": {
    code: "04.03.01",
    exams: "Химия, Русский язык, Физика (по выбору), Математика (по выбору), Информатика и ИКТ (по выбору), Биология (по выбору)",
    score_budget: 210,
    budget_places: 10,
    url: "https://uni-dubna.ru/directions/bachelor/himiya-ochnaya/fizicheskaya-himiya",
    cost_semester: ""
  },
  "Химия, физика и механика материалов": {
    code: "04.03.02",
    exams: "Химия, Русский язык, Физика (по выбору), Математика (по выбору), Информатика и ИКТ (по выбору), Биология (по выбору)",
    score_budget: 183,
    budget_places: 7,
    url: "https://uni-dubna.ru/directions/bachelor/himiya-fizika-i-mehanika-materialov-ochnaya/innovatsionnye-materialy-i-nanotehnologii",
    cost_semester: ""
  },
  "Экология и природопользование": {
    code: "05.03.06",
    exams: "Русский язык, Математика, Химия (по выбору), Физика (по выбору), География (по выбору), Биология (по выбору)",
    score_budget: "н/д",
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/ekologiya-i-prirodopolzovanie-ochnaya/upravlenie-ekologicheskoy-bezopasnostyu-na-proizvodstve",
    cost_semester: ""
  },
  "Электроэнергетика и электротехника": {
    code: "13.03.02",
    exams: "Физика, Русский язык, Химия (по выбору), Математика (по выбору), Информатика и ИКТ (по выбору)",
    score_budget: 202,
    budget_places: 20,
    url: "https://uni-dubna.ru/directions/bachelor/elektroenergetika-i-elektrotehnika-ochnaya/avtonomnye-istochniki-energii",
    cost_semester: ""
  },
  "Юриспруденция": {
    code: "40.03.01",
    exams: "Русский язык, Обществознание, Математика (по выбору), История (по выбору), Информатика и ИКТ (по выбору), Английский язык (по выбору)",
    score_budget: 177,
    budget_places: 0,
    url: "https://uni-dubna.ru/directions/bachelor/yurisprudentsiya-ochnaya/grazhdansko-pravovoy",
    cost_semester: ""
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BLOCKS: BLOCKS,
    DIRECTIONS: DIRECTIONS,
    W: W,
    PROGRAM_DETAILS: PROGRAM_DETAILS
  };
}

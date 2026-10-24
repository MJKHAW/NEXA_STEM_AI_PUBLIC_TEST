(function () {
  var TARGET = 250;
  var BEAKERS = [20, 50, 80];

  function speechOf(hint, sit) {
    if (typeof hint.speech === "function") {
      return hint.speech(sit);
    }
    return hint.speech;
  }

  function tapsOf(hint, sit) {
    var taps = typeof hint.taps === "function" ? hint.taps(sit) : hint.taps;
    return taps || [];
  }

  function spaceLeft(sit) {
    return TARGET - sit.volume;
  }

  function beakerTaps(sit) {
    var space = spaceLeft(sit);
    var fit = BEAKERS.filter(function (amount) {
      return amount <= space;
    });
    if (fit.length >= 2) {
      return [
        {
          id: "bekas-" + fit[0],
          label: fit[0] + " mL",
          visual: "Bekas kecil",
          speech: "Bekas " + fit[0] + " mL muat ke dalam ruang yang tinggal. Kamu masih perlu mengetuk bekas itu sendiri pada skrin. Ini bantuan guru."
        },
        {
          id: "bekas-" + fit[1],
          label: fit[1] + " mL",
          visual: "Bekas lain",
          speech: "Bekas " + fit[1] + " mL juga muat. Pilih satu sahaja, kemudian semak paras. Ini bantuan guru."
        }
      ];
    }
    if (fit.length === 1) {
      return [
        {
          id: "bekas-" + fit[0],
          label: fit[0] + " mL",
          visual: "Bekas yang muat",
          speech: "Hanya bekas " + fit[0] + " mL yang muat. Ketuk bekas itu pada skrin jika kamu setuju. Ini bantuan guru."
        },
        {
          id: "semak",
          label: "SEMAK",
          visual: "Lihat paras",
          speech: "Lihat paras air dahulu. Jangan pilih bekas yang lebih besar daripada ruang. Ini bantuan guru."
        }
      ];
    }
    return [
      {
        id: "set-semula",
        label: "SET SEMULA",
        visual: "Paras mula",
        speech: "Tiada bekas yang muat. Tekan set semula, kemudian mula semula dengan bekas kecil. Ini bantuan guru."
      },
      {
        id: "tidak-muat",
        label: "TIDAK MUAT",
        visual: "Bekas besar",
        speech: "Bekas yang besar tidak muat. Air tidak akan bertambah. Ini bantuan guru."
      }
    ];
  }

  var HINTS = [
    {
      id: "fikir-faham",
      stage: "fikir",
      level: 1,
      priority: 1,
      speech: "Tangki sudah ada air. Sasaran lebih tinggi. Kamu perlu cari berapa banyak lagi untuk sampai ke sasaran. Ini bantuan guru."
    },
    {
      id: "fikir-faham-120",
      stage: "fikir",
      level: 1,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120"; },
      speech: "Kamu memilih air yang sudah ada. Jumlah itu bukan air yang perlu ditambah. Lihat sasaran yang lebih tinggi. Ini bantuan guru."
    },
    {
      id: "fikir-faham-150",
      stage: "fikir",
      level: 1,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "150"; },
      speech: "Pilihan itu terlalu besar. Bandingkan air yang ada dengan sasaran, kemudian buat kiraan sendiri. Ini bantuan guru."
    },
    {
      id: "fikir-operasi",
      stage: "fikir",
      level: 2,
      priority: 1,
      speech: "Operasi yang sesuai ialah tolak. Ambil sasaran, kemudian tolak air yang sudah ada. Ini bantuan guru.",
      taps: [
        { id: "tolak", label: "TOLAK", visual: "Sasaran − air ada", speech: "Betul. Guna tolak. Sasaran tolak air yang ada. Kira sendiri. Jawapan tidak disebut. Ini bantuan guru." },
        { id: "tambah", label: "TAMBAH", visual: "Air ada + bekas", speech: "Tambah digunakan semasa menuang air. Untuk cari perbezaan, guna tolak. Ini bantuan guru." }
      ]
    },
    {
      id: "fikir-operasi-120",
      stage: "fikir",
      level: 2,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120"; },
      speech: "120 mL ialah air yang sudah ada, bukan jawapan. Guna tolak. Sasaran tolak air yang ada. Ini bantuan guru.",
      taps: [
        { id: "tolak", label: "TOLAK", visual: "Sasaran − air ada", speech: "Betul. Guna tolak. Jangan pilih semula air yang sudah ada. Ini bantuan guru." },
        { id: "tambah", label: "TAMBAH", visual: "Air ada + bekas", speech: "Tambah bukan operasi untuk soalan ini. Guna tolak. Ini bantuan guru." }
      ]
    },
    {
      id: "fikir-operasi-150",
      stage: "fikir",
      level: 2,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "150"; },
      speech: "150 mL bukan hasil yang tepat. Jangan teka. Guna tolak: sasaran tolak air yang ada. Ini bantuan guru.",
      taps: [
        { id: "tolak", label: "TOLAK", visual: "Sasaran − air ada", speech: "Betul. Guna tolak dan kira sendiri. Jangan teka nombor yang lebih besar. Ini bantuan guru." },
        { id: "tambah", label: "TAMBAH", visual: "Air ada + bekas", speech: "Tambah digunakan semasa menuang. Soalan ini meminta tolak. Ini bantuan guru." }
      ]
    },
    {
      id: "fikir-langkah",
      stage: "fikir",
      level: 3,
      priority: 1,
      speech: "Langkah satu: ingat air yang ada. Langkah dua: ingat sasaran. Langkah tiga: buat tolak. Jawapan tidak disebut. Ini bantuan guru.",
      taps: [
        { id: "ada", label: "AIR ADA", visual: "120 mL", speech: "Air yang ada ialah 120 mL. Nombor ini sudah tertulis pada soalan. Sekarang buat tolak dengan sasaran. Ini bantuan guru." },
        { id: "sasaran", label: "SASARAN", visual: "250 mL", speech: "Sasaran ialah 250 mL. Tolak air yang ada. Jawapan tidak disebut. Ini bantuan guru." }
      ]
    },
    {
      id: "fikir-langkah-120",
      stage: "fikir",
      level: 3,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120"; },
      speech: "Langkah satu: 120 mL ialah air yang ada, bukan jumlah yang ditambah. Langkah dua: ingat sasaran 250 mL. Langkah tiga: buat tolak. Ini bantuan guru.",
      taps: [
        { id: "ada", label: "AIR ADA", visual: "120 mL", speech: "120 mL ialah paras mula. Ia bukan jumlah yang perlu ditambah. Ini bantuan guru." },
        { id: "sasaran", label: "SASARAN", visual: "250 mL", speech: "Sasaran ialah 250 mL. Buat tolak sendiri. Ini bantuan guru." }
      ]
    },
    {
      id: "fikir-langkah-150",
      stage: "fikir",
      level: 3,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "150"; },
      speech: "Langkah satu: 150 mL terlalu besar. Langkah dua: ingat air ada 120 mL dan sasaran 250 mL. Langkah tiga: buat tolak sendiri. Ini bantuan guru.",
      taps: [
        { id: "ada", label: "AIR ADA", visual: "120 mL", speech: "Air yang ada ialah 120 mL. Jangan guna 150 mL sebagai jawapan. Ini bantuan guru." },
        { id: "sasaran", label: "SASARAN", visual: "250 mL", speech: "Sasaran ialah 250 mL. Tolak air yang ada, kemudian pilih sendiri. Ini bantuan guru." }
      ]
    },
    {
      id: "exp-siap",
      stage: "eksperimen",
      level: 1,
      priority: 5,
      when: function (sit) { return sit.volume >= TARGET; },
      speech: "Tangki sudah sampai sasaran 250 mL. Teruskan ke bahagian buktikan. Ini bantuan guru."
    },
    {
      id: "exp-lebih",
      stage: "eksperimen",
      level: 1,
      priority: 4,
      when: function (sit) { return sit.overflow; },
      speech: function (sit) {
        return "Bekas " + sit.beaker + " mL terlalu besar. Air tidak dituang. Paras kekal " + sit.volume + " mL. Pilih bekas yang lebih kecil. Ini bantuan guru.";
      }
    },
    {
      id: "exp-tengah",
      stage: "eksperimen",
      level: 1,
      priority: 3,
      when: function (sit) { return sit.volume > 120 && sit.volume < TARGET; },
      speech: function (sit) {
        return "Paras air sekarang ialah " + sit.volume + " mL. Sasaran masih 250 mL. Masih ada ruang. Pilih bekas yang tidak terlalu besar. Ini bantuan guru.";
      }
    },
    {
      id: "exp-mula",
      stage: "eksperimen",
      level: 1,
      priority: 1,
      speech: function (sit) {
        return "Paras air sekarang ialah " + sit.volume + " mL. Sasaran ialah 250 mL. Tuang sedikit demi sedikit dan semak paras. Ini bantuan guru.";
      }
    },
    {
      id: "exp-operasi-lebih",
      stage: "eksperimen",
      level: 2,
      priority: 3,
      when: function (sit) { return sit.overflow; },
      speech: "Tambah hanya jika bekas muat. Bekas tadi tidak muat, jadi paras tidak berubah. Pilih bekas yang lebih kecil, kemudian tambah. Ini bantuan guru.",
      taps: [
        { id: "tambah", label: "TAMBAH", visual: "Tuang yang muat", speech: "Ya, eksperimen ini menambah air. Pilih bekas yang lebih kecil dahulu. Ini bantuan guru." },
        { id: "tolak", label: "TOLAK", visual: "Cari perbezaan", speech: "Tolak digunakan untuk mencari perbezaan. Di sini kamu menambah air yang muat. Ini bantuan guru." }
      ]
    },
    {
      id: "exp-operasi",
      stage: "eksperimen",
      level: 2,
      priority: 1,
      when: function (sit) { return sit.volume < TARGET; },
      speech: "Di eksperimen ini, operasi ialah tambah. Setiap tuang ditambah kepada air yang ada. Berhenti apabila paras sampai ke sasaran. Ini bantuan guru.",
      taps: [
        { id: "tambah", label: "TAMBAH", visual: "Air ada + bekas", speech: "Ya. Tuang bermaksud tambah. Pilih satu bekas, kemudian lihat paras baharu. Ini bantuan guru." },
        { id: "tolak", label: "TOLAK", visual: "Sasaran − air ada", speech: "Tolak digunakan untuk mencari perbezaan. Di eksperimen ini, kamu menambah air. Ini bantuan guru." }
      ]
    },
    {
      id: "exp-langkah-penuh",
      stage: "eksperimen",
      level: 3,
      priority: 5,
      when: function (sit) { return sit.volume >= TARGET; },
      speech: "Langkah satu: paras sudah 250 mL. Langkah dua: jangan tuang lagi. Langkah tiga: teruskan ke buktikan. Ini bantuan guru."
    },
    {
      id: "exp-langkah-lebih",
      stage: "eksperimen",
      level: 3,
      priority: 4,
      when: function (sit) { return sit.overflow; },
      speech: "Langkah satu: bekas tadi tidak muat. Langkah dua: bandingkan nombor pada bekas dengan ruang yang tinggal. Langkah tiga: pilih bekas yang lebih kecil, atau tekan set semula. Ini bantuan guru.",
      taps: [
        { id: "kecil", label: "LEBIH KECIL", visual: "Tukar bekas", speech: "Pilih bekas yang lebih kecil daripada percubaan tadi. Air tidak dituang jika bekas terlalu besar. Ini bantuan guru." },
        { id: "set-semula", label: "SET SEMULA", visual: "Paras mula", speech: "Set semula mengembalikan air ke paras mula. Ia tidak menanda jawapan. Ini bantuan guru." }
      ]
    },
    {
      id: "exp-langkah",
      stage: "eksperimen",
      level: 3,
      priority: 1,
      when: function (sit) { return sit.volume < TARGET; },
      speech: function (sit) {
        return "Langkah satu: baca paras " + sit.volume + " mL. Langkah dua: ingat sasaran 250 mL. Langkah tiga: pilih satu bekas kecil yang muat. Tuang sendiri pada skrin. Ini bantuan guru.";
      },
      taps: beakerTaps
    },
    {
      id: "bukti-faham",
      stage: "buktikan",
      level: 1,
      priority: 1,
      speech: "Buktikan mesti bermula dengan air awal, tambah air yang dituang, dan hasilnya mesti sama dengan sasaran. Ini bantuan guru."
    },
    {
      id: "bukti-faham-50",
      stage: "buktikan",
      level: 1,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120+50=170"; },
      speech: "Kamu memilih baris yang menambah 50 mL. Hasilnya kurang daripada sasaran. Paras akhir belum dibuktikan. Ini bantuan guru."
    },
    {
      id: "bukti-faham-80",
      stage: "buktikan",
      level: 1,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120+80=200"; },
      speech: "Kamu memilih baris yang menambah 80 mL. Hasilnya masih kurang daripada sasaran. Baca baris yang lain. Ini bantuan guru."
    },
    {
      id: "bukti-operasi",
      stage: "buktikan",
      level: 2,
      priority: 1,
      speech: "Operasi pada baris ini ialah tambah. Air awal tambah air yang dituang. Kemudian semak hasil sama ada sama dengan sasaran. Ini bantuan guru.",
      taps: [
        { id: "tambah", label: "TAMBAH", visual: "Awal + dituang", speech: "Ya, guna tambah. Kemudian semak sama ada hasil sama dengan sasaran. Ini bantuan guru." },
        { id: "tolak", label: "TOLAK", visual: "Bukan baris ini", speech: "Tolak bukan operasi pada baris ini. Cari baris yang menambah air awal dengan air yang dituang. Ini bantuan guru." }
      ]
    },
    {
      id: "bukti-operasi-50",
      stage: "buktikan",
      level: 2,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120+50=170"; },
      speech: "Baris 50 mL menggunakan tambah, tetapi hasilnya belum sampai ke sasaran. Cari baris yang hasilnya sama dengan sasaran. Ini bantuan guru.",
      taps: [
        { id: "tambah", label: "TAMBAH", visual: "Awal + dituang", speech: "Operasinya tambah. Hasil baris 50 mL masih kurang. Semak baris lain sendiri. Ini bantuan guru." },
        { id: "tolak", label: "TOLAK", visual: "Bukan baris ini", speech: "Tolak tidak digunakan pada baris buktikan ini. Ini bantuan guru." }
      ]
    },
    {
      id: "bukti-operasi-80",
      stage: "buktikan",
      level: 2,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120+80=200"; },
      speech: "Baris 80 mL menggunakan tambah, tetapi hasilnya belum sampai ke sasaran. Cari baris yang hasilnya sama dengan sasaran. Ini bantuan guru.",
      taps: [
        { id: "tambah", label: "TAMBAH", visual: "Awal + dituang", speech: "Operasinya tambah. Hasil baris 80 mL masih kurang. Semak baris lain sendiri. Ini bantuan guru." },
        { id: "tolak", label: "TOLAK", visual: "Bukan baris ini", speech: "Tolak tidak digunakan pada baris buktikan ini. Ini bantuan guru." }
      ]
    },
    {
      id: "bukti-langkah",
      stage: "buktikan",
      level: 3,
      priority: 1,
      speech: "Langkah satu: cari baris yang bermula dengan air awal. Langkah dua: lihat jumlah yang ditambah. Langkah tiga: semak hasil sama ada sampai ke sasaran. Ini bantuan guru.",
      taps: [
        { id: "kurang", label: "HASIL KURANG", visual: "Belum sampai", speech: "Jika hasil kurang daripada sasaran, baris itu belum tepat. Ini bantuan guru." },
        { id: "sampai", label: "SAMPAI SASARAN", visual: "Hasil sama", speech: "Pilih baris yang hasilnya sama dengan sasaran. Kamu masih perlu membaca baris itu sendiri. Ini bantuan guru." }
      ]
    },
    {
      id: "bukti-langkah-50",
      stage: "buktikan",
      level: 3,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120+50=170"; },
      speech: "Langkah satu: baris 50 mL hasilnya kurang. Langkah dua: abaikan hasil yang kurang daripada sasaran. Langkah tiga: baca baris lain dan semak sendiri. Ini bantuan guru.",
      taps: [
        { id: "kurang", label: "HASIL KURANG", visual: "Baris 50 mL", speech: "Baris 50 mL hasilnya kurang daripada sasaran. Ia belum tepat. Ini bantuan guru." },
        { id: "sampai", label: "SAMPAI SASARAN", visual: "Baca baris lain", speech: "Cari hasil yang sama dengan sasaran. Jangan pilih semula baris 50 mL. Ini bantuan guru." }
      ]
    },
    {
      id: "bukti-langkah-80",
      stage: "buktikan",
      level: 3,
      priority: 3,
      when: function (sit) { return sit.lastWrong === "120+80=200"; },
      speech: "Langkah satu: baris 80 mL hasilnya kurang. Langkah dua: abaikan hasil yang kurang daripada sasaran. Langkah tiga: baca baris lain dan semak sendiri. Ini bantuan guru.",
      taps: [
        { id: "kurang", label: "HASIL KURANG", visual: "Baris 80 mL", speech: "Baris 80 mL hasilnya kurang daripada sasaran. Ia belum tepat. Ini bantuan guru." },
        { id: "sampai", label: "SAMPAI SASARAN", visual: "Baca baris lain", speech: "Cari hasil yang sama dengan sasaran. Jangan pilih semula baris 80 mL. Ini bantuan guru." }
      ]
    }
  ];

  function hintById(id) {
    var index;
    for (index = 0; index < HINTS.length; index += 1) {
      if (HINTS[index].id === id) {
        return HINTS[index];
      }
    }
    return null;
  }

  function levelFor(fails, presses) {
    var depth = Math.max(Number(fails) || 0, Number(presses) || 0);
    if (depth <= 1) {
      return 1;
    }
    if (depth === 2) {
      return 2;
    }
    return 3;
  }

  function normalise(input) {
    var stage = input && input.stage;
    if (stage === "demo" || stage === "m1-fikir") {
      stage = "fikir";
    }
    if (stage === "m1-eksperimen") {
      stage = "eksperimen";
    }
    if (stage === "m1-buktikan") {
      stage = "buktikan";
    }
    return {
      screen: input && input.screen ? input.screen : stage,
      stage: stage,
      fails: Number(input && input.fails) || 0,
      presses: Number(input && input.presses) || 0,
      level: levelFor(input && input.fails, input && input.presses),
      lastWrong: input && input.lastWrong ? String(input.lastWrong) : "",
      volume: input && input.volume !== undefined && input.volume !== null && input.volume !== "" ? Number(input.volume) : 120,
      overflow: !!(input && input.overflow),
      beaker: Number(input && input.beaker) || 0
    };
  }

  function matches(hint, sit) {
    if (hint.stage !== sit.stage || hint.level !== sit.level) {
      return false;
    }
    if (hint.when && !hint.when(sit)) {
      return false;
    }
    return true;
  }

  function suitableHints(sit) {
    return HINTS.filter(function (hint) {
      return matches(hint, sit);
    }).sort(function (a, b) {
      return b.priority - a.priority;
    });
  }

  function selectHint(input) {
    var sit = normalise(input);
    var found = suitableHints(sit);
    var hint = found[0] || null;
    if (!hint) {
      return null;
    }
    return {
      id: hint.id,
      stage: hint.stage,
      level: sit.level,
      source: "guru",
      speech: speechOf(hint, sit),
      taps: tapsOf(hint, sit),
      suitableIds: found.map(function (item) { return item.id; }),
      situation: sit
    };
  }

  function validateChoice(id, input) {
    var sit = input && input.stage && input.level ? input : normalise(input);
    var hint = hintById(id);
    if (!hint) {
      return { ok: false, reason: "ID tidak wujud" };
    }
    if (hint.stage !== sit.stage) {
      return { ok: false, reason: "Peringkat tidak sepadan" };
    }
    if (hint.level !== sit.level) {
      return { ok: false, reason: "Aras bantuan tidak sepadan" };
    }
    if (hint.when && !hint.when(sit)) {
      return { ok: false, reason: "Tidak sesuai dengan keadaan semasa" };
    }
    return { ok: true, hint: hint, speech: speechOf(hint, sit) };
  }

  function acceptModelReply(raw, input) {
    var text = String(raw || "").replace(/\s+/g, " ").trim();
    var id;
    if (!text) {
      return { ok: false, reason: "Output kosong" };
    }
    if ((text.charAt(0) === "\"" && text.charAt(text.length - 1) === "\"") || (text.charAt(0) === "'" && text.charAt(text.length - 1) === "'")) {
      text = text.slice(1, -1).trim();
    }
    id = text;
    if (/\d/.test(id) && !hintById(id)) {
      return { ok: false, reason: "Output mengandungi nombor" };
    }
    if (!/^[a-z0-9-]+$/.test(id)) {
      return { ok: false, reason: "Output bukan ID" };
    }
    return validateChoice(id, input);
  }

  function tap(pack, tapId) {
    var taps = pack && pack.taps ? pack.taps : [];
    var index;
    for (index = 0; index < taps.length; index += 1) {
      if (taps[index].id === tapId) {
        return taps[index];
      }
    }
    return null;
  }

  function statusLine(result) {
    var mode = result && result.mode;
    if (mode === "checking") {
      return "Ujian AI sedang disemak. Bantuan di atas ialah bantuan guru dan tidak menunggu model.";
    }
    if (mode === "unsupported" || mode === "unavailable") {
      return "Ujian AI tidak disokong pada peranti ini. Bantuan di atas ialah bantuan guru, bukan AI.";
    }
    if (mode === "loading") {
      return "Ujian AI masih memuat. Bantuan guru sudah diberi dan tidak menunggu muat turun.";
    }
    if (mode === "accepted") {
      return "Ujian AI memilih " + result.id + ". Ayat yang dibaca ialah ayat guru, bukan ayat bebas.";
    }
    if (mode === "device-off") {
      return "Ujian pada peranti dimatikan. Ini Bantuan Guru, bukan ayat AI.";
    }
    if (mode === "allowance") {
      return "Had percuma AI hari ini sudah habis. Ini Bantuan Guru, bukan ayat AI Nova.";
    }
    if (mode === "guru") {
      return "Ini Bantuan Guru, bukan ayat AI Nova.";
    }
    return "Ujian AI ditolak. Output tidak sah. Bantuan guru kekal.";
  }

  function judgeModel(raw, input) {
    var judged = acceptModelReply(raw, input);
    if (!judged.ok) {
      return { mode: "rejected", reason: judged.reason };
    }
    return { mode: "accepted", id: judged.hint.id };
  }

  function containsAnswer(text) {
    return String(text || "").indexOf("130") !== -1 || String(text || "").indexOf("120+130") !== -1 || String(text || "").indexOf("120 + 130") !== -1;
  }

  function pupilGuide(input) {
    var screen = input && input.screen;
    var answer = input && input.answer ? String(input.answer) : "";
    var volume = Number(input && input.volume);
    var pour = Number(input && input.pour) || 0;
    var blocked = !!(input && input.blocked);
    var knownPour = pour === 20 || pour === 50 || pour === 80;
    var speech = "";
    if (volume !== volume) {
      volume = 120;
    }
    if (screen === "demo" || screen === "m1-fikir") {
      if (answer === "120") {
        speech = "Jawapan kamu: 120 mL. Jika tambah 120 mL, jumlah menjadi 240 mL. Masih belum sampai 250 mL. Cuba lagi!";
      } else if (answer === "150") {
        speech = "Jawapan kamu: 150 mL. Jika tambah 150 mL, jumlah menjadi 270 mL. Itu terlalu banyak. Cuba lagi!";
      } else {
        speech = "Tangki ada 120 mL air. Sasaran kita 250 mL. Cuba fikir berapa air perlu ditambah.";
      }
    } else if (screen === "m1-eksperimen") {
      if (volume >= TARGET && knownPour && !blocked) {
        speech = "Pilihan kamu: Bekas " + pour + " mL. Air sekarang 250 mL. Sasaran sudah dicapai.";
      } else if (volume >= TARGET) {
        speech = "Air sekarang 250 mL. Sasaran sudah dicapai.";
      } else if (blocked && knownPour) {
        if (TARGET - volume < 20) {
          speech = "Pilihan kamu: Bekas " + pour + " mL. Air tidak dituang. Air sekarang " + volume + " mL. Sasaran 250 mL. Tiada bekas yang muat. Tekan faham untuk mula semula.";
        } else {
          speech = "Pilihan kamu: Bekas " + pour + " mL. Air tidak dituang. Air sekarang " + volume + " mL. Sasaran 250 mL. Pilih bekas yang lebih kecil.";
        }
      } else if (knownPour) {
        speech = "Pilihan kamu: Bekas " + pour + " mL. Air sekarang " + volume + " mL. Sasaran 250 mL. Pilih bekas yang sesuai seterusnya.";
      } else if (volume === 120) {
        speech = "Air dalam tangki ialah 120 mL. Tambah air menggunakan bekas yang sesuai sehingga paras mencapai 250 mL.";
      } else {
        speech = "Air dalam tangki ialah " + volume + " mL. Tambah air menggunakan bekas yang sesuai sehingga paras mencapai 250 mL.";
      }
    } else if (screen === "m1-buktikan") {
      if (answer === "120+50=170") {
        speech = "Jawapan kamu: 120 tambah 50 sama dengan 170 mL. Jumlah ini masih kurang daripada sasaran 250 mL. Cuba semak pilihan lain.";
      } else if (answer === "120+80=200") {
        speech = "Jawapan kamu: 120 tambah 80 sama dengan 200 mL. Jumlah ini masih kurang daripada sasaran 250 mL. Cuba semak pilihan lain.";
      } else {
        speech = "Tangki bermula dengan 120 mL air. Selepas eksperimen, paras air menjadi 250 mL. Pilih ayat matematik yang betul.";
      }
    }
    if (!speech || containsAnswer(speech)) {
      return null;
    }
    return {
      speech: speech,
      taps: [],
      title: "AI NOVA"
    };
  }

  function reviewNovaHint(text, input) {
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    var lower = clean.toLowerCase();
    var level = Number(input && input.level) || 1;
    var sentences;
    var numbers;
    var index;
    var english;
    if (clean.length < 24 || clean.length > 220) {
      return { ok: false, reason: "panjang" };
    }
    sentences = clean.split(/[.!?]+/).filter(function (part) {
      return part.trim().length > 0;
    });
    if (sentences.length < 1 || sentences.length > 2) {
      return { ok: false, reason: "ayat" };
    }
    if (/https?:|www\.|<|>|\{|\}|ketik|taip|nama kamu|e-mel|email/i.test(clean)) {
      return { ok: false, reason: "tidak sesuai" };
    }
    if (/130|seratus tiga puluh|satu ratus tiga puluh/.test(lower)) {
      return { ok: false, reason: "dedah jawapan" };
    }
    numbers = clean.match(/\d+/g) || [];
    for (index = 0; index < numbers.length; index += 1) {
      if (numbers[index] !== "120" && numbers[index] !== "250") {
        return { ok: false, reason: "nombor tidak dibenarkan" };
      }
    }
    if (/120(?:\s*ml)?\s+(?:ialah|adalah)\s+jawapan/.test(lower)) {
      return { ok: false, reason: "salah" };
    }
    if (/(?:pilih|tekan)\s+(?:120|150|250)/.test(lower)) {
      return { ok: false, reason: "suruh pilih" };
    }
    if (/\btambah\b/.test(lower) && !/\btolak\b/.test(lower)) {
      return { ok: false, reason: "operasi salah" };
    }
    if (!/(air|tangki|sasaran|tolak|beza|kurang|paras)/.test(lower)) {
      return { ok: false, reason: "tidak berkaitan" };
    }
    english = lower.match(/\b(the|and|you|need|water|answer|subtract|please|tank)\b/g) || [];
    if (english.length >= 2) {
      return { ok: false, reason: "bahasa" };
    }
    if (/\b(silakan|apakah|bisa|tidak bisa)\b/.test(lower)) {
      return { ok: false, reason: "bahasa" };
    }
    if (level >= 2 && !/\btolak\b/.test(lower)) {
      return { ok: false, reason: "aras" };
    }
    return { ok: true, text: clean };
  }

  window.NexaGuide = {
    target: TARGET,
    hints: HINTS,
    levelFor: levelFor,
    selectHint: selectHint,
    validateChoice: validateChoice,
    acceptModelReply: acceptModelReply,
    tap: tap,
    statusLine: statusLine,
    judgeModel: judgeModel,
    containsAnswer: containsAnswer,
    pupilGuide: pupilGuide,
    reviewNovaHint: reviewNovaHint,
    speechOf: speechOf,
    tapsOf: tapsOf
  };
})();

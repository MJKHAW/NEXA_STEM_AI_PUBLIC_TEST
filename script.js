(function () {
  var INITIAL_VOLUME = 120;
  var TARGET_VOLUME = 250;
  var POUR_MS = 800;

  var FIKIR_ANSWER = 130;
  var BUKTI_ANSWER = 190;

  var M1_TANK_DEBUG = {
    x: 56.8,
    y: 41,
    width: 29.7,
    height: 20.9,
    borderRadius: 8,
    clipInset: 0,
    labelX: 50,
    labelY: 6,
    labelFollow: true
  };
  var m1TankLayout = null;

  var state = {
    volume: INITIAL_VOLUME,
    selected: null,
    pouring: false,
    completed: false,
    fikirSolved: false,
    buktiSolved: false,
    experimentMarked: false,
    attemptPours: [],
    proofPours: null,
    overflowHold: false,
    correct: 0,
    incorrect: 0,
    log: []
  };

  var pourToken = 0;
  var cylinder = document.getElementById("cylinder");
  var water = document.getElementById("water");
  var scale = document.getElementById("scale");
  var volumeText = document.getElementById("volume-text");
  var message = document.getElementById("message");
  var pourButton = document.getElementById("pour-button");
  var resetButton = document.getElementById("reset-button");
  var beakers = document.querySelectorAll(".beaker");
  var nova = document.getElementById("nova");
  var novaSpeech = document.getElementById("nova-speech");
  var fikirForm = document.getElementById("fikir-form");
  var fikirInput = document.getElementById("fikir-input");
  var fikirFeedback = document.getElementById("fikir-feedback");
  var fikirHint = document.getElementById("fikir-hint");
  var hintButton = document.getElementById("hint-button");
  var eksperimenNote = document.getElementById("eksperimen-note");
  var eksperimenStatus = document.getElementById("eksperimen-status");
  var buktiPanel = document.getElementById("bukti-panel");
  var buktiForm = document.getElementById("bukti-form");
  var buktiInput = document.getElementById("bukti-input");
  var buktiFeedback = document.getElementById("bukti-feedback");
  var correctCount = document.getElementById("correct-count");
  var incorrectCount = document.getElementById("incorrect-count");
  var attemptLog = document.getElementById("attempt-log");
  var welcomeScreen = document.getElementById("welcome-screen");
  var aiDemoScreen = document.getElementById("ai-demo");
  var mapScreen = document.getElementById("city-map");
  var missionScreen = document.getElementById("mission-one");
  var missionBadge = document.getElementById("mission-badge");
  var mapNote = document.getElementById("map-note");
  var openMissionButton = document.getElementById("open-mission-one");
  var backToMapButton = document.getElementById("back-to-map");
  var mapSpeech = document.getElementById("map-speech");
  var missionTwoScreen = document.getElementById("mission-two");
  var missionTwoButton = document.getElementById("open-mission-two");
  var missionTwoBadge = document.getElementById("mission-two-badge");
  var missionTwoLock = document.getElementById("mission-two-lock");
  var missionTwoState = document.getElementById("mission-two-state");
  var backToMapTwoButton = document.getElementById("back-to-map-two");
  var missionThreeScreen = document.getElementById("mission-three");
  var missionThreeButton = document.getElementById("open-mission-three");
  var missionThreeBadge = document.getElementById("mission-three-badge");
  var missionThreeLock = document.getElementById("mission-three-lock");
  var missionThreeState = document.getElementById("mission-three-state");
  var backToMapThreeButton = document.getElementById("back-to-map-three");
  var missionFourScreen = document.getElementById("mission-four");
  var missionFourButton = document.getElementById("open-mission-four");
  var missionFourBadge = document.getElementById("mission-four-badge");
  var missionFourLock = document.getElementById("mission-four-lock");
  var missionFourState = document.getElementById("mission-four-state");
  var backToMapFourButton = document.getElementById("back-to-map-four");

  function buildScale() {
    var mark;
    for (mark = 0; mark <= TARGET_VOLUME; mark += 10) {
      var tick = document.createElement("span");
      tick.className = mark % 50 === 0 ? "tick major" : "tick";
      tick.style.bottom = (mark / TARGET_VOLUME) * 100 + "%";
      if (mark % 50 === 0) {
        var label = document.createElement("span");
        label.textContent = String(mark);
        tick.appendChild(label);
      }
      scale.appendChild(tick);
    }
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "message" + (type ? " " + type : "");
    if (novaSpeech) {
      novaSpeech.textContent = text;
    }
    if (nova) {
      nova.classList.toggle("nova-happy", type === "success");
      nova.classList.toggle("nova-warn", type === "warn");
    }
  }

  function readMillilitres(value) {
    var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/ml$/, "");
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    return Number(cleaned);
  }

  function setPhase(id, mode) {
    var phase = document.getElementById(id);
    phase.classList.toggle("is-active", mode === "active");
    phase.classList.toggle("is-done", mode === "done");
    phase.classList.toggle("is-locked", mode === "locked");
  }

  function renderRecord() {
    var item;
    correctCount.textContent = String(state.correct);
    incorrectCount.textContent = String(state.incorrect);
    attemptLog.textContent = "";
    if (state.log.length === 0) {
      item = document.createElement("li");
      item.className = "log-empty";
      item.textContent = "Belum ada cubaan.";
      attemptLog.appendChild(item);
      return;
    }
    state.log.forEach(function (entry) {
      item = document.createElement("li");
      item.className = entry.correct ? "log-ok" : "log-bad";
      item.textContent = entry.label;
      attemptLog.appendChild(item);
    });
  }

  function recordAttempt(correct, label) {
    if (correct) {
      state.correct += 1;
    } else {
      state.incorrect += 1;
    }
    state.log.push({ correct: correct, label: label });
    renderRecord();
  }

  function missionOneComplete() {
    return state.fikirSolved && state.experimentMarked && state.buktiSolved;
  }

  var m2Complete = function () {
    return false;
  };

  var m3Complete = function () {
    return false;
  };

  var m4Complete = function () {
    return false;
  };

  function paintMapPin(button, locked, done, tick, lock) {
    var pin;
    if (!button) {
      return;
    }
    pin = button.parentElement;
    pin.classList.toggle("is-locked", locked);
    pin.classList.toggle("is-complete", done);
    pin.classList.toggle("is-active", !locked && !done);
    button.classList.toggle("is-locked", locked);
    button.classList.toggle("is-complete", done);
    button.disabled = locked;
    button.setAttribute("aria-disabled", locked ? "true" : "false");
    if (lock) {
      lock.hidden = !locked;
    }
    if (tick) {
      tick.hidden = !done;
    }
  }

  function renderMap() {
    var oneDone = missionOneComplete();
    var twoDone = m2Complete();
    var threeDone = m3Complete();
    var fourDone = m4Complete();
    paintMapPin(openMissionButton, false, oneDone, missionBadge, null);
    paintMapPin(missionTwoButton, !oneDone, twoDone, missionTwoBadge, missionTwoLock);
    paintMapPin(missionThreeButton, !twoDone, threeDone, missionThreeBadge, missionThreeLock);
    paintMapPin(missionFourButton, !threeDone, fourDone, missionFourBadge, missionFourLock);
    if (mapSpeech) {
      mapSpeech.textContent = "Hai! Saya Cikgu Khaw. Selamat datang ke Bandar Air Nexa! Pilih misi yang bercahaya untuk memulakan pengembaraan STEM kamu!";
    }
  }

  function hideEntryScreens() {
    welcomeScreen.hidden = true;
    aiDemoScreen.hidden = true;
  }

  var getM2ScreenId = function () {
    return "m2-fikir";
  };
  var getM3ScreenId = function () {
    return "m3-fikir";
  };
  var getM4ScreenId = function () {
    return "m4-fikir";
  };

  function m1ScreenId() {
    if (!state.fikirSolved) {
      return "m1-fikir";
    }
    if (state.buktiSolved) {
      return "m1-selesai";
    }
    if (state.experimentMarked || state.completed) {
      return "m1-buktikan";
    }
    return "m1-eksperimen";
  }

  function showWelcome() {
    welcomeScreen.hidden = false;
    aiDemoScreen.hidden = true;
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    enterScreen("welcome");
  }

  function showAiDemo() {
    welcomeScreen.hidden = true;
    aiDemoScreen.hidden = false;
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    enterScreen("demo");
  }

  function setupNovaEditor() {
    var NOVA_KEY = "nexa-welcome-nova";
    var NOVA_WIDTH = 44.4444;
    var NOVA_HEIGHT = 37.2917;
    var welcomeFrame = document.querySelector("#welcome-screen .welcome-frame");
    var nova = document.getElementById("welcome-nova");
    var editor = document.getElementById("nova-editor");
    var dragToggle = document.getElementById("nova-drag-toggle");
    var sizeInput = document.getElementById("nova-size");
    var visibilityButton = document.getElementById("nova-visibility");
    var note = document.getElementById("nova-editor-note");
    var novaNodes = document.querySelectorAll(".welcome-nova");
    var drag = null;
    var novaLayout = {
      left: 41.51,
      top: 32.07,
      scale: 1,
      visible: true
    };

    function defaultLayout() {
      return { left: 41.51, top: 32.07, scale: 1, visible: true };
    }

    function clampNova(layout) {
      var scale = layout.scale;
      var maxScale = Math.min(100 / NOVA_WIDTH, 100 / NOVA_HEIGHT);
      if (scale < 0.4) {
        scale = 0.4;
      }
      if (scale > maxScale) {
        scale = maxScale;
      }
      var extraX = NOVA_WIDTH * (scale - 1) / 2;
      var extraY = NOVA_HEIGHT * (scale - 1) / 2;
      var minLeft = extraX;
      var maxLeft = 100 - NOVA_WIDTH * (scale + 1) / 2;
      var minTop = extraY;
      var maxTop = 100 - NOVA_HEIGHT * (scale + 1) / 2;
      var left = layout.left;
      var top = layout.top;
      if (maxLeft < minLeft) {
        left = (100 - NOVA_WIDTH) / 2;
      } else {
        left = Math.min(maxLeft, Math.max(minLeft, left));
      }
      if (maxTop < minTop) {
        top = (100 - NOVA_HEIGHT) / 2;
      } else {
        top = Math.min(maxTop, Math.max(minTop, top));
      }
      return {
        left: left,
        top: top,
        scale: scale,
        visible: layout.visible !== false
      };
    }

    function settingsText() {
      return [
        "left: " + novaLayout.left.toFixed(2) + "%",
        "top: " + novaLayout.top.toFixed(2) + "%",
        "scale: " + novaLayout.scale.toFixed(2),
        "visible: " + (novaLayout.visible ? "true" : "false")
      ].join("\n");
    }

    function setNote(message) {
      note.textContent = message;
    }

    function syncControls() {
      sizeInput.value = String(Math.round(novaLayout.scale * 100));
      visibilityButton.textContent = novaLayout.visible ? "Sembunyi" : "Tunjuk";
      visibilityButton.setAttribute("aria-pressed", novaLayout.visible ? "true" : "false");
      visibilityButton.setAttribute("aria-label", novaLayout.visible ? "Sembunyi AI Nova" : "Tunjuk AI Nova");
      dragToggle.setAttribute("aria-pressed", nova.classList.contains("is-draggable") ? "true" : "false");
    }

    function applyNovaLayout() {
      var index;
      novaLayout = clampNova(novaLayout);
      for (index = 0; index < novaNodes.length; index += 1) {
        novaNodes[index].style.left = novaLayout.left + "%";
        novaNodes[index].style.top = novaLayout.top + "%";
        novaNodes[index].style.setProperty("--nova-scale", String(novaLayout.scale));
        novaNodes[index].classList.toggle("is-hidden", !novaLayout.visible);
      }
      syncControls();
    }

    function loadNovaLayout() {
      try {
        var raw = localStorage.getItem(NOVA_KEY);
        if (!raw) {
          return;
        }
        var data = JSON.parse(raw);
        if (typeof data.left !== "number" || typeof data.top !== "number" || typeof data.scale !== "number") {
          return;
        }
        novaLayout = clampNova({
          left: data.left,
          top: data.top,
          scale: data.scale,
          visible: data.visible !== false
        });
      } catch (error) {
        novaLayout = defaultLayout();
      }
    }

    function setEditing(enabled) {
      welcomeFrame.classList.toggle("is-editing", enabled);
      editor.hidden = !enabled;
      if (enabled) {
        nova.classList.add("is-draggable");
        setNote("Seret AI Nova untuk ubah posisi.");
      } else {
        nova.classList.remove("is-draggable");
        nova.classList.remove("is-dragging");
        drag = null;
      }
      syncControls();
    }

    function copySettings() {
      var text = settingsText();
      function fallback() {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-999px";
        document.body.appendChild(area);
        area.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (error) {
          copied = false;
        }
        document.body.removeChild(area);
        return copied;
      }
      function finish(copied) {
        setNote(copied ? "Tetapan disalin.\n" + text : text);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          finish(true);
        }, function () {
          finish(fallback());
        });
        return;
      }
      finish(fallback());
    }

    nova.addEventListener("pointerdown", function (event) {
      if (!welcomeFrame.classList.contains("is-editing") || !nova.classList.contains("is-draggable")) {
        return;
      }
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      event.preventDefault();
      var frame = welcomeFrame.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: novaLayout.left,
        top: novaLayout.top,
        frameWidth: frame.width,
        frameHeight: frame.height
      };
      nova.classList.add("is-dragging");
      nova.setPointerCapture(event.pointerId);
    });

    nova.addEventListener("pointermove", function (event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      novaLayout.left = drag.left + (event.clientX - drag.startX) / drag.frameWidth * 100;
      novaLayout.top = drag.top + (event.clientY - drag.startY) / drag.frameHeight * 100;
      applyNovaLayout();
    });

    function endDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      drag = null;
      nova.classList.remove("is-dragging");
    }

    nova.addEventListener("pointerup", endDrag);
    nova.addEventListener("pointercancel", endDrag);

    dragToggle.addEventListener("click", function () {
      nova.classList.toggle("is-draggable");
      if (!nova.classList.contains("is-draggable")) {
        nova.classList.remove("is-dragging");
        drag = null;
        setNote("Seretan dimatikan.");
      } else {
        setNote("Seret AI Nova untuk ubah posisi.");
      }
      syncControls();
    });

    sizeInput.addEventListener("input", function () {
      novaLayout.scale = Number(sizeInput.value) / 100;
      applyNovaLayout();
    });

    visibilityButton.addEventListener("click", function () {
      novaLayout.visible = !novaLayout.visible;
      applyNovaLayout();
      setNote(novaLayout.visible ? "AI Nova ditunjukkan." : "AI Nova disembunyikan.");
    });

    document.getElementById("nova-save").addEventListener("click", function () {
      try {
        localStorage.setItem(NOVA_KEY, JSON.stringify({
          left: novaLayout.left,
          top: novaLayout.top,
          scale: novaLayout.scale,
          visible: novaLayout.visible
        }));
        setNote("Disimpan.\n" + settingsText());
      } catch (error) {
        setNote("Tidak dapat disimpan dalam pelayar ini.");
      }
    });

    document.getElementById("nova-reset").addEventListener("click", function () {
      novaLayout = defaultLayout();
      try {
        localStorage.removeItem(NOVA_KEY);
      } catch (error) {
        setNote("Tetapan asal.");
      }
      applyNovaLayout();
      setNote("Tetapan asal.");
    });

    document.getElementById("nova-copy").addEventListener("click", copySettings);

    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      event.preventDefault();
      setEditing(!welcomeFrame.classList.contains("is-editing"));
    });

    loadNovaLayout();
    applyNovaLayout();
  }

  function showMap() {
    hideEntryScreens();
    mapScreen.hidden = false;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    renderMap();
    window.scrollTo(0, 0);
    enterScreen("map");
  }

  function showMission() {
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = false;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    syncM1FikirScreen();
    window.scrollTo(0, 0);
    if (state.buktiSolved) {
      showM1CompleteScreen();
    } else {
      hideM1CompleteScreen();
    }
    enterScreen(m1ScreenId());
  }

  function showMissionTwo() {
    if (!missionOneComplete()) {
      mapNote.textContent = "Selesaikan Misi 1 dahulu untuk membuka Batu Misteri.";
      return;
    }
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = false;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    enterScreen(getM2ScreenId());
  }

  function showMissionThree() {
    if (!m2Complete()) {
      mapNote.textContent = "Selesaikan Misi 2 dahulu untuk membuka Tangki Rosak.";
      return;
    }
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = false;
    missionFourScreen.hidden = true;
    window.scrollTo(0, 0);
    enterScreen(getM3ScreenId());
  }

  function showMissionFour() {
    if (!m3Complete()) {
      mapNote.textContent = "Selesaikan Misi 3 dahulu untuk membuka Bengkel Jurutera Muda.";
      return;
    }
    hideEntryScreens();
    mapScreen.hidden = true;
    missionScreen.hidden = true;
    missionTwoScreen.hidden = true;
    missionThreeScreen.hidden = true;
    missionFourScreen.hidden = false;
    window.scrollTo(0, 0);
    enterScreen(getM4ScreenId());
  }

  function renderLearning() {
    var buktiReady = state.completed || state.buktiSolved;
    var remaining = TARGET_VOLUME - state.volume;
    fikirForm.hidden = state.fikirSolved;
    hintButton.hidden = state.fikirSolved;
    eksperimenNote.hidden = !state.fikirSolved;
    if (state.fikirSolved) {
      eksperimenStatus.textContent = remaining === 0
        ? "Tangki sudah tepat 250 mL. Baca skala pada aras mata, kemudian jawab soalan Buktikan."
        : "Masih perlukan " + remaining + " mL. Pilih bekas, tekan Tuang Air, dan baca skala pada aras mata.";
    }
    buktiPanel.hidden = !buktiReady;
    buktiForm.hidden = state.buktiSolved;
    setPhase("phase-fikir", state.fikirSolved ? "done" : "active");
    setPhase("phase-eksperimen", !state.fikirSolved ? "locked" : (state.completed ? "done" : "active"));
    setPhase("phase-buktikan", !buktiReady ? "locked" : (state.buktiSolved ? "done" : "active"));
  }

  function render() {
    var percent = (state.volume / TARGET_VOLUME) * 100;
    var locked = !state.fikirSolved || state.completed || state.pouring || state.overflowHold;
    water.style.height = percent + "%";
    volumeText.textContent = state.volume + " mL";
    placeM1Water();
    document.querySelectorAll("[data-m1-pour]").forEach(function (button) {
      button.disabled = locked;
    });
    document.body.classList.toggle("completed", state.completed);
    document.body.classList.toggle("is-pouring", state.pouring);

    beakers.forEach(function (button) {
      var amount = Number(button.getAttribute("data-amount"));
      var selected = state.selected === amount;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.disabled = locked;
    });

    pourButton.disabled = locked;
    renderLearning();
    renderMap();
  }

  function finishPour(token) {
    if (token !== pourToken) {
      return;
    }
    state.pouring = false;
    if (state.volume === TARGET_VOLUME) {
      state.completed = true;
      showMessage("Tahniah! Kamu berjaya menyelamatkan tangki air!", "success");
      if (!state.experimentMarked) {
        state.experimentMarked = true;
        recordAttempt(true, "Eksperimen: tangki tepat 250 mL");
      }
      if (!state.proofPours) {
        state.proofPours = state.attemptPours.slice();
      }
      showM1Outcome("betul", function () {
        syncM1FikirScreen();
        enterScreen("m1-buktikan");
      });
    } else {
      showMessage("Tangki kini " + state.volume + " mL. Sasaran masih 250 mL.");
    }
    render();
    if (state.completed && buktiPanel && !document.getElementById("m1-sheet").hidden) {
      buktiPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function selectBeaker(amount) {
    if (!state.fikirSolved) {
      showMessage("Jawab soalan Fikir dahulu. Kira 250 − 120.", "warn");
      return;
    }
    if (state.completed || state.pouring) {
      return;
    }
    state.selected = amount;
    showMessage("Bekas " + amount + " mL dipilih. Tekan Tuang Air.");
    render();
  }

  function pour() {
    var next;
    var space;
    var token;
    var reduceMotion;

    if (!state.fikirSolved) {
      showMessage("Jawab soalan Fikir dahulu. Kira 250 − 120.", "warn");
      return;
    }
    if (state.completed || state.pouring || state.overflowHold) {
      return;
    }
    if (state.selected === null) {
      showMessage("Pilih bekas 20 mL, 50 mL atau 80 mL dahulu.", "warn");
      return;
    }

    next = state.volume + state.selected;
    if (next > TARGET_VOLUME) {
      space = TARGET_VOLUME - state.volume;
      state.overflowHold = true;
      showMessage(
        "Terlalu banyak! Ruang tinggal " + space + " mL sahaja. Air tidak dituang.",
        "warn"
      );
      cylinder.classList.remove("shake");
      void cylinder.offsetWidth;
      cylinder.classList.add("shake");
      var tankView = document.getElementById("m1-tank");
      if (tankView) {
        tankView.classList.remove("shake");
        void tankView.offsetWidth;
        tankView.classList.add("shake");
      }
      recordAttempt(false, "Eksperimen: air terlalu banyak");
      guideMemory.expOverflows += 1;
      guideMemory.pendingOverflow = true;
      guideMemory.lastOverflowBeaker = state.selected;
      render();
      showOverflowNotice(space);
      return;
    }

    pourToken += 1;
    token = pourToken;
    state.pouring = true;
    state.volume = next;
    guideMemory.pendingOverflow = false;
    state.attemptPours.push(state.selected);
    render();

    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      finishPour(token);
      return;
    }
    window.setTimeout(function () {
      finishPour(token);
    }, POUR_MS);
  }

  function reset() {
    pourToken += 1;
    state.volume = INITIAL_VOLUME;
    state.selected = null;
    state.pouring = false;
    state.completed = false;
    state.overflowHold = false;
    state.attemptPours = [];
    guideMemory.pendingOverflow = false;
    guideMemory.lastOverflowBeaker = 0;
    cylinder.classList.remove("shake");
    if (state.fikirSolved) {
      showMessage("Tangki diset semula kepada 120 mL. Pilih bekas air.");
    } else {
      showMessage("Tangki diset semula kepada 120 mL. Kira 250 − 120 dahulu.");
    }
    render();
  }

  function checkFikir(event) {
    var answer;
    event.preventDefault();
    if (state.fikirSolved) {
      return;
    }
    answer = readMillilitres(fikirInput.value);
    if (answer === null) {
      fikirFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      fikirFeedback.className = "feedback bad";
      return;
    }
    if (answer === FIKIR_ANSWER) {
      state.fikirSolved = true;
      fikirFeedback.textContent = "Betul! Kamu perlukan 130 mL lagi.";
      fikirFeedback.className = "feedback ok";
      fikirHint.hidden = true;
      recordAttempt(true, "Fikir: betul, 130 mL");
      showMessage("Betul! Kamu perlukan 130 mL lagi. Pilih bekas dan tekan Tuang Air.", "success");
      render();
      return;
    }
    fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
    fikirFeedback.className = "feedback bad";
    fikirHint.hidden = false;
    recordAttempt(false, "Fikir: salah");
    showMessage("Belum tepat. Gunakan petunjuk, kemudian cuba lagi.", "warn");
  }

  function checkBukti(event) {
    var answer;
    event.preventDefault();
    if (state.buktiSolved) {
      return;
    }
    answer = readMillilitres(buktiInput.value);
    if (answer === null) {
      buktiFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      buktiFeedback.className = "feedback bad";
      return;
    }
    if (answer === BUKTI_ANSWER) {
      state.buktiSolved = true;
      buktiFeedback.textContent = "Bagus! Kamu berjaya menjawab tanpa petunjuk.";
      buktiFeedback.className = "feedback ok";
      recordAttempt(true, "Buktikan: betul, 190 mL");
      showMessage("Bagus! Kamu boleh mengira isi padu cecair sendiri.", "success");
      render();
      narrateFeedback("selesai");
      return;
    }
    buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
    buktiFeedback.className = "feedback bad";
    recordAttempt(false, "Buktikan: salah");
    showMessage("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
    narrateFeedback("cuba");
  }

  beakers.forEach(function (button) {
    button.addEventListener("click", function () {
      selectBeaker(Number(button.getAttribute("data-amount")));
    });
  });
  pourButton.addEventListener("click", pour);
  resetButton.addEventListener("click", reset);
  fikirForm.addEventListener("submit", checkFikir);
  buktiForm.addEventListener("submit", checkBukti);
  hintButton.addEventListener("click", function () {
    if (state.fikirSolved) {
      return;
    }
    fikirHint.hidden = false;
  });
  setupMissionOnePicture();
  document.getElementById("open-ai-demo").addEventListener("click", showAiDemo);
  document.getElementById("start-play").addEventListener("click", showMap);
  document.getElementById("demo-back").addEventListener("click", showWelcome);
  setupNovaEditor();
  setupDemoGame();
  setupMissionHelp();
  setupNarrationControls();
  openMissionButton.addEventListener("click", showMission);
  backToMapButton.addEventListener("click", showMap);
  document.querySelectorAll(".mission-card.is-locked").forEach(function (button) {
    if (button.id === "open-mission-two" || button.id === "open-mission-three" || button.id === "open-mission-four") {
      return;
    }
    button.addEventListener("click", function () {
      mapNote.textContent = button.getAttribute("data-lock-message");
    });
  });
  missionTwoButton.addEventListener("click", showMissionTwo);
  backToMapTwoButton.addEventListener("click", showMap);
  missionThreeButton.addEventListener("click", showMissionThree);
  backToMapThreeButton.addEventListener("click", showMap);
  missionFourButton.addEventListener("click", showMissionFour);
  backToMapFourButton.addEventListener("click", showMap);
  setupMissionTwo();
  setupMissionThree();
  setupMissionFour();

  buildScale();
  render();
  window.requestAnimationFrame(function () {
    water.classList.add("ready");
    document.getElementById("m2-water").classList.add("ready");
    document.getElementById("m3-water").classList.add("ready");
    document.getElementById("m4-water").classList.add("ready");
  });

  function setupMissionTwo() {
  var M2_START = 120;
  var M2_FINAL = 165;
  var M2_MAX = 200;
  var M2_VOLUME_ANSWER = 45;
  var M2_BUKTI_ANSWER = 30;
  var SINK_MS = 900;

  var m2 = {
    fikirSolved: false,
    dropped: false,
    animating: false,
    seenRise: false,
    experimentSolved: false,
    buktiSolved: false,
    volume: M2_START,
    token: 0,
    correct: 0,
    incorrect: 0,
    log: [],
    moved: false
  };

  getM2ScreenId = function () {
    if (!m2.fikirSolved) {
      return "m2-fikir";
    }
    if (!m2.experimentSolved) {
      return "m2-eksperimen";
    }
    if (!m2.buktiSolved) {
      return "m2-buktikan";
    }
    return "m2-selesai";
  };

  var cylinder = document.getElementById("m2-cylinder");
  var water = document.getElementById("m2-water");
  var scale = document.getElementById("m2-scale");
  var volumeText = document.getElementById("m2-volume-text");
  var stone = document.getElementById("m2-stone");
  var message = document.getElementById("m2-message");
  var fikirFeedback = document.getElementById("m2-fikir-feedback");
  var fikirHint = document.getElementById("m2-fikir-hint");
  var hintButton = document.getElementById("m2-hint-button");
  var eksperimenNote = document.getElementById("m2-eksperimen-note");
  var eksperimenStatus = document.getElementById("m2-eksperimen-status");
  var calcPanel = document.getElementById("m2-calc-panel");
  var calcForm = document.getElementById("m2-calc-form");
  var calcInput = document.getElementById("m2-calc-input");
  var calcFeedback = document.getElementById("m2-calc-feedback");
  var calcHint = document.getElementById("m2-calc-hint");
  var calcHintButton = document.getElementById("m2-calc-hint-button");
  var buktiPanel = document.getElementById("m2-bukti-panel");
  var buktiForm = document.getElementById("m2-bukti-form");
  var buktiInput = document.getElementById("m2-bukti-input");
  var buktiFeedback = document.getElementById("m2-bukti-feedback");
  var correctCount = document.getElementById("m2-correct-count");
  var incorrectCount = document.getElementById("m2-incorrect-count");
  var attemptLog = document.getElementById("m2-attempt-log");
  var predictButtons = document.querySelectorAll(".predict");
  var drag = { active: false, x: 0, y: 0, moved: false };

  m2Complete = function () {
    return m2.fikirSolved && m2.experimentSolved && m2.buktiSolved;
  };

  function readAmount(value) {
    var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/cm³|cm3|ml/g, "");
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    return Number(cleaned);
  }

  function showM2Message(text, type) {
    message.textContent = text;
    message.className = "message" + (type ? " " + type : "");
  }

  function recordM2(correct, label) {
    if (correct) {
      m2.correct += 1;
    } else {
      m2.incorrect += 1;
    }
    m2.log.push({ correct: correct, label: label });
    correctCount.textContent = String(m2.correct);
    incorrectCount.textContent = String(m2.incorrect);
    attemptLog.textContent = "";
    m2.log.forEach(function (entry) {
      var item = document.createElement("li");
      item.className = entry.correct ? "log-ok" : "log-bad";
      item.textContent = entry.label;
      attemptLog.appendChild(item);
    });
    renderMap();
  }

  function renderM2() {
    water.style.height = (m2.volume / M2_MAX) * 100 + "%";
    volumeText.textContent = m2.volume + " mL";
    cylinder.classList.toggle("sunk", m2.dropped);
    stone.classList.toggle("is-used", m2.dropped);
    stone.disabled = m2.animating;
    hintButton.hidden = m2.fikirSolved;
    eksperimenNote.hidden = !m2.fikirSolved;
    calcPanel.hidden = !m2.seenRise;
    calcForm.hidden = m2.experimentSolved;
    calcHintButton.hidden = m2.experimentSolved;
    buktiPanel.hidden = !m2.experimentSolved;
    buktiForm.hidden = m2.buktiSolved;
    predictButtons.forEach(function (button) {
      button.disabled = m2.fikirSolved;
      button.classList.toggle("selected", m2.fikirSolved && button.getAttribute("data-predict") === "naik");
    });
    if (m2.fikirSolved && !m2.seenRise) {
      eksperimenStatus.textContent = "Silinder ada 120 mL air. Tekan batu, atau seret batu ke dalam silinder.";
    } else if (m2.seenRise && !m2.experimentSolved) {
      eksperimenStatus.textContent = "Aras air kini 165 mL. Kira isi padu batu: 165 − 120.";
    } else if (m2.experimentSolved) {
      eksperimenStatus.textContent = "Isi padu batu dalam eksperimen ialah 45 cm³. Jawab soalan Buktikan sendiri.";
    }
    setPhase("m2-phase-fikir", m2.fikirSolved ? "done" : "active");
    setPhase("m2-phase-eksperimen", !m2.fikirSolved ? "locked" : (m2.experimentSolved ? "done" : "active"));
    setPhase("m2-phase-buktikan", !m2.experimentSolved ? "locked" : (m2.buktiSolved ? "done" : "active"));
  }

  function buildM2Scale() {
    var mark;
    for (mark = 0; mark <= M2_MAX; mark += 10) {
      var tick = document.createElement("span");
      tick.className = mark % 50 === 0 ? "tick major" : "tick";
      tick.style.bottom = (mark / M2_MAX) * 100 + "%";
      if (mark % 50 === 0) {
        var label = document.createElement("span");
        label.textContent = String(mark);
        tick.appendChild(label);
      }
      scale.appendChild(tick);
    }
  }

  function choosePrediction(choice) {
    if (m2.fikirSolved) {
      return;
    }
    if (choice === "naik") {
      m2.fikirSolved = true;
      fikirFeedback.textContent = "Betul! Aras air naik kerana batu mengambil ruang.";
      fikirFeedback.className = "feedback ok";
      fikirHint.hidden = true;
      recordM2(true, "Fikir: betul, aras naik");
      showM2Message("Betul! Sekarang masukkan batu ke dalam air.", "success");
      renderM2();
      enterScreen("m2-eksperimen");
      return;
    }
    fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
    fikirFeedback.className = "feedback bad";
    fikirHint.hidden = false;
    recordM2(false, "Fikir: salah");
    showM2Message("Belum tepat. Fikir tentang ruang yang diambil batu.", "warn");
    narrateFeedback("cuba");
  }

  function submergeStone() {
    var token;
    var reduceMotion;
    if (!m2.fikirSolved || m2.dropped || m2.animating) {
      if (!m2.fikirSolved) {
        showM2Message("Jawab soalan Fikir dahulu. Adakah aras air naik?", "warn");
      }
      return;
    }
    m2.token += 1;
    token = m2.token;
    m2.animating = true;
    m2.dropped = true;
    m2.volume = M2_FINAL;
    stone.style.transform = "";
    showM2Message("Perhatikan batu tenggelam dan aras air naik.");
    renderM2();
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(function () {
      if (token !== m2.token) {
        return;
      }
      m2.animating = false;
      m2.seenRise = true;
      showM2Message("Aras air kini 165 mL. Kira 165 − 120.");
      renderM2();
      calcPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    }, reduceMotion ? 0 : SINK_MS);
  }

  function resetM2() {
    m2.token += 1;
    m2.dropped = false;
    m2.animating = false;
    m2.volume = M2_START;
    if (!m2.experimentSolved) {
      m2.seenRise = false;
      calcFeedback.textContent = "";
      calcInput.value = "";
    }
    stone.style.transform = "";
    showM2Message(m2.fikirSolved
      ? "Eksperimen diset semula. Air kembali ke 120 mL."
      : "Air kembali ke 120 mL. Ramalkan dahulu.");
    renderM2();
  }

  function checkCalc(event) {
    var answer;
    event.preventDefault();
    if (!m2.seenRise || m2.experimentSolved) {
      return;
    }
    answer = readAmount(calcInput.value);
    if (answer === null) {
      calcFeedback.textContent = "Tulis nombor dalam cm³ dahulu.";
      calcFeedback.className = "feedback bad";
      return;
    }
    if (answer === M2_VOLUME_ANSWER) {
      m2.experimentSolved = true;
      calcFeedback.textContent = "Betul! Isi padu batu ialah 45 cm³.";
      calcFeedback.className = "feedback ok";
      calcHint.hidden = true;
      recordM2(true, "Eksperimen: betul, 45 cm³");
      showM2Message("Betul! 165 − 120 = 45. Isi padu batu ialah 45 cm³.", "success");
      renderM2();
      enterScreen("m2-buktikan");
      return;
    }
    calcFeedback.textContent = "Belum tepat. Cuba lagi.";
    calcFeedback.className = "feedback bad";
    calcHint.hidden = false;
    recordM2(false, "Eksperimen: salah");
    showM2Message("Belum tepat. Gunakan petunjuk, kemudian cuba lagi.", "warn");
    narrateFeedback("cuba");
  }

  function checkM2Bukti(event) {
    var answer;
    event.preventDefault();
    if (!m2.experimentSolved || m2.buktiSolved) {
      return;
    }
    answer = readAmount(buktiInput.value);
    if (answer === null) {
      buktiFeedback.textContent = "Tulis nombor dalam cm³ dahulu.";
      buktiFeedback.className = "feedback bad";
      return;
    }
    if (answer === M2_BUKTI_ANSWER) {
      m2.buktiSolved = true;
      buktiFeedback.textContent = "Bagus! Isi padu batu ialah 30 cm³.";
      buktiFeedback.className = "feedback ok";
      recordM2(true, "Buktikan: betul, 30 cm³");
      showM2Message("Bagus! Kamu mengira isi padu batu tanpa petunjuk.", "success");
      renderM2();
      narrateFeedback("selesai");
      document.getElementById("m2-bukti-panel").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
    buktiFeedback.className = "feedback bad";
    recordM2(false, "Buktikan: salah");
    showM2Message("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
    narrateFeedback("cuba");
  }

  function pointerDown(event) {
    if (!m2.fikirSolved || m2.dropped || m2.animating) {
      return;
    }
    drag.active = true;
    drag.moved = false;
    drag.x = event.clientX;
    drag.y = event.clientY;
    stone.setPointerCapture(event.pointerId);
    stone.classList.add("is-dragging");
  }

  function pointerMove(event) {
    var dx;
    var dy;
    if (!drag.active) {
      return;
    }
    dx = event.clientX - drag.x;
    dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 8) {
      drag.moved = true;
    }
    stone.style.transform = "translate(" + dx + "px, " + dy + "px)";
  }

  function pointerUp() {
    var stoneRect;
    var zone;
    var hit;
    if (!drag.active) {
      return;
    }
    drag.active = false;
    stone.classList.remove("is-dragging");
    stoneRect = stone.getBoundingClientRect();
    zone = cylinder.getBoundingClientRect();
    hit = stoneRect.right > zone.left && stoneRect.left < zone.right && stoneRect.bottom > zone.top && stoneRect.top < zone.bottom;
    stone.style.transform = "";
    m2.moved = drag.moved;
    if (hit || !drag.moved) {
      submergeStone();
    }
  }

  predictButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      choosePrediction(button.getAttribute("data-predict"));
    });
  });
  hintButton.addEventListener("click", function () {
    if (!m2.fikirSolved) {
      fikirHint.hidden = false;
    }
  });
  calcHintButton.addEventListener("click", function () {
    if (!m2.experimentSolved) {
      calcHint.hidden = false;
    }
  });
  calcForm.addEventListener("submit", checkCalc);
  buktiForm.addEventListener("submit", checkM2Bukti);
  document.getElementById("m2-reset").addEventListener("click", resetM2);
  stone.addEventListener("pointerdown", pointerDown);
  stone.addEventListener("pointermove", pointerMove);
  stone.addEventListener("pointerup", pointerUp);
  stone.addEventListener("pointercancel", pointerUp);
  stone.addEventListener("click", function () {
    if (m2.moved) {
      m2.moved = false;
      return;
    }
    submergeStone();
  });

  buildM2Scale();
  renderM2();
  }

  function setupMissionThree() {
  var M3_START = 700;
  var M3_AFTER_LEAK = 600;
  var M3_TARGET = 1000;
  var M3_MAX = 1000;
  var M3_ADD = 400;
  var M3_FIKIR = 1000;
  var M3_BUKTI = 300;
  var MOVE_MS = 900;

  var m3 = {
    fikirSolved: false,
    valveClosed: false,
    animating: false,
    seenLevel: false,
    calcSolved: false,
    transferred: false,
    experimentSolved: false,
    buktiSolved: false,
    volume: M3_START,
    token: 0,
    correct: 0,
    incorrect: 0,
    log: []
  };

  getM3ScreenId = function () {
    if (!m3.fikirSolved) {
      return "m3-fikir";
    }
    if (!m3.experimentSolved) {
      return "m3-eksperimen";
    }
    if (!m3.buktiSolved) {
      return "m3-buktikan";
    }
    return "m3-selesai";
  };

  var tank = document.getElementById("m3-tank");
  var water = document.getElementById("m3-water");
  var scale = document.getElementById("m3-scale");
  var volumeText = document.getElementById("m3-volume-text");
  var valveButton = document.getElementById("m3-valve");
  var transferButton = document.getElementById("m3-transfer");
  var message = document.getElementById("m3-message");
  var fikirForm = document.getElementById("m3-fikir-form");
  var fikirInput = document.getElementById("m3-fikir-input");
  var fikirFeedback = document.getElementById("m3-fikir-feedback");
  var fikirHint = document.getElementById("m3-fikir-hint");
  var hintButton = document.getElementById("m3-hint-button");
  var eksperimenNote = document.getElementById("m3-eksperimen-note");
  var eksperimenStatus = document.getElementById("m3-eksperimen-status");
  var calcPanel = document.getElementById("m3-calc-panel");
  var calcForm = document.getElementById("m3-calc-form");
  var calcInput = document.getElementById("m3-calc-input");
  var calcFeedback = document.getElementById("m3-calc-feedback");
  var calcHint = document.getElementById("m3-calc-hint");
  var calcHintButton = document.getElementById("m3-calc-hint-button");
  var buktiPanel = document.getElementById("m3-bukti-panel");
  var buktiForm = document.getElementById("m3-bukti-form");
  var buktiInput = document.getElementById("m3-bukti-input");
  var buktiFeedback = document.getElementById("m3-bukti-feedback");
  var correctCount = document.getElementById("m3-correct-count");
  var incorrectCount = document.getElementById("m3-incorrect-count");
  var attemptLog = document.getElementById("m3-attempt-log");

  m3Complete = function () {
    return m3.fikirSolved && m3.experimentSolved && m3.buktiSolved;
  };

  function readAmount(value) {
    var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/ml/g, "");
    if (!/^\d+$/.test(cleaned)) {
      return null;
    }
    return Number(cleaned);
  }

  function showM3Message(text, type) {
    message.textContent = text;
    message.className = "message" + (type ? " " + type : "");
  }

  function recordM3(correct, label) {
    if (correct) {
      m3.correct += 1;
    } else {
      m3.incorrect += 1;
    }
    m3.log.push({ correct: correct, label: label });
    correctCount.textContent = String(m3.correct);
    incorrectCount.textContent = String(m3.incorrect);
    attemptLog.textContent = "";
    m3.log.forEach(function (entry) {
      var item = document.createElement("li");
      item.className = entry.correct ? "log-ok" : "log-bad";
      item.textContent = entry.label;
      attemptLog.appendChild(item);
    });
    renderMap();
  }

  function renderM3() {
    water.style.height = (m3.volume / M3_MAX) * 100 + "%";
    volumeText.textContent = m3.volume + " mL";
    tank.classList.toggle("is-leaking", m3.fikirSolved && !m3.valveClosed && !m3.animating);
    valveButton.disabled = !m3.fikirSolved || m3.valveClosed || m3.animating;
    transferButton.disabled = !m3.calcSolved || m3.transferred || m3.animating || !m3.valveClosed;
    transferButton.classList.toggle("is-empty", m3.transferred);
    fikirForm.hidden = m3.fikirSolved;
    hintButton.hidden = m3.fikirSolved;
    eksperimenNote.hidden = !m3.fikirSolved;
    calcPanel.hidden = !m3.seenLevel;
    calcForm.hidden = m3.calcSolved;
    calcHintButton.hidden = m3.calcSolved;
    buktiPanel.hidden = !m3.experimentSolved;
    buktiForm.hidden = m3.buktiSolved;
    if (!m3.fikirSolved) {
      eksperimenStatus.textContent = "Tangki ada 700 mL dan bocor tepat 100 mL. Tekan Tutup injap.";
    } else if (!m3.valveClosed) {
      eksperimenStatus.textContent = "Tangki ada 700 mL. Bocoran ini tepat 100 mL. Tekan Tutup injap.";
    } else if (!m3.calcSolved) {
      eksperimenStatus.textContent = "Injap sudah ditutup. Air tinggal 600 mL. Kira 1000 − 600.";
    } else if (!m3.transferred) {
      eksperimenStatus.textContent = "Kamu perlukan 400 mL. Pindah air dari bekas simpanan.";
    } else {
      eksperimenStatus.textContent = "Tangki kini 1000 mL. Jawab soalan Buktikan sendiri.";
    }
    setPhase("m3-phase-fikir", m3.fikirSolved ? "done" : "active");
    setPhase("m3-phase-eksperimen", !m3.fikirSolved ? "locked" : (m3.experimentSolved ? "done" : "active"));
    setPhase("m3-phase-buktikan", !m3.experimentSolved ? "locked" : (m3.buktiSolved ? "done" : "active"));
  }

  function buildM3Scale() {
    var mark;
    for (mark = 0; mark <= M3_MAX; mark += 50) {
      var tick = document.createElement("span");
      tick.className = mark % 200 === 0 ? "tick major" : "tick";
      tick.style.bottom = (mark / M3_MAX) * 100 + "%";
      if (mark % 200 === 0) {
        var label = document.createElement("span");
        label.textContent = String(mark);
        tick.appendChild(label);
      }
      scale.appendChild(tick);
    }
  }

  function waitMotion(token, done) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(function () {
      if (token !== m3.token) {
        return;
      }
      done();
    }, reduceMotion ? 0 : MOVE_MS);
  }

  function checkM3Fikir(event) {
    var answer;
    event.preventDefault();
    if (m3.fikirSolved) {
      return;
    }
    answer = readAmount(fikirInput.value);
    if (answer === null) {
      fikirFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      fikirFeedback.className = "feedback bad";
      return;
    }
    if (answer === M3_FIKIR) {
      m3.fikirSolved = true;
      fikirFeedback.textContent = "Betul! 1 L = 1000 mL.";
      fikirFeedback.className = "feedback ok";
      fikirHint.hidden = true;
      recordM3(true, "Fikir: betul, 1000 mL");
      showM3Message("Betul! Sekarang tutup injap tangki yang bocor.", "success");
      renderM3();
      enterScreen("m3-eksperimen");
      return;
    }
    fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
    fikirFeedback.className = "feedback bad";
    fikirHint.hidden = false;
    recordM3(false, "Fikir: salah");
    showM3Message("Belum tepat. Fikir tentang 1 liter.", "warn");
    narrateFeedback("cuba");
  }

  function closeValve() {
    var token;
    if (!m3.fikirSolved || m3.valveClosed || m3.animating) {
      if (!m3.fikirSolved) {
        showM3Message("Jawab soalan Fikir dahulu. 1 L sama dengan berapa mL?", "warn");
      }
      return;
    }
    m3.token += 1;
    token = m3.token;
    m3.animating = true;
    m3.valveClosed = true;
    m3.volume = M3_AFTER_LEAK;
    showM3Message("Injap ditutup. Air bocor tepat 100 mL.");
    renderM3();
    waitMotion(token, function () {
      m3.animating = false;
      m3.seenLevel = true;
      showM3Message("Air tinggal 600 mL. Kira 1000 − 600.");
      renderM3();
      if (!m3.calcSolved) {
        calcPanel.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function checkM3Calc(event) {
    var answer;
    event.preventDefault();
    if (!m3.seenLevel || m3.calcSolved) {
      return;
    }
    answer = readAmount(calcInput.value);
    if (answer === null) {
      calcFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      calcFeedback.className = "feedback bad";
      return;
    }
    if (answer === M3_ADD) {
      m3.calcSolved = true;
      calcFeedback.textContent = "Betul! Kamu perlukan 400 mL.";
      calcFeedback.className = "feedback ok";
      calcHint.hidden = true;
      recordM3(true, "Eksperimen: betul, perlu 400 mL");
      showM3Message("Betul! Tekan butang untuk pindah 400 mL.", "success");
      renderM3();
      narrateFeedback("betul");
      return;
    }
    calcFeedback.textContent = "Belum tepat. Cuba lagi.";
    calcFeedback.className = "feedback bad";
    calcHint.hidden = false;
    recordM3(false, "Eksperimen: salah");
    showM3Message("Belum tepat. Gunakan petunjuk, kemudian cuba lagi.", "warn");
    narrateFeedback("cuba");
  }

  function transferWater() {
    var token;
    if (!m3.calcSolved || !m3.valveClosed || m3.transferred || m3.animating) {
      if (!m3.calcSolved) {
        showM3Message("Kira dahulu berapa mL perlu ditambah.", "warn");
      }
      return;
    }
    m3.token += 1;
    token = m3.token;
    m3.animating = true;
    m3.transferred = true;
    m3.volume = M3_TARGET;
    showM3Message("Air simpanan sedang dipindahkan.");
    renderM3();
    waitMotion(token, function () {
      m3.animating = false;
      if (!m3.experimentSolved) {
        m3.experimentSolved = true;
        recordM3(true, "Eksperimen: tangki tepat 1000 mL");
      }
      showM3Message("Tangki kini 1000 mL. 600 + 400 = 1000.", "success");
      renderM3();
      enterScreen("m3-buktikan");
    });
  }

  function resetM3() {
    m3.token += 1;
    m3.volume = M3_START;
    m3.valveClosed = false;
    m3.animating = false;
    m3.transferred = false;
    m3.seenLevel = false;
    if (!m3.calcSolved) {
      calcFeedback.textContent = "";
      calcInput.value = "";
    }
    showM3Message(m3.fikirSolved
      ? "Eksperimen diset semula. Tangki kembali ke 700 mL."
      : "Tangki kembali ke 700 mL. Kira 1 L dahulu.");
    renderM3();
  }

  function checkM3Bukti(event) {
    var answer;
    event.preventDefault();
    if (!m3.experimentSolved || m3.buktiSolved) {
      return;
    }
    answer = readAmount(buktiInput.value);
    if (answer === null) {
      buktiFeedback.textContent = "Tulis nombor dalam mL dahulu.";
      buktiFeedback.className = "feedback bad";
      return;
    }
    if (answer === M3_BUKTI) {
      m3.buktiSolved = true;
      buktiFeedback.textContent = "Bagus! Air yang perlu ditambah ialah 300 mL.";
      buktiFeedback.className = "feedback ok";
      recordM3(true, "Buktikan: betul, 300 mL");
      showM3Message("Bagus! Kamu mengira air yang perlu ditambah tanpa petunjuk.", "success");
      renderM3();
      narrateFeedback("selesai");
      return;
    }
    buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
    buktiFeedback.className = "feedback bad";
    recordM3(false, "Buktikan: salah");
    showM3Message("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
    narrateFeedback("cuba");
  }

  fikirForm.addEventListener("submit", checkM3Fikir);
  hintButton.addEventListener("click", function () {
    if (!m3.fikirSolved) {
      fikirHint.hidden = false;
    }
  });
  valveButton.addEventListener("click", closeValve);
  calcForm.addEventListener("submit", checkM3Calc);
  calcHintButton.addEventListener("click", function () {
    if (!m3.calcSolved) {
      calcHint.hidden = false;
    }
  });
  transferButton.addEventListener("click", transferWater);
  document.getElementById("m3-reset").addEventListener("click", resetM3);
  buktiForm.addEventListener("submit", checkM3Bukti);

  buildM3Scale();
  renderM3();
  }

  var m1WaterPlaced = false;

  function cloneM1TankDebug() {
    return {
      x: M1_TANK_DEBUG.x,
      y: M1_TANK_DEBUG.y,
      width: M1_TANK_DEBUG.width,
      height: M1_TANK_DEBUG.height,
      borderRadius: M1_TANK_DEBUG.borderRadius,
      clipInset: M1_TANK_DEBUG.clipInset,
      labelX: M1_TANK_DEBUG.labelX,
      labelY: M1_TANK_DEBUG.labelY,
      labelFollow: M1_TANK_DEBUG.labelFollow
    };
  }

  function loadM1TankLayout() {
    var raw;
    var data;
    var keys;
    var index;
    m1TankLayout = cloneM1TankDebug();
    try {
      raw = localStorage.getItem("nexa-m1-tank-debug");
      if (!raw) {
        return;
      }
      data = JSON.parse(raw);
      keys = ["x", "y", "width", "height", "clipInset"];
      for (index = 0; index < keys.length; index += 1) {
        if (typeof data[keys[index]] === "number" && isFinite(data[keys[index]])) {
          m1TankLayout[keys[index]] = data[keys[index]];
        }
      }
      if (typeof data.labelFollow === "boolean") {
        m1TankLayout.labelFollow = data.labelFollow;
      }
      if (data.cylinder === true) {
        if (typeof data.borderRadius === "number" && isFinite(data.borderRadius)) {
          m1TankLayout.borderRadius = data.borderRadius;
        }
        if (typeof data.labelX === "number" && isFinite(data.labelX)) {
          m1TankLayout.labelX = data.labelX;
        }
        if (typeof data.labelY === "number" && isFinite(data.labelY)) {
          m1TankLayout.labelY = data.labelY;
        }
      }
      if (m1TankLayout.borderRadius > 18) {
        m1TankLayout.borderRadius = 8;
      }
    } catch (error) {
      m1TankLayout = cloneM1TankDebug();
    }
  }

  function placeM1Water() {
    var box = document.getElementById("m1-water-box");
    var clip = document.getElementById("m1-water-clip");
    var fill = document.getElementById("m1-water-fill");
    var label = document.getElementById("m1-live-volume");
    var layout;
    var level;
    var animate;
    var bottom;
    var labelTop;
    if (!box || !clip || !fill || !label) {
      return;
    }
    if (!m1TankLayout) {
      loadM1TankLayout();
    }
    layout = m1TankLayout;
    level = state.volume / TARGET_VOLUME;
    bottom = layout.borderRadius;
    if (bottom < 0) {
      bottom = 0;
    }
    if (bottom > 18) {
      bottom = 18;
    }
    animate = m1WaterPlaced && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.style.left = layout.x + "%";
    box.style.top = layout.y + "%";
    box.style.width = layout.width + "%";
    box.style.height = layout.height + "%";
    box.style.borderRadius = "0 0 " + bottom + "% " + bottom + "%";
    clip.style.top = layout.clipInset + "%";
    clip.style.right = layout.clipInset + "%";
    clip.style.bottom = layout.clipInset + "%";
    clip.style.left = layout.clipInset + "%";
    clip.style.borderRadius = "0 0 " + Math.max(0, bottom - layout.clipInset) + "% " + Math.max(0, bottom - layout.clipInset) + "%";
    fill.style.borderRadius = "0";
    fill.style.transition = animate ? "height 800ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
    fill.style.height = (level * 100) + "%";
    label.style.left = layout.labelX + "%";
    if (layout.labelFollow) {
      labelTop = ((1 - level) * 100) + layout.labelY;
    } else {
      labelTop = layout.labelY;
    }
    label.style.top = labelTop + "%";
    label.textContent = state.volume + " mL";
    m1WaterPlaced = true;
  }

  function clearGuideChrome(prefix) {
    var note = document.getElementById(prefix + "-guide-note");
    var taps = document.getElementById(prefix + "-guide-taps");
    var ai = document.getElementById(prefix + "-guide-ai");
    if (note) {
      note.hidden = true;
      note.textContent = "";
    }
    if (taps) {
      taps.hidden = true;
      taps.textContent = "";
    }
    if (ai) {
      ai.hidden = true;
      ai.textContent = "";
    }
  }

  function showM1Dialog(heading, message, showNext, closeLabel, nextLabel) {
    clearGuideChrome("m1");
    var dialog = document.getElementById("m1-dialog");
    var title = document.getElementById("m1-dialog-title");
    var text = document.getElementById("m1-dialog-text");
    var closeButton = document.getElementById("m1-dialog-close");
    var nextButton = document.getElementById("m1-dialog-next");
    if (!dialog) {
      return;
    }
    dialog.removeAttribute("data-m1-action");
    title.textContent = heading;
    text.textContent = message;
    nextButton.hidden = !showNext;
    if (showNext) {
      nextButton.textContent = nextLabel || "Teruskan ke Eksperimen";
      if (nextLabel === "Peta Kota Air") {
        nextButton.setAttribute("data-next", "map");
      } else if (nextLabel === "Teruskan ke Buktikan") {
        nextButton.setAttribute("data-next", "bukti");
      } else {
        nextButton.setAttribute("data-next", "eksperimen");
      }
    }
    closeButton.textContent = closeLabel || (showNext ? "Tutup" : "Cuba lagi");
    dialog.hidden = false;
  }

  var m1OutcomeOpen = false;
  var m1OutcomeToken = 0;

  function showOverflowNotice(space) {
    var dialog = document.getElementById("m1-dialog");
    showM1Dialog(
      "Terlalu banyak air!",
      "Terlalu banyak! Ruang tinggal " + space + " mL sahaja. Air tidak dituang.",
      false,
      "FAHAM"
    );
    if (dialog) {
      dialog.setAttribute("data-m1-action", "overflow");
    }
    speakNow("Air terlalu banyak. Jom cuba sekali lagi!", true);
  }

  function showPortraitFeedback(layerId, artId, line, onDone) {
    var layer = document.getElementById(layerId);
    var art = document.getElementById(artId);
    var token;
    var started;
    var finished = false;
    var timer = 0;
    var maxWait = narrationMuted || !window.speechSynthesis ? 1800 : Math.min(11000, 2200 + line.length * 75);
    if (m1OutcomeOpen) {
      return;
    }
    if (!layer || !art) {
      if (onDone) {
        onDone();
      }
      return;
    }
    m1OutcomeOpen = true;
    m1OutcomeToken += 1;
    token = m1OutcomeToken;
    started = Date.now();
    document.getElementById("m1-dialog").hidden = true;
    document.getElementById("demo-dialog").hidden = true;
    art.src = line.indexOf("Belum tepat") === 0 ? "assets/screens/feedback/cuba_lagi.png" : "assets/screens/feedback/betul.png";
    art.alt = line.indexOf("Belum tepat") === 0 ? "Cuba lagi. Jawapan belum tepat." : "Betul. Jawapan anda tepat.";
    layer.hidden = false;
    function finish() {
      var wait;
      if (finished || token !== m1OutcomeToken) {
        return;
      }
      wait = 1400 - (Date.now() - started);
      if (wait > 0) {
        window.clearTimeout(timer);
        timer = window.setTimeout(finish, wait);
        return;
      }
      finished = true;
      m1OutcomeOpen = false;
      window.clearTimeout(timer);
      layer.hidden = true;
      if (onDone) {
        onDone();
      }
    }
    timer = window.setTimeout(finish, maxWait);
    if (narrationMuted || !window.speechSynthesis) {
      stopNarration();
      return;
    }
    speakNow(line, true, function () {
      if (token !== m1OutcomeToken) {
        return;
      }
      finish();
    });
  }

  function showM1Outcome(kind, onDone) {
    var line = kind === "betul"
      ? "Betul! Syabas! Kamu berjaya!"
      : "Belum tepat. Tidak mengapa. Tekan butang BANTU AI jika kamu memerlukan bantuan.";
    showPortraitFeedback("m1-feedback", "m1-feedback-art", line, onDone);
  }

  function showDemoOutcome(kind, onDone) {
    var line = kind === "betul"
      ? "Betul! Syabas! Kamu berjaya!"
      : "Belum tepat. Tidak mengapa. Tekan butang BANTU AI jika kamu memerlukan bantuan.";
    showPortraitFeedback("demo-feedback", "demo-feedback-art", line, onDone);
  }

  function hideM1CompleteScreen() {
    var reward = document.getElementById("m1-reward");
    if (reward) {
      reward.hidden = true;
    }
  }

  function showM1CompleteScreen() {
    var reward = document.getElementById("m1-reward");
    document.getElementById("m1-dialog").hidden = true;
    document.getElementById("m1-feedback").hidden = true;
    if (reward) {
      reward.hidden = false;
    }
  }

  function syncM1FikirScreen() {
    var stage = "fikir";
    var sheet = document.getElementById("m1-sheet");
    var art = document.getElementById("m1-art");
    var tank = document.getElementById("m1-tank");
    if (state.fikirSolved && (state.buktiSolved || state.experimentMarked || state.completed)) {
      stage = "bukti";
    } else if (state.fikirSolved) {
      stage = "eksperimen";
    }
    if (sheet) {
      sheet.hidden = true;
    }
    document.querySelectorAll(".m1-fikir-only").forEach(function (button) {
      button.hidden = stage !== "fikir";
    });
    document.querySelectorAll(".m1-exp-only").forEach(function (button) {
      button.hidden = stage !== "eksperimen";
    });
    document.querySelectorAll(".m1-bukti-only").forEach(function (button) {
      button.hidden = stage !== "bukti";
    });
    if (art) {
      if (stage === "bukti") {
        art.src = "assets/screens/m1/m1_buktikan.png";
        art.alt = "Misi 1 Buktikan. Pilih pengiraan yang membuktikan paras akhir 250 mL.";
      } else if (stage === "eksperimen") {
        art.src = "assets/screens/m1/m1_eksperimen.png";
        art.alt = "Misi 1 Eksperimen. Paras awal 120 mL. Isi sehingga 250 mL.";
      } else {
        art.src = "assets/screens/m1/m1_fikir.png";
        art.alt = "Misi 1 Fikir. Tangki ada 120 mL. Sasaran 250 mL.";
      }
    }
    if (tank) {
      tank.hidden = stage !== "eksperimen";
    }
    placeM1Water();
  }

  function setupMissionOnePicture() {
    var dialog = document.getElementById("m1-dialog");
    var closeButton = document.getElementById("m1-dialog-close");
    var nextButton = document.getElementById("m1-dialog-next");

    document.querySelectorAll("[data-m1-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        var submitEvent;
        var wasSolved = state.fikirSolved;
        novaLast.fikir = button.getAttribute("data-m1-choice");
        if (m1OutcomeOpen || wasSolved) {
          return;
        }
        fikirInput.value = button.getAttribute("data-m1-choice");
        submitEvent = new Event("submit", { cancelable: true, bubbles: true });
        fikirForm.dispatchEvent(submitEvent);
        if (state.fikirSolved) {
          showM1Outcome("betul", function () {
            syncM1FikirScreen();
            enterScreen("m1-eksperimen");
          });
          return;
        }
        guideMemory.fikirFails += 1;
        guideMemory.lastFikirWrong = novaLast.fikir;
        showM1Outcome("cuba", function () {
          return;
        });
      });
    });

    document.getElementById("m1-dengar").addEventListener("click", function () {
      replayCurrentInstruction();
    });
    document.getElementById("m1-bantu").addEventListener("click", function () {
      openGuidedHelp("m1-fikir");
    });
    closeButton.addEventListener("click", function () {
      var overflow = dialog.getAttribute("data-m1-action") === "overflow";
      dialog.hidden = true;
      dialog.removeAttribute("data-m1-action");
      if (overflow) {
        state.overflowHold = false;
        reset();
      }
    });
    nextButton.addEventListener("click", function () {
      var next = nextButton.getAttribute("data-next");
      dialog.hidden = true;
      if (next === "map") {
        showMap();
        return;
      }
      if (next === "bukti") {
        syncM1FikirScreen();
        enterScreen("m1-buktikan");
        return;
      }
      syncM1FikirScreen();
      enterScreen("m1-eksperimen");
    });
    document.querySelectorAll("[data-m1-pour]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.disabled || state.pouring || state.completed || state.overflowHold || m1OutcomeOpen) {
          return;
        }
        state.selected = Number(button.getAttribute("data-m1-pour"));
        pour();
      });
    });
    document.getElementById("m1-exp-reset").addEventListener("click", reset);
    document.getElementById("m1-exp-dengar").addEventListener("click", function () {
      replayCurrentInstruction();
    });
    document.getElementById("m1-exp-bantu").addEventListener("click", function () {
      openGuidedHelp("m1-eksperimen");
    });
    document.querySelectorAll("[data-m1-proof]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (m1OutcomeOpen) {
          return;
        }
        if (document.getElementById("mission-one").querySelector(".mission-frame").classList.contains("is-proof-editing")) {
          return;
        }
        novaLast.proof = button.getAttribute("data-m1-proof");
        if (!(state.experimentMarked || state.completed)) {
          return;
        }
        if (state.buktiSolved) {
          if (button.getAttribute("data-m1-proof") === "120+130=250") {
            showM1Outcome("betul", function () {
              showM1CompleteScreen();
              enterScreen("m1-selesai");
            });
          }
          return;
        }
        if (button.getAttribute("data-m1-proof") !== "120+130=250") {
          guideMemory.buktiFails += 1;
          guideMemory.lastBuktiWrong = novaLast.proof;
          recordAttempt(false, "Buktikan: salah");
          showM1Outcome("cuba", function () {
            return;
          });
          return;
        }
        state.buktiSolved = true;
        recordAttempt(true, "Buktikan: betul, 120 + 130 = 250 mL");
        render();
        showM1Outcome("betul", function () {
          showM1CompleteScreen();
          enterScreen("m1-selesai");
        });
      });
    });
    document.getElementById("m1-bukti-dengar").addEventListener("click", function () {
      replayCurrentInstruction();
    });
    document.getElementById("m1-bukti-bantu").addEventListener("click", function () {
      openGuidedHelp("m1-buktikan");
    });
    document.getElementById("m1-guide-taps").addEventListener("click", function (event) {
      onGuideTap("m1", event);
    });
    document.getElementById("m1-reward-map").addEventListener("click", showMap);
    document.getElementById("m1-reward-next").addEventListener("click", showMissionTwo);
    setupM1ProofEditor();
    syncM1FikirScreen();
  }


  function setupM1ProofEditor() {
    var KEY = "nexa-m1-proof-hotspots";
    var frame = document.getElementById("mission-one").querySelector(".mission-frame");
    var panel = document.getElementById("m1-proof-editor");
    var readout = document.getElementById("m1-proof-readout");
    var note = document.getElementById("m1-proof-note");
    var slots = [
      { id: "m1-proof-1", name: "jawapan1", proof: "120+50=170", left: 4.5, top: 70.9, width: 91, height: 5 },
      { id: "m1-proof-2", name: "jawapan2", proof: "120+80=200", left: 4.5, top: 77.3, width: 91, height: 5 },
      { id: "m1-proof-3", name: "jawapan3", proof: "120+130=250", left: 4.5, top: 83.1, width: 91, height: 5 }
    ];
    var layout = [];
    var drag = null;

    function round1(value) {
      return Math.round(value * 10) / 10;
    }

    function clampSlot(slot) {
      var width = slot.width;
      var height = slot.height;
      var left = slot.left;
      var top = slot.top;
      if (width < 8) {
        width = 8;
      }
      if (height < 3) {
        height = 3;
      }
      if (width > 100) {
        width = 100;
      }
      if (height > 40) {
        height = 40;
      }
      if (left < 0) {
        left = 0;
      }
      if (top < 0) {
        top = 0;
      }
      if (left + width > 100) {
        left = 100 - width;
      }
      if (top + height > 100) {
        top = 100 - height;
      }
      slot.left = round1(left);
      slot.top = round1(top);
      slot.width = round1(width);
      slot.height = round1(height);
    }

    function configText() {
      return JSON.stringify({
        jawapan1: { left: layout[0].left, top: layout[0].top, width: layout[0].width, height: layout[0].height, proof: layout[0].proof },
        jawapan2: { left: layout[1].left, top: layout[1].top, width: layout[1].width, height: layout[1].height, proof: layout[1].proof },
        jawapan3: { left: layout[2].left, top: layout[2].top, width: layout[2].width, height: layout[2].height, proof: layout[2].proof }
      }, null, 2);
    }

    function applySlot(index) {
      var button = document.getElementById(layout[index].id);
      var slot = layout[index];
      button.style.setProperty("--x", slot.left + "%");
      button.style.setProperty("--y", slot.top + "%");
      button.style.setProperty("--w", slot.width + "%");
      button.style.setProperty("--h", slot.height + "%");
      document.getElementById(slot.id + "-left").value = String(slot.left);
      document.getElementById(slot.id + "-top").value = String(slot.top);
      document.getElementById(slot.id + "-width").value = String(slot.width);
      document.getElementById(slot.id + "-height").value = String(slot.height);
    }

    function applyAll() {
      var index;
      for (index = 0; index < layout.length; index += 1) {
        applySlot(index);
      }
      readout.textContent = configText();
    }

    function copyFromDefaults() {
      var index;
      layout = [];
      for (index = 0; index < slots.length; index += 1) {
        layout.push({
          id: slots[index].id,
          name: slots[index].name,
          proof: slots[index].proof,
          left: slots[index].left,
          top: slots[index].top,
          width: slots[index].width,
          height: slots[index].height
        });
      }
    }

    function readSaved() {
      var raw;
      var data;
      var index;
      var saved;
      var slot;
      try {
        raw = localStorage.getItem(KEY);
        if (!raw) {
          return false;
        }
        data = JSON.parse(raw);
      } catch (error) {
        return false;
      }
      for (index = 0; index < slots.length; index += 1) {
        saved = data[slots[index].name];
        if (!saved || typeof saved.left !== "number" || typeof saved.top !== "number" || typeof saved.width !== "number" || typeof saved.height !== "number") {
          return false;
        }
      }
      copyFromDefaults();
      for (index = 0; index < slots.length; index += 1) {
        saved = data[slots[index].name];
        slot = layout[index];
        slot.left = saved.left;
        slot.top = saved.top;
        slot.width = saved.width;
        slot.height = saved.height;
        slot.proof = slots[index].proof;
        clampSlot(slot);
      }
      return true;
    }

    function setNote(text) {
      note.textContent = text;
    }

    function setEditing(enabled) {
      frame.classList.toggle("is-proof-editing", enabled);
      panel.hidden = !enabled;
      if (!enabled) {
        drag = null;
      }
      setNote(enabled ? "Seret kotak atau sudut kuning. Jawapan tidak dihantar semasa menyunting." : "");
    }

    function buktiOpen() {
      var proof = document.getElementById("m1-proof-1");
      return !missionScreen.hidden && proof && !proof.hidden;
    }

    if (!readSaved()) {
      copyFromDefaults();
    }
    applyAll();

    layout.forEach(function (slot, index) {
      var button = document.getElementById(slot.id);
      ["left", "top", "width", "height"].forEach(function (key) {
        document.getElementById(slot.id + "-" + key).addEventListener("input", function (event) {
          var value = Number(event.target.value);
          if (!isFinite(value)) {
            return;
          }
          layout[index][key] = value;
          clampSlot(layout[index]);
          applySlot(index);
          readout.textContent = configText();
        });
      });
      button.addEventListener("pointerdown", function (event) {
        var box;
        if (!frame.classList.contains("is-proof-editing")) {
          return;
        }
        if (event.button !== undefined && event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        box = frame.getBoundingClientRect();
        drag = {
          pointerId: event.pointerId,
          index: index,
          resize: event.target.classList.contains("m1-proof-handle"),
          startX: event.clientX,
          startY: event.clientY,
          left: layout[index].left,
          top: layout[index].top,
          width: layout[index].width,
          height: layout[index].height,
          frameWidth: box.width,
          frameHeight: box.height
        };
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener("pointermove", function (event) {
        var dx;
        var dy;
        if (!drag || drag.pointerId !== event.pointerId || drag.index !== index) {
          return;
        }
        event.preventDefault();
        dx = (event.clientX - drag.startX) / drag.frameWidth * 100;
        dy = (event.clientY - drag.startY) / drag.frameHeight * 100;
        if (drag.resize) {
          layout[index].left = drag.left;
          layout[index].top = drag.top;
          layout[index].width = drag.width + dx;
          layout[index].height = drag.height + dy;
        } else {
          layout[index].left = drag.left + dx;
          layout[index].top = drag.top + dy;
          layout[index].width = drag.width;
          layout[index].height = drag.height;
        }
        clampSlot(layout[index]);
        applySlot(index);
        readout.textContent = configText();
      });
      function endDrag(event) {
        if (!drag || drag.pointerId !== event.pointerId || drag.index !== index) {
          return;
        }
        drag = null;
      }
      button.addEventListener("pointerup", endDrag);
      button.addEventListener("pointercancel", endDrag);
    });

    document.getElementById("m1-proof-save").addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, configText());
        setNote("Disimpan dalam pelayar ini.");
      } catch (error) {
        setNote("Tidak dapat disimpan dalam pelayar ini.");
      }
    });
    document.getElementById("m1-proof-reset").addEventListener("click", function () {
      copyFromDefaults();
      applyAll();
      try {
        localStorage.removeItem(KEY);
      } catch (error) {
        setNote("Tetapan asal.");
        return;
      }
      setNote("Tetapan asal.");
    });
    document.getElementById("m1-proof-copy").addEventListener("click", function () {
      var text = configText();
      function finish(copied) {
        setNote(copied ? "Tetapan disalin." : "Salin teks di bawah.");
        readout.textContent = text;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          finish(true);
        }, function () {
          finish(false);
        });
        return;
      }
      finish(false);
    });
    document.getElementById("m1-proof-close").addEventListener("click", function () {
      setEditing(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.code !== "KeyE" || !event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || event.repeat) {
        return;
      }
      if (!buktiOpen()) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setEditing(!frame.classList.contains("is-proof-editing"));
    }, true);

    panel.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
  }

  function setupDemoGame() {
    var dialog = document.getElementById("demo-dialog");
    var mapButton = document.getElementById("demo-dialog-map");

    document.querySelectorAll("[data-demo-answer]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (m1OutcomeOpen) {
          return;
        }
        novaLast.demo = button.getAttribute("data-demo-answer");
        if (Number(button.getAttribute("data-demo-answer")) === 130) {
          showDemoOutcome("betul", function () {
            showMap();
          });
          return;
        }
        guideMemory.demoFails += 1;
        guideMemory.lastDemoWrong = novaLast.demo;
        showDemoOutcome("cuba", function () {
          return;
        });
      });
    });

    document.querySelectorAll("[data-demo-help]").forEach(function (button) {
      button.addEventListener("click", function () {
        var kind = button.getAttribute("data-demo-help");
        if (m1OutcomeOpen) {
          return;
        }
        if (kind === "dengar") {
          replayCurrentInstruction();
          return;
        }
        if (kind === "ai") {
          openGuidedHelp("demo");
        }
      });
    });

    document.getElementById("demo-guide-taps").addEventListener("click", function (event) {
      onGuideTap("demo", event);
    });
    document.getElementById("demo-dialog-close").addEventListener("click", function () {
      dialog.hidden = true;
    });
    mapButton.addEventListener("click", function () {
      dialog.hidden = true;
      showMap();
    });
  }

  var narrationMuted = false;
  var narrationToken = 0;
  var narrationTimer = 0;
  var speechNeedsTap = false;
  var WELCOME_LINE = "Hai! Saya AI Nova. Jom belajar dan selamatkan Kota Air bersama-sama!";
  var MAP_LINE = "Hai! Saya Cikgu Khaw. Selamat datang ke Bandar Air Nexa! Pilih misi yang bercahaya untuk memulakan pengembaraan STEM kamu!";

  function malayVoice() {
    var voices;
    var index;
    var voice;
    var lang;
    var name;
    var fallback = null;
    if (!window.speechSynthesis) {
      return null;
    }
    voices = window.speechSynthesis.getVoices();
    for (index = 0; index < voices.length; index += 1) {
      voice = voices[index];
      lang = (voice.lang || "").toLowerCase().replace("_", "-");
      name = (voice.name || "").toLowerCase();
      if (lang === "ms-my" || name.indexOf("malaysia") !== -1) {
        return voice;
      }
      if (!fallback && (lang.indexOf("ms") === 0 || name.indexOf("malay") !== -1)) {
        fallback = voice;
      }
    }
    return fallback;
  }

  function refreshNarrationButtons() {
    var buttons = document.querySelectorAll(".narration-toggle");
    var index;
    var button;
    var label;
    if (narrationMuted) {
      label = "Mainkan bacaan";
    } else if (speechNeedsTap) {
      label = "Tekan untuk dengar";
    } else {
      label = "Senyapkan bacaan";
    }
    for (index = 0; index < buttons.length; index += 1) {
      button = buttons[index];
      button.textContent = narrationMuted || speechNeedsTap ? "🔇" : "🔊";
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", narrationMuted ? "true" : "false");
      button.classList.toggle("is-muted", narrationMuted || speechNeedsTap);
    }
  }

  function stopNarration() {
    narrationToken += 1;
    if (narrationTimer) {
      window.clearTimeout(narrationTimer);
      narrationTimer = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  var narrationScreenId = "welcome";
  var SCREEN_LINES = {
    welcome: WELCOME_LINE,
    demo: "Hai! Saya AI Nova. Tangki ada 120 mililiter. Sasaran 250 mililiter. Berapa mililiter lagi diperlukan?",
    map: MAP_LINE,
    "m1-fikir": "Tangki ada 120 mililiter. Sasaran 250 mililiter. Berapa mililiter lagi diperlukan?",
    "m1-eksperimen": "Paras awal 120 mililiter. Tambah air sehingga 250 mililiter. Pilih bekas 20, 50 atau 80 mililiter.",
    "m1-buktikan": "Pilih pengiraan yang membuktikan paras akhir tangki ialah 250 mililiter.",
    "m1-selesai": "Misi selesai. Lencana kamu sudah dikumpul.",
    "m2-fikir": "Sebiji batu dimasukkan ke dalam air hingga tenggelam. Apakah yang berlaku kepada aras air?",
    "m2-eksperimen": "Silinder ada 120 mililiter air. Masukkan batu, kemudian kira isi padu batu.",
    "m2-buktikan": "Aras mula 100 mililiter. Aras akhir 130 mililiter. Berapakah isi padu batu?",
    "m2-selesai": "Misi selesai. Lencana kamu sudah dikumpul.",
    "m3-fikir": "Satu liter sama dengan berapa mililiter?",
    "m3-eksperimen": "Tangki ada 700 mililiter dan bocor 100 mililiter. Tutup injap, kemudian kira air yang perlu ditambah.",
    "m3-buktikan": "Tangki ada 850 mililiter. Air bocor 150 mililiter. Sasaran ialah 1 liter. Berapa mililiter perlu ditambah?",
    "m3-selesai": "Misi selesai. Lencana kamu sudah dikumpul.",
    "m4-fikir": "Jurutera perlu menyediakan air sebanyak 1 liter. Berapa mililiter itu?",
    "m4-eksperimen": "Aktifkan dua paip supaya jumlah air ialah 750 mililiter.",
    "m4-buktikan": "Seorang jurutera gabungkan 200 mililiter dan 300 mililiter. Berapakah jumlahnya?",
    "m4-selesai": "Misi selesai. Lencana kamu sudah dikumpul."
  };
  var FEEDBACK_LINES = {
    betul: "Betul!",
    cuba: "Cuba lagi. Belum tepat.",
    selesai: "Misi selesai. Lencana kamu sudah dikumpul."
  };

  function activeNarrationLine() {
    return SCREEN_LINES[narrationScreenId] || "";
  }

  function enterScreen(screenId) {
    if (screenId !== "demo") {
      guideMemory.lastDemoWrong = "";
      novaLast.demo = "";
    }
    if (screenId !== "m1-fikir") {
      guideMemory.lastFikirWrong = "";
      novaLast.fikir = "";
    }
    if (screenId !== "m1-buktikan") {
      guideMemory.lastBuktiWrong = "";
      novaLast.proof = "";
    }
    narrationScreenId = screenId;
    if (narrationMuted || !SCREEN_LINES[screenId]) {
      stopNarration();
      return;
    }
    speakNow(SCREEN_LINES[screenId], true);
  }

  function replayCurrentInstruction() {
    var line = SCREEN_LINES[narrationScreenId] || "";
    if (!line) {
      return;
    }
    speakNow(line, false);
  }

  function narrateFeedback(kind, spoken) {
    var line = spoken || FEEDBACK_LINES[kind] || "";
    if (!line) {
      return;
    }
    speakNow(line, true);
  }

  function narrateHint(text) {
    if (!text) {
      return;
    }
    speakNow(text, true);
  }

  function speakNow(text, automatic, onDone) {
    var token;
    if (!text) {
      return;
    }
    if (automatic && narrationMuted) {
      stopNarration();
      return;
    }
    if (!window.speechSynthesis) {
      if (automatic) {
        speechNeedsTap = true;
        refreshNarrationButtons();
      } else {
        openHelp("DENGAR", "Bacaan suara tidak disokong oleh pelayar ini.");
      }
      return;
    }
    stopNarration();
    token = narrationToken;
    function begin() {
      var utterance;
      var voice;
      if (token !== narrationToken || (automatic && narrationMuted)) {
        return;
      }
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ms-MY";
      utterance.rate = 0.8;
      utterance.pitch = 1.02;
      voice = malayVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.onstart = function () {
        if (token !== narrationToken) {
          return;
        }
        speechNeedsTap = false;
        refreshNarrationButtons();
      };
      utterance.onend = function () {
        if (token !== narrationToken) {
          return;
        }
        if (onDone) {
          onDone();
        }
      };
      utterance.onerror = function (event) {
        var reason = event && event.error ? event.error : "";
        if (token !== narrationToken) {
          return;
        }
        if (reason === "interrupted" || reason === "canceled" || reason === "cancelled") {
          return;
        }
        if (automatic) {
          speechNeedsTap = true;
          refreshNarrationButtons();
        }
        if (onDone) {
          onDone();
        }
      };
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      narrationTimer = window.setTimeout(function () {
        narrationTimer = 0;
        if (token !== narrationToken || !automatic || narrationMuted) {
          return;
        }
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          return;
        }
        speechNeedsTap = true;
        refreshNarrationButtons();
      }, 900);
    }
    if (window.speechSynthesis.getVoices().length === 0) {
      var started = false;
      function ready() {
        if (started || token !== narrationToken) {
          return;
        }
        started = true;
        window.speechSynthesis.removeEventListener("voiceschanged", ready);
        begin();
      }
      window.speechSynthesis.addEventListener("voiceschanged", ready);
      window.setTimeout(ready, 500);
      return;
    }
    begin();
  }

  function setupNarrationControls() {
    document.querySelectorAll(".narration-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!narrationMuted && !speechNeedsTap) {
          narrationMuted = true;
          stopNarration();
          refreshNarrationButtons();
          return;
        }
        narrationMuted = false;
        speechNeedsTap = false;
        refreshNarrationButtons();
        speakNow(activeNarrationLine(), false);
      });
    });
    refreshNarrationButtons();
  }

  function speakText(text) {
    speakNow(text, false);
  }

  function openHelp(heading, message) {
    document.getElementById("help-title").textContent = heading;
    document.getElementById("help-text").textContent = message;
    document.getElementById("help-dialog").hidden = false;
  }

  function setupMissionHelp() {
    document.getElementById("help-close").addEventListener("click", function () {
      document.getElementById("help-dialog").hidden = true;
    });
    document.querySelectorAll(".mission-help").forEach(function (bar) {
      bar.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        var mission;
        if (!button) {
          return;
        }
        if (button.getAttribute("data-help") === "dengar") {
          replayCurrentInstruction();
          return;
        }
        if (button.getAttribute("data-help") === "ai") {
          mission = bar.closest(".mission-screen");
          if (mission && mission.id === "mission-one") {
            if (m1ScreenId() === "m1-eksperimen") {
              openGuidedHelp("m1-eksperimen");
            } else if (m1ScreenId() === "m1-buktikan") {
              openGuidedHelp("m1-buktikan");
            } else {
              openGuidedHelp("m1-fikir");
            }
            return;
          }
          openHelp("BANTU AI", "Bantuan untuk misi ini belum sedia. Dengar soalan dan cuba lagi.");
        }
      });
    });
  }

  function setupMissionFour() {
    var M4_FIKIR = 1000;
    var M4_BUKTI = 500;
    var m4 = {
      fikirSolved: false,
      pipes: [],
      volume: 0,
      experimentSolved: false,
      buktiSolved: false,
      correct: 0,
      incorrect: 0,
      log: []
    };
    getM4ScreenId = function () {
      if (!m4.fikirSolved) {
        return "m4-fikir";
      }
      if (!m4.experimentSolved) {
        return "m4-eksperimen";
      }
      if (!m4.buktiSolved) {
        return "m4-buktikan";
      }
      return "m4-selesai";
    };
    var water = document.getElementById("m4-water");
    var volumeText = document.getElementById("m4-volume-text");
    var message = document.getElementById("m4-message");
    var fikirForm = document.getElementById("m4-fikir-form");
    var fikirInput = document.getElementById("m4-fikir-input");
    var fikirFeedback = document.getElementById("m4-fikir-feedback");
    var fikirHint = document.getElementById("m4-fikir-hint");
    var hintButton = document.getElementById("m4-hint-button");
    var eksperimenNote = document.getElementById("m4-eksperimen-note");
    var buktiPanel = document.getElementById("m4-bukti-panel");
    var buktiForm = document.getElementById("m4-bukti-form");
    var buktiInput = document.getElementById("m4-bukti-input");
    var buktiFeedback = document.getElementById("m4-bukti-feedback");
    var correctCount = document.getElementById("m4-correct-count");
    var incorrectCount = document.getElementById("m4-incorrect-count");
    var attemptLog = document.getElementById("m4-attempt-log");
    var pipeButtons = document.querySelectorAll(".pipe");

    m4Complete = function () {
      return m4.fikirSolved && m4.experimentSolved && m4.buktiSolved;
    };

    function readAmount(value) {
      var cleaned = String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/ml/g, "");
      if (!/^\d+$/.test(cleaned)) {
        return null;
      }
      return Number(cleaned);
    }

    function showM4Message(text, type) {
      message.textContent = text;
      message.className = "message" + (type ? " " + type : "");
    }

    function recordM4(correct, label) {
      var item = document.createElement("li");
      if (correct) {
        m4.correct += 1;
      } else {
        m4.incorrect += 1;
      }
      item.textContent = label;
      if (attemptLog.querySelector(".log-empty")) {
        attemptLog.textContent = "";
      }
      attemptLog.appendChild(item);
      correctCount.textContent = String(m4.correct);
      incorrectCount.textContent = String(m4.incorrect);
      renderMap();
    }

    function renderM4() {
      var index;
      water.style.height = (m4.volume / 1000) * 100 + "%";
      volumeText.textContent = m4.volume + " mL";
      fikirForm.hidden = m4.fikirSolved;
      hintButton.hidden = m4.fikirSolved;
      eksperimenNote.hidden = !m4.fikirSolved;
      buktiPanel.hidden = !m4.experimentSolved;
      buktiForm.hidden = m4.buktiSolved;
      for (index = 0; index < pipeButtons.length; index += 1) {
        pipeButtons[index].disabled = !m4.fikirSolved || m4.experimentSolved || m4.pipes.length >= 2;
      }
      setPhase("m4-phase-fikir", m4.fikirSolved ? "done" : "active");
      setPhase("m4-phase-eksperimen", !m4.fikirSolved ? "locked" : (m4.experimentSolved ? "done" : "active"));
      setPhase("m4-phase-buktikan", !m4.experimentSolved ? "locked" : (m4.buktiSolved ? "done" : "active"));
    }

    function checkM4Fikir(event) {
      var answer;
      event.preventDefault();
      if (m4.fikirSolved) {
        return;
      }
      answer = readAmount(fikirInput.value);
      if (answer === null) {
        fikirFeedback.textContent = "Tulis nombor dalam mL dahulu.";
        fikirFeedback.className = "feedback bad";
        return;
      }
      if (answer === M4_FIKIR) {
        m4.fikirSolved = true;
        fikirFeedback.textContent = "Betul. 1 L = 1000 mL.";
        fikirFeedback.className = "feedback ok";
        recordM4(true, "Fikir: betul, 1000 mL");
        showM4Message("Bagus. Sekarang pilih dua paip.", "success");
        renderM4();
        enterScreen("m4-eksperimen");
        return;
      }
      fikirFeedback.textContent = "Belum tepat. Cuba lagi.";
      fikirFeedback.className = "feedback bad";
      recordM4(false, "Fikir: salah");
      showM4Message("Belum tepat. Cuba semak 1 L.", "warn");
      narrateFeedback("cuba");
    }

    function choosePipe(amount) {
      var first;
      var second;
      var pair;
      if (!m4.fikirSolved || m4.experimentSolved || m4.pipes.length >= 2) {
        return;
      }
      m4.pipes.push(amount);
      m4.volume = m4.pipes[0] + (m4.pipes.length > 1 ? m4.pipes[1] : 0);
      renderM4();
      if (m4.pipes.length < 2 && m4.volume < 750) {
        showM4Message("Paip pertama dipilih. Pilih satu lagi.", "");
        return;
      }
      first = m4.pipes[0];
      second = m4.pipes[1];
      pair = (first === 250 && second === 500) || (first === 500 && second === 250);
      if (m4.pipes.length === 2 && pair) {
        m4.experimentSolved = true;
        recordM4(true, "Eksperimen: dua paip 750 mL");
        showM4Message("Bagus! 250 mL + 500 mL = 750 mL.", "success");
        renderM4();
        enterScreen("m4-buktikan");
        return;
      }
      recordM4(false, "Eksperimen: paip tidak tepat");
      showM4Message("Gunakan dua paip yang jumlahnya 750 mL. Tekan Set Semula.", "warn");
      narrateFeedback("cuba");
    }

    function resetM4() {
      m4.pipes = [];
      m4.volume = 0;
      showM4Message(m4.fikirSolved ? "Paip diset semula. Pilih dua paip semula." : "Kira dahulu: 1 L sama dengan berapa mL?", "");
      renderM4();
    }

    function checkM4Bukti(event) {
      var answer;
      event.preventDefault();
      if (!m4.experimentSolved || m4.buktiSolved) {
        return;
      }
      answer = readAmount(buktiInput.value);
      if (answer === null) {
        buktiFeedback.textContent = "Tulis nombor dalam mL dahulu.";
        buktiFeedback.className = "feedback bad";
        return;
      }
      if (answer === M4_BUKTI) {
        m4.buktiSolved = true;
        buktiFeedback.textContent = "Bagus! 200 mL + 300 mL = 500 mL.";
        buktiFeedback.className = "feedback ok";
        recordM4(true, "Buktikan: betul, 500 mL");
        showM4Message("Syabas! Misi 4 selesai.", "success");
        renderM4();
        narrateFeedback("selesai");
        return;
      }
      buktiFeedback.textContent = "Belum tepat. Baca soalan sekali lagi dan cuba semula.";
      buktiFeedback.className = "feedback bad";
      recordM4(false, "Buktikan: salah");
      showM4Message("Belum tepat. Cuba semak kiraan kamu sendiri.", "warn");
      narrateFeedback("cuba");
    }

    fikirForm.addEventListener("submit", checkM4Fikir);
    hintButton.addEventListener("click", function () {
      if (!m4.fikirSolved) {
        fikirHint.hidden = false;
      }
    });
    pipeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        choosePipe(Number(button.getAttribute("data-pipe")));
      });
    });
    document.getElementById("m4-reset").addEventListener("click", resetM4);
    buktiForm.addEventListener("submit", checkM4Bukti);
    renderM4();
  }

  var guideMemory = {
    demoFails: 0,
    demoPress: 0,
    lastDemoWrong: "",
    fikirFails: 0,
    fikirPress: 0,
    lastFikirWrong: "",
    expPress: 0,
    expOverflows: 0,
    pendingOverflow: false,
    lastOverflowBeaker: 0,
    buktiFails: 0,
    buktiPress: 0,
    lastBuktiWrong: ""
  };
  var guideToken = 0;
  var guidePack = { demo: null, m1: null };

  function renderGuideTaps(prefix, pack) {
    var taps = document.getElementById(prefix + "-guide-taps");
    var index;
    var tap;
    var button;
    var small;
    if (!taps) {
      return;
    }
    taps.textContent = "";
    if (!pack.taps || !pack.taps.length) {
      taps.hidden = true;
      return;
    }
    for (index = 0; index < pack.taps.length; index += 1) {
      tap = pack.taps[index];
      button = document.createElement("button");
      button.type = "button";
      button.className = "guide-tap";
      button.setAttribute("data-guide-tap", tap.id);
      button.appendChild(document.createTextNode(tap.label));
      small = document.createElement("small");
      small.textContent = tap.visual;
      button.appendChild(small);
      taps.appendChild(button);
    }
    taps.hidden = false;
  }

  function writeGuideSpeech(element, speech) {
    var pieces = String(speech || "").split(/(\d+)/);
    var index;
    var strong;
    element.textContent = "";
    for (index = 0; index < pieces.length; index += 1) {
      if (!pieces[index]) {
        continue;
      }
      if (/^\d+$/.test(pieces[index])) {
        strong = document.createElement("strong");
        strong.textContent = pieces[index];
        element.appendChild(strong);
      } else {
        element.appendChild(document.createTextNode(pieces[index]));
      }
    }
  }

  function showGuidePack(screen, pack) {
    var prefix = screen === "demo" ? "demo" : "m1";
    var dialog = document.getElementById(prefix + "-dialog");
    var note = document.getElementById(prefix + "-guide-note");
    var ai = document.getElementById(prefix + "-guide-ai");
    var closeButton = document.getElementById(prefix + "-dialog-close");
    guidePack[prefix] = pack;
    if (screen === "demo") {
      document.getElementById("demo-dialog-map").hidden = true;
    } else {
      document.getElementById("m1-dialog-next").hidden = true;
      dialog.removeAttribute("data-m1-action");
    }
    if (closeButton) {
      closeButton.textContent = "Tutup";
    }
    document.getElementById(prefix + "-dialog-title").textContent = "AI NOVA";
    writeGuideSpeech(document.getElementById(prefix + "-dialog-text"), pack.speech);
    if (note) {
      note.textContent = "";
      note.hidden = true;
    }
    if (ai) {
      ai.textContent = "";
      ai.hidden = true;
    }
    renderGuideTaps(prefix, pack);
    dialog.hidden = false;
    narrateHint(pack.speech);
  }

  function openGuidedHelp(screen) {
    var pack;
    var answer = "";
    var pour = 0;
    var blocked = false;
    if (m1OutcomeOpen) {
      return;
    }
    if (screen === "m1-eksperimen" && state.overflowHold) {
      return;
    }
    if (!window.NexaGuide || !window.NexaGuide.pupilGuide) {
      presentNova(screen, "AI NOVA", "Panduan tidak dapat ditunjukkan sekarang.", false);
      return;
    }
    if (screen === "demo") {
      answer = guideMemory.lastDemoWrong;
    } else if (screen === "m1-fikir") {
      answer = guideMemory.lastFikirWrong;
    } else if (screen === "m1-buktikan") {
      answer = guideMemory.lastBuktiWrong;
    }
    if (answer !== "120" && answer !== "150" && answer !== "120+50=170" && answer !== "120+80=200") {
      answer = "";
    }
    if (screen === "m1-eksperimen") {
      blocked = guideMemory.pendingOverflow;
      if (blocked) {
        pour = Number(guideMemory.lastOverflowBeaker) || 0;
      } else if (state.attemptPours.length) {
        pour = Number(state.attemptPours[state.attemptPours.length - 1]) || 0;
      }
    }
    pack = window.NexaGuide.pupilGuide({
      screen: screen,
      answer: answer,
      volume: state.volume,
      pour: pour,
      blocked: blocked
    });
    if (!pack || window.NexaGuide.containsAnswer(pack.speech)) {
      presentNova(screen, "AI NOVA", "Panduan tidak dapat ditunjukkan sekarang.", false);
      return;
    }
    showGuidePack(screen, pack);
  }

  function onGuideTap(prefix, event) {
    var button = event.target.closest("button");
    var chosen;
    if (!button || !guidePack[prefix]) {
      return;
    }
    chosen = window.NexaGuide.tap(guidePack[prefix], button.getAttribute("data-guide-tap"));
    if (!chosen || window.NexaGuide.containsAnswer(chosen.speech)) {
      return;
    }
    document.getElementById(prefix + "-dialog-text").textContent = chosen.speech;
    narrateHint(chosen.speech);
  }

  var novaLast = { demo: "", fikir: "", proof: "" };

  function refreshNovaStatus() {
    document.querySelectorAll("[data-demo-help='ai'] span, #m1-bantu span, #m1-exp-bantu span, #m1-bukti-bantu span").forEach(function (span) {
      span.hidden = true;
    });
  }

  function presentNova(screen, heading, message, speak) {
    var title;
    var text;
    var mapButton;
    var dialog;
    if (screen === "demo") {
      title = document.getElementById("demo-dialog-title");
      text = document.getElementById("demo-dialog-text");
      mapButton = document.getElementById("demo-dialog-map");
      dialog = document.getElementById("demo-dialog");
      title.textContent = heading;
      text.textContent = message;
      mapButton.hidden = true;
      dialog.hidden = false;
    } else {
      showM1Dialog(heading, message, false, "Tutup");
    }
    if (speak) {
      narrateHint(message);
    }
  }

  refreshNovaStatus();
  enterScreen("welcome");
})();

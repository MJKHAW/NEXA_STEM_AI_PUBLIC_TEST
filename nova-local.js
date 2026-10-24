(function () {
  var MODEL_F16 = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
  var MODEL_F32 = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC";
  var WEBLLM_URL = "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm";
  var engine = null;
  var loading = null;
  var loadedModel = "";

  function checkGpu() {
    if (!window.isSecureContext) {
      return Promise.resolve({
        ok: false,
        reason: "AI pada peranti tidak dapat bermula dari fail yang dibuka terus. Ia memerlukan localhost atau tapak https seperti GitHub Pages. Ini bukan petunjuk AI."
      });
    }
    if (!navigator.gpu) {
      return Promise.resolve({
        ok: false,
        reason: "Pelayar ini tidak ada WebGPU. AI pada peranti tidak disokong di sini. Ini bukan petunjuk AI."
      });
    }
    return navigator.gpu.requestAdapter().then(function (adapter) {
      if (!adapter) {
        return {
          ok: false,
          reason: "WebGPU ada, tetapi kad grafik tidak dapat digunakan. AI pada peranti tidak disokong. Ini bukan petunjuk AI."
        };
      }
      return {
        ok: true,
        f16: adapter.features.has("shader-f16")
      };
    });
  }

  function loadEngine(modelId, present) {
    return Promise.reject(new Error("dimatikan"));
    if (engine && loadedModel === modelId) {
      return Promise.resolve(engine);
    }
    if (loading) {
      return loading;
    }
    loading = import(WEBLLM_URL).then(function (webllm) {
      if (!webllm.CreateMLCEngine) {
        throw new Error("Pustaka WebLLM tidak lengkap.");
      }
      return webllm.CreateMLCEngine(modelId, {
        initProgressCallback: function (report) {
          var pct = Math.round((report.progress || 0) * 100);
          var detail = report.text || "";
          present("AI Nova pada peranti", "Memuat model: " + pct + "%. " + detail);
        }
      });
    }).then(function (created) {
      engine = created;
      loadedModel = modelId;
      loading = null;
      return engine;
    }, function (error) {
      loading = null;
      throw error;
    });
    return loading;
  }

  function modelReplyText(reply) {
    if (reply && reply.choices && reply.choices[0] && reply.choices[0].message) {
      return String(reply.choices[0].message.content || "").trim();
    }
    return "";
  }

  window.NexaLocalNova = {
    modelF16: MODEL_F16,
    modelF32: MODEL_F32,
    ask: function () {
      return Promise.resolve({ ok: false, text: "", blocked: true });
    },
    chooseHintId: function () {
      return Promise.resolve({ ok: false, mode: "device-off", raw: "" });
    }
  };
})();

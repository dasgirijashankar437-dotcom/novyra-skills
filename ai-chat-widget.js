(() => {
  "use strict";

  if (window.__novyraAIWidgetLoaded) return;
  window.__novyraAIWidgetLoaded = true;

  const style = document.createElement("style");
  style.textContent = `
    #novyra-ai-launcher {
      position: fixed; right: 22px; bottom: 22px; z-index: 9998;
      border: 1px solid #f5dfa0; border-radius: 50px;
      padding: 14px 19px; background: linear-gradient(135deg,#f5dfa0,#b68b3e);
      color: #10182a; font-weight: 800; cursor: pointer;
      box-shadow: 0 8px 28px #0006;
    }
    #novyra-ai-panel {
      position: fixed; right: 22px; bottom: 84px; z-index: 9999;
      width: min(390px, calc(100vw - 28px)); height: min(570px, 75vh);
      display: none; flex-direction: column; overflow: hidden;
      background: #07152f; color: #f8f6ef;
      border: 1px solid #d8b568; border-radius: 18px;
      box-shadow: 0 18px 60px #0009;
      font-family: Inter, "Segoe UI", Arial, sans-serif;
    }
    #novyra-ai-panel.open { display: flex; }
    .nv-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 15px; background: #10264a;
      border-bottom: 1px solid #d8b56866;
    }
    .nv-title { color: #f5dfa0; font-weight: 800; }
    .nv-subtitle { font-size: 11px; color: #b7c3d8; margin-top: 4px; }
    .nv-head button, .nv-send {
      border: 0; border-radius: 8px; padding: 9px 12px;
      background: #d8b568; color: #10182a; font-weight: 700; cursor: pointer;
    }
    #nv-mode {
      margin: 10px; padding: 10px; border-radius: 8px;
      color: #f8f6ef; background: #10264a; border: 1px solid #d8b56866;
    }
    #nv-messages {
      flex: 1; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .nv-message {
      max-width: 90%; padding: 10px 12px; border-radius: 12px;
      line-height: 1.55; font-size: 13px; overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    .nv-user { align-self: flex-end; background: #d8b568; color: #10182a; }
    .nv-ai { align-self: flex-start; background: #10264a; border: 1px solid #d8b56855; }
    .nv-status { color: #b7c3d8; font-size: 12px; padding: 0 12px 8px; }
    .nv-compose { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #d8b56855; }
    #nv-input {
      flex: 1; min-width: 0; resize: none; min-height: 44px; max-height: 100px;
      padding: 10px; border-radius: 9px; color: white;
      background: #030914; border: 1px solid #d8b56866; font: inherit;
    }
    #nv-input:focus { outline: 1px solid #d8b568; }
    @media(max-width:480px) {
      #novyra-ai-launcher { right: 14px; bottom: 14px; }
      #novyra-ai-panel { right: 7px; bottom: 72px; }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "novyra-ai-launcher";
  launcher.type = "button";
  launcher.textContent = "✦ AI Teacher";

  const panel = document.createElement("section");
  panel.id = "novyra-ai-panel";
  panel.setAttribute("aria-label", "NOVYRA SKILLS AI assistant");

  const head = document.createElement("div");
  head.className = "nv-head";

  const titleWrap = document.createElement("div");
  const title = document.createElement("div");
  title.className = "nv-title";
  title.textContent = "NOVYRA AI";
  const subtitle = document.createElement("div");
  subtitle.className = "nv-subtitle";
  subtitle.textContent = "Powered by NOVYRA VYREN";
  titleWrap.append(title, subtitle);

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "✕";
  close.setAttribute("aria-label", "Close chat");
  head.append(titleWrap, close);

  const mode = document.createElement("select");
  mode.id = "nv-mode";
  mode.setAttribute("aria-label", "Assistant mode");
  mode.innerHTML = `
    <option value="teacher">AI Teacher — learn and practise</option>
    <option value="chatbot">AI Chatbot — ask anything</option>
  `;

  const messagesBox = document.createElement("div");
  messagesBox.id = "nv-messages";
  const status = document.createElement("div");
  status.className = "nv-status";
  status.setAttribute("role", "status");

  const compose = document.createElement("form");
  compose.className = "nv-compose";

  const input = document.createElement("textarea");
  input.id = "nv-input";
  input.maxLength = 4000;
  input.placeholder = "Ask a question...";
  input.setAttribute("aria-label", "Your question");
  input.required = true;

  const send = document.createElement("button");
  send.className = "nv-send";
  send.type = "submit";
  send.textContent = "Send";

  compose.append(input, send);
  panel.append(head, mode, messagesBox, status, compose);
  document.body.append(launcher, panel);

  let history = [];
  let busy = false;

  function addMessage(text, role) {
    const bubble = document.createElement("div");
    bubble.className = "nv-message " +
      (role === "user" ? "nv-user" : "nv-ai");
    bubble.textContent = text;
    messagesBox.appendChild(bubble);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function welcome() {
    messagesBox.replaceChildren();
    history = [];
    addMessage(
      mode.value === "teacher"
        ? "Hello! I am your AI Teacher. Tell me your subject or topic, and we will learn step by step."
        : "Hello! Ask me a question about skills, technology, coding, or another topic.",
      "assistant"
    );
  }

  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && messagesBox.childElementCount === 0) {
      welcome();
    }
  });

  close.addEventListener("click", () => panel.classList.remove("open"));
  mode.addEventListener("change", welcome);

  compose.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;

    const question = input.value.trim();
    if (!question) return;

    const client = window.novyraSupabase;
    if (!client) {
      status.textContent = "Supabase client is not connected to this widget.";
      return;
    }

    busy = true;
    send.disabled = true;
    status.textContent = "AI is thinking...";
    addMessage(question, "user");
    input.value = "";

    const pendingHistory = [
      ...history,
      { role: "user", text: question }
    ].slice(-12);

    try {
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("Please log in to use the AI assistant.");
      }

      const { data, error } = await client.functions.invoke("ai-chat", {
        body: {
          mode: mode.value,
          messages: pendingHistory
        }
      });

      if (error) {
        let detail = error.message || "Could not contact the AI service.";
        try {
          const responseBody = await error.context?.json?.();
          if (responseBody?.error) detail = responseBody.error;
        } catch (_) {}
        throw new Error(detail);
      }

      if (!data?.reply) {
        throw new Error(data?.error || "The AI returned no response.");
      }

      history = [
        ...pendingHistory,
        { role: "model", text: data.reply }
      ].slice(-12);

      addMessage(data.reply, "assistant");
      status.textContent = "Ready";
    } catch (error) {
      status.textContent = error.message || "Unable to connect. Please retry.";
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
    }
  });
})();

// 🤖 CAPTCHA TOOLS
function getCaptchaInfo() {
  const recaptchaEl = document.querySelector(".g-recaptcha");
  const siteKey = recaptchaEl ? recaptchaEl.getAttribute("data-sitekey") : null;
  
  // Also check for other common patterns
  if (!siteKey) {
    const scripts = [...document.querySelectorAll('script')];
    for (const s of scripts) {
      const match = s.src.match(/render=([a-zA-Z0-9_-]+)/);
      if (match) return { type: 'recaptcha', siteKey: match[1] };
    }
  }

  return siteKey ? { type: 'recaptcha', siteKey } : null;
}

function injectCaptchaToken(token) {
  const responseField = document.querySelector("#g-recaptcha-response");
  if (responseField) {
    responseField.innerHTML = token;
    responseField.value = token;
  }

  // Trigger callback if it exists
  if (window.grecaptcha) {
    try {
      // Some sites use a custom callback
      const recaptchaEl = document.querySelector(".g-recaptcha");
      const callback = recaptchaEl?.getAttribute("data-callback");
      if (callback && typeof window[callback] === 'function') {
        window[callback](token);
      } else {
        // Default behavior
        window.grecaptcha.getResponse = () => token;
      }
    } catch (e) {
      console.error("Failed to trigger reCAPTCHA callback:", e);
    }
  }
  
  console.log("🚀 CAPTCHA token injected and callback triggered");
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "GET_DOM") {
    sendResponse(document.body.innerText.slice(0, 5000));
  }

  if (msg.type === "GET_CAPTCHA_INFO") {
    sendResponse(getCaptchaInfo());
  }

  if (msg.type === "INJECT_CAPTCHA") {
    injectCaptchaToken(msg.token);
    sendResponse({ success: true });
  }

  if (msg.type === "EXECUTE_ACTIONS") {
    executeActions(msg.actions).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
});

// 🖱️ HUMAN-LIKE INTERACTIONS
function random(min, max) {
  return Math.random() * (max - min) + min;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate a curved path for the mouse
function generateCurve(startX, startY, endX, endY) {
  const points = [];
  const steps = Math.floor(random(15, 30));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Simple quadratic bezier-ish curve
    const x = startX + (endX - startX) * t + Math.sin(t * Math.PI) * random(-20, 20);
    const y = startY + (endY - startY) * t + Math.cos(t * Math.PI) * random(-20, 20);
    points.push({ x, y });
  }
  return points;
}

async function simulateMouseMove(endX, endY) {
  const startX = window.scrollX + random(0, 100);
  const startY = window.scrollY + random(0, 100);
  const path = generateCurve(startX, startY, endX, endY);

  for (const point of path) {
    const event = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: point.x - window.scrollX,
      clientY: point.y - window.scrollY
    });
    document.elementFromPoint(point.x - window.scrollX, point.y - window.scrollY)?.dispatchEvent(event);
    await sleep(random(5, 15));
  }
}

async function humanClick(el) {
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + window.scrollX;
  const y = rect.top + rect.height / 2 + window.scrollY;

  // 1. Move to element
  await simulateMouseMove(x, y);
  
  // 2. Hover delay
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  await sleep(random(200, 500));

  // 3. Realistic click sequence
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await sleep(random(50, 150));
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  el.click();
  
  // Visual feedback
  highlight(el);
}

async function humanType(el, text) {
  if (!el) return;
  el.focus();
  el.click();
  await sleep(random(200, 400));

  for (const char of text) {
    const opts = { key: char, bubbles: true };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    el.dispatchEvent(new KeyboardEvent('keypress', opts));
    
    // Update value
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value += char;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
    await sleep(random(50, 150)); // Variable typing speed
  }
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function humanScroll() {
  const scrolls = Math.floor(random(2, 5));
  for (let i = 0; i < scrolls; i++) {
    const amount = random(200, 500);
    window.scrollBy({ top: amount, behavior: 'smooth' });
    await sleep(random(800, 1500));
  }
}

async function executeActions(actions) {
  if (!actions || !Array.isArray(actions)) return;

  for (const action of actions) {
    if (!action || !action.type) {
      console.log("⚠️ Invalid action skipped");
      continue;
    }

    // Add random "human" noise delay
    await sleep(random(500, 1000));

    if (action.type === "click") {
      const el = findElementByText(action.text);
      if (el) {
        await humanClick(el);
      } else {
        // Fallback to smartClick if humanClick fails to find element
        smartClick(action.text);
      }
    }

    if (action.type === "type" || action.type === "fill") {
      const el = document.activeElement || findElementByText(action.text);
      await humanType(el, action.value || action.text);
    }

    if (action.type === "scroll") {
      await humanScroll();
    }

    if (action.type === "grid") {
      handleGrid(action);
    }

    if (action.type === "slider") {
      handleSlider(action);
    }

    if (action.type === "star") {
      handleStars(action);
    }

    if (action.type === "wait") {
      await sleep(action.time || 2000);
    }
  }
}

function findElementByText(text) {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  return [...document.querySelectorAll('button, a, input[type="button"], input[type="submit"], label, span, div')]
    .find(el => el.innerText?.toLowerCase().includes(lowerText) || el.value?.toLowerCase().includes(lowerText));
}

// 🧩 SMART CLICK (UPGRADED)
function smartClick(text) {
  const elements = [...document.querySelectorAll("button, div, span, label, li")];

  const match = elements.find(el =>
    el.innerText &&
    el.innerText.toLowerCase().includes(text.toLowerCase())
  );

  if (match) {
    highlight(match);
    match.click();

    // fallback: click parent if needed
    if (!match.matches("button, input")) {
      match.closest("button, label, div")?.click();
    }

    return true;
  }

  console.log("❌ Click failed:", text);
  return false;
}

// 🔢 GRID DETECTION (SURVEY MATRIX FIX 🔥)
function handleGrid(action) {
  const { question, answer } = action;

  const rows = [...document.querySelectorAll("tr, .row")];

  for (const row of rows) {
    if (row.innerText.toLowerCase().includes(question.toLowerCase())) {

      const options = row.querySelectorAll("td, button, label");

      for (const opt of options) {
        if (opt.innerText.toLowerCase().includes(answer.toLowerCase())) {
          highlight(opt);
          opt.click();
          return;
        }
      }
    }
  }

  console.log("❌ Grid selection failed");
}

// 🎚️ SLIDER HANDLING
function handleSlider(action) {
  const { value } = action;

  const slider = document.querySelector('input[type="range"]');

  if (slider) {
    slider.value = value || 80;

    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));

    highlight(slider);
    return;
  }

  console.log("❌ Slider not found");
}

// ⭐ STAR RATING FIX
function handleStars(action) {
  const { rating } = action;

  const stars = document.querySelectorAll('[class*="star"], svg, i');

  if (stars.length > 0) {
    const index = Math.min(rating || 5, stars.length) - 1;

    const star = stars[index];
    highlight(star);
    star.click();
    return;
  }

  console.log("❌ Stars not found");
}

// ✨ VISUAL DEBUG (VERY IMPORTANT)
function highlight(el) {
  el.style.outline = "3px solid red";
  el.style.backgroundColor = "rgba(255,0,0,0.2)";
  setTimeout(() => {
    el.style.outline = "";
    el.style.backgroundColor = "";
  }, 1000);
}

// ⏱️ SLEEP
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

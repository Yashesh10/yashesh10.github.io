document.documentElement.classList.add('js');

// Mobile menu
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Nav border on scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Highlight current section in nav
const links = [...navLinks.querySelectorAll('a[href^="#"]')];
const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  // Reveal on scroll
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); reveal.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

// Typing effect for the role line
const roles = ['Digital Forensics Analyst', 'Security Researcher', 'Detection Engineering', 'AI/ML Security'];
const typed = document.getElementById('typed');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (typed && !reduce) {
  let r = 0, i = roles[0].length, deleting = true;
  const tick = () => {
    const word = roles[r];
    if (deleting) {
      i--;
      if (i <= 0) { deleting = false; r = (r + 1) % roles.length; }
    } else {
      i++;
      if (i >= roles[r].length) { deleting = true; typed.textContent = roles[r]; return setTimeout(tick, 2200); }
    }
    typed.textContent = (deleting ? word : roles[r]).slice(0, Math.max(i, 0));
    setTimeout(tick, deleting ? 40 : 75);
  };
  setTimeout(tick, 2400);
}

// Footer year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// ===== Research charts (data from the Snort ATT&CK coverage repo outputs) =====
const techniques = [
  ['T1105', 'Ingress Tool Transfer', 196],
  ['T1071.001', 'Web Protocols', 60],
  ['T1056', 'Input Capture', 25],
  ['T1020', 'Automated Exfiltration', 20],
  ['T1018', 'Remote System Discovery', 19],
  ['T1040', 'Network Sniffing', 19],
  ['T1046', 'Network Service Discovery', 19],
  ['T1014', 'Rootkit', 18],
  ['T1078', 'Valid Accounts', 16],
  ['T1192', 'Spearphishing Link', 15, 'Legacy ID, revoked in current ATT&CK (now T1566.002)']
];
const validation = [
  ['Mismatch', 182, 'LLM predicted no technique in common with the existing mapping'],
  ['Exact match', 166, 'LLM predicted exactly the same ATT&CK ID set'],
  ['No prediction', 57, 'LLM declined to predict from the rule evidence'],
  ['Partial match', 25, 'At least one shared ID and at least one difference']
];

const tip = document.getElementById('tip');
function showTip(e, html) {
  tip.innerHTML = html; tip.hidden = false;
  const r = (e.currentTarget || e.target).getBoundingClientRect();
  const x = e.clientX ?? (r.left + r.width / 2), y = e.clientY ?? r.top;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 14)) + 'px';
  tip.style.top = Math.max(8, y - h - 12) + 'px';
}
const hideTip = () => { tip.hidden = true; };
window.addEventListener('scroll', hideTip, { passive: true });

function renderBars(el, rows, total) {
  if (!el) return;
  const max = Math.max(...rows.map(r => r.value));
  el.innerHTML = '';
  rows.forEach(r => {
    const pct = (r.value / total * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'bar-row'; row.tabIndex = 0; row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', `${r.aria}: ${r.value} rules, ${pct}%`);
    row.innerHTML = `<span class="bar-label">${r.label}</span>
      <span class="bar-track"><span class="bar-fill" data-w="${(r.value / max * 100).toFixed(2)}"></span></span>
      <span class="bar-value">${r.value}</span>`;
    const html = `<strong>${r.title}</strong>${r.value} of ${total} rules (${pct}%)${r.note ? `<br><span>${r.note}</span>` : ''}`;
    row.addEventListener('mousemove', e => showTip(e, html));
    row.addEventListener('mouseleave', hideTip);
    row.addEventListener('focus', e => showTip({ currentTarget: row }, html));
    row.addEventListener('blur', hideTip);
    row.addEventListener('touchstart', e => showTip({ currentTarget: row, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }, html), { passive: true });
    el.appendChild(row);
  });
}

renderBars(document.getElementById('chart-techniques'),
  techniques.map(([id, name, v, note]) => ({ label: `<code>${id}</code>${name}`, aria: `${id} ${name}`, title: `${id} · ${name}`, value: v, note })), 430);
renderBars(document.getElementById('chart-validation'),
  validation.map(([name, v, note]) => ({ label: name, aria: name, title: name, value: v, note })), 430);

// Animate bars when charts scroll into view
const growBars = root => root.querySelectorAll('.bar-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { growBars(en.target); io.unobserve(en.target); }
  }), { threshold: 0.3 });
  document.querySelectorAll('.bars').forEach(b => io.observe(b));
} else {
  document.querySelectorAll('.bars').forEach(growBars);
}

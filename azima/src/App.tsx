import { useEffect, useState } from 'react';
import { setReminder } from './reminder';

type St = 'ok' | 'bad';
type Days = Record<string, St>;
type Cfg = { pin: string; splash: boolean; remind: boolean; time: string; ws: number; mode: string; mine: string[] };

const KD = 'azima_days_v1', KC = 'azima_cfg_v1';
const CFG0: Cfg = { pin: '', splash: true, remind: false, time: '21:00', ws: 1, mode: 'dark', mine: [] };
const MILES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
const DS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // Sunday..Saturday

const GEN = [
  'كل يوم تنتصر فيه على نفسك هو لبنة في بناء شخصيتك.',
  'القوة الحقيقية أن تملك نفسك عند الرغبة.',
  'لا تنظر إلى الجبل كله، خطوة اليوم تكفي.',
  'أنت أقوى من لحظة ضعف عابرة.',
  'الرغبة موجة؛ تعلو ثم تهدأ. اصبر وستمرّ.',
  'استبدل الرغبة بحركة: امشِ، اشرب ماء، تنفّس بعمق.',
  'اشغل وقتك بما يبنيك، فالفراغ أكبر خصوم الإرادة.',
  'عزيمتك اليوم هي حرية غدك.',
  'لا تقارن يومك الأول بيوم غيرك المئة.',
  'كل مرة تقول فيها «لا»، تصبح أسهل في المرة القادمة.',
  'النوم المبكر والرياضة والانشغال أسلحتك الهادئة.',
  'ابدأ يومك بهدف صغير وأنجزه، فالإنجاز يغذّي الإرادة.',
  'أنت لا تحرم نفسك من شيء، أنت تكسب احترامك لنفسك.',
  'مجرد محاولتك اليوم دليل على قوتك.',
  'ابتعد عن مواطن الضعف: الهاتف في الليل، الوحدة الطويلة، الفراغ.',
];
const SOFT = [
  'سقطتَ؟ لا بأس. الأقوياء ينهضون ويكملون.',
  'الانتكاسة درس وليست حكماً نهائياً. ابدأ من جديد الآن.',
  'لا تجلد نفسك؛ افهم ما الذي أثّر عليك وتجنّبه غداً.',
  'يوم واحد لا يمحو ما بنيته. عُد إلى الطريق.',
  'كل بداية جديدة شجاعة، وأنت شجاع.',
  'غداً صفحة بيضاء. المهم ألّا تستسلم.',
  'اسأل نفسك بلطف: ما المحفّز؟ ثم ضع خطة لتجنّبه.',
];
const PROUD = [
  'أسبوع من الثبات! أنت تثبت لنفسك أنك قادر.',
  'ثباتك ملهم، واصل بنفس الإيقاع.',
  'كل يوم إضافي يزيد ثقتك بنفسك.',
  'انظر كم قطعت من الطريق؛ أنت بطل قصتك.',
  'انضباطك اليوم يصنع الفارق الكبير غداً.',
  'أنت تبني عادة جديدة قوية، لا تتوقف الآن.',
];

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addD = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sow = (d: Date, ws: number) => addD(d, -((d.getDay() - ws + 7) % 7));
const rd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const loadJ = <T,>(k: string, f: T): T => { try { return { ...f, ...JSON.parse(localStorage.getItem(k) || 'null') }; } catch { return f; } };

function streakOf(days: Days, today: Date) {
  let d = new Date(today);
  if (!days[key(d)]) d = addD(d, -1);
  let n = 0;
  while (days[key(d)] === 'ok') { n++; d = addD(d, -1); }
  return n;
}
function bestOf(days: Days) {
  let best = 0, run = 0, prev: Date | null = null;
  Object.keys(days).filter((k) => days[k] === 'ok').sort().forEach((k) => {
    run = prev && key(addD(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run); prev = parse(k);
  });
  return best;
}

const Sq = ({ d, st, today, fut, on }: { d: Date; st?: St; today: boolean; fut: boolean; on: () => void }) => (
  <button className={'sq ' + (st || '') + (today ? ' today' : '') + (fut ? ' fut' : '')} disabled={fut} onClick={on}>{d.getDate()}</button>
);
const Seg = ({ v, o, on }: { v: string; o: [string, string][]; on: (x: string) => void }) => (
  <div className="seg">{o.map(([k, l]) => <button key={k} className={v === k ? 'on' : ''} onClick={() => on(k)}>{l}</button>)}</div>
);

export default function App() {
  const [days, setDays] = useState<Days>(() => loadJ<Days>(KD, {}));
  const [cfg, setCfg] = useState<Cfg>(() => loadJ<Cfg>(KC, CFG0));
  const [tab, setTab] = useState<'home' | 'log' | 'report' | 'set'>('home');
  const [locked, setLocked] = useState(!!loadJ<Cfg>(KC, CFG0).pin);
  const [typed, setTyped] = useState('');
  const [mc, setMc] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [toast, setToast] = useState('');
  const [newPin, setNewPin] = useState('');
  const [mine, setMine] = useState('');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tk = key(today);

  const streak = streakOf(days, today);
  const recentBad = days[tk] === 'bad' || days[key(addD(today, -1))] === 'bad';
  const [phrase, setPhrase] = useState(() => '');
  const [splash, setSplash] = useState(cfg.splash);
  const nextPhrase = () => {
    const pool = recentBad ? [...SOFT, ...GEN] : streak >= 7 ? [...PROUD, ...GEN] : GEN;
    setPhrase(rd([...pool, ...cfg.mine]));
  };
  useEffect(() => { nextPhrase(); /* once on open */ // eslint-disable-next-line
  }, []);
  useEffect(() => { if (splash && !locked) { const t = setTimeout(() => setSplash(false), 8000); return () => clearTimeout(t); } }, [splash, locked]);
  useEffect(() => { try { localStorage.setItem(KC, JSON.stringify(cfg)); } catch { /* ignore */ } document.documentElement.setAttribute('data-theme', cfg.mode); }, [cfg]);
  useEffect(() => { setReminder(cfg.remind, cfg.time); }, [cfg.remind, cfg.time]);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const up = (p: Partial<Cfg>) => setCfg({ ...cfg, ...p });
  const setDay = (k: string, st?: St) => {
    const n = { ...days }; if (st) n[k] = st; else delete n[k];
    setDays(n); try { localStorage.setItem(KD, JSON.stringify(n)); } catch { /* ignore */ }
    if (st === 'ok') { const s = streakOf(n, today); if (MILES.includes(s) && k === tk) say(`🎉 ${s} ${s === 1 ? 'يوم' : 'أيام'} متتالية! أنت رائع`); }
    if (st === 'bad') say('لا بأس. غداً بداية جديدة 💙');
  };
  const cyc = (k: string) => setDay(k, days[k] === undefined ? 'ok' : days[k] === 'ok' ? 'bad' : undefined);
  const pressToday = (st: St) => setDay(tk, days[tk] === st ? undefined : st);

  const next = MILES.find((m) => m > streak) || 365;
  const prevM = [0, ...MILES].filter((m) => m <= streak).pop() || 0;
  const pct = Math.min(1, (streak - prevM) / (next - prevM));
  const C = 2 * Math.PI * 78;
  const totalOk = Object.values(days).filter((v) => v === 'ok').length;
  const best = bestOf(days);

  const weekOf = (start: Date) => Array.from({ length: 7 }, (_, i) => addD(start, i));
  const dsq = (d: Date) => <Sq key={key(d)} d={d} st={days[key(d)]} today={key(d) === tk} fut={d > today} on={() => cyc(key(d))} />;
  const head = Array.from({ length: 7 }, (_, i) => DS[(cfg.ws + i) % 7]);

  const mstat = (y: number, m: number) => {
    const s = new Date(y, m, 1), e = new Date(y, m + 1, 0);
    const list = Array.from({ length: e.getDate() }, (_, i) => new Date(y, m, i + 1));
    const elapsed = list.filter((d) => d <= today).length;
    const ok = list.filter((d) => days[key(d)] === 'ok').length;
    const bad = list.filter((d) => days[key(d)] === 'bad').length;
    let b = 0, r = 0;
    list.forEach((d) => { r = days[key(d)] === 'ok' ? r + 1 : 0; b = Math.max(b, r); });
    return { s, list, elapsed, ok, bad, best: b, rate: elapsed ? Math.round((ok / elapsed) * 100) : 0 };
  };
  const ms = mstat(mc.getFullYear(), mc.getMonth());
  const pm = mstat(mc.getMonth() === 0 ? mc.getFullYear() - 1 : mc.getFullYear(), (mc.getMonth() + 11) % 12);
  const diff = ms.rate - pm.rate;
  const groups: { k: string; n: number; t: number }[] = [];
  ms.list.forEach((d) => {
    const g = key(sow(d, cfg.ws));
    let x = groups.find((q) => q.k === g); if (!x) { x = { k: g, n: 0, t: 0 }; groups.push(x); }
    if (d <= today) x.t++; if (days[key(d)] === 'ok') x.n++;
  });
  const lead = (ms.s.getDay() - cfg.ws + 7) % 7;
  const verdict = ms.elapsed === 0 ? 'لا توجد بيانات بعد لهذا الشهر.' : ms.rate >= 80 ? 'شهر رائع! ثباتك ظاهر، واصل هكذا.' : ms.rate >= 50 ? 'تقدّم جيد. حاول رفع نسبتك قليلاً كل أسبوع.' : 'لا بأس، البدايات صعبة. ركّز على اليوم الحالي فقط.';

  if (locked) {
    const press = (d: string) => { const t = typed + d; if (t.length === cfg.pin.length) { if (t === cfg.pin) { setLocked(false); setTyped(''); } else { setTyped(''); say('رمز غير صحيح'); } } else setTyped(t); };
    return (
      <div className="lock">
        <h1>عزيمة</h1><p className="mut">أدخل الرمز</p>
        <div className="dots">{Array.from({ length: cfg.pin.length }, (_, i) => <i key={i} className={i < typed.length ? 'f' : ''} />)}</div>
        <div className="pad">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) => d === '' ? <span key={i} /> : <button key={i} onClick={() => d === '⌫' ? setTyped(typed.slice(0, -1)) : press(d)}>{d}</button>)}</div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <>
      <div className="aurora" />
      {toast && <div className="toast">{toast}</div>}
      {splash && (
        <div className="splash" onClick={() => setSplash(false)}>
          <div className="sun" />
          <p className="big">{phrase}</p>
          <span className="mut">اضغط للمتابعة</span>
        </div>
      )}

      {tab === 'home' && (
        <>
          <h1>عزيمة</h1>
          <div className="ringw">
            <svg viewBox="0 0 180 180" width="210" height="210">
              <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="1" stopColor="#818cf8" /></linearGradient></defs>
              <circle cx="90" cy="90" r="78" fill="none" stroke="var(--s2)" strokeWidth="12" />
              <circle cx="90" cy="90" r="78" fill="none" stroke="url(#rg)" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 90 90)" className="prog" />
            </svg>
            <div className="ringt"><b>{streak}</b><span>{streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}</span><small>الهدف القادم: {next}</small></div>
          </div>
          <div className="stats3">
            <div><b>{best}</b><span>أطول سلسلة</span></div>
            <div><b>{totalOk}</b><span>إجمالي أيام الالتزام</span></div>
            <div><b>{ms.rate}%</b><span>نسبة هذا الشهر</span></div>
          </div>
          <div className="card">
            <b>كيف كان يومك؟</b>
            <div className="acts">
              <button className={'btn okb' + (days[tk] === 'ok' ? ' on' : '')} onClick={() => pressToday('ok')}>✓ التزمت اليوم</button>
              <button className={'btn badb' + (days[tk] === 'bad' ? ' on' : '')} onClick={() => pressToday('bad')}>✕ لم أستطع</button>
            </div>
          </div>
          <div className="card">
            <div className="row"><b>هذا الأسبوع</b><span className="mut">اضغط على المربع للتعديل</span></div>
            <div className="wk7">{head.map((h, i) => <em key={i}>{h}</em>)}</div>
            <div className="wk7">{weekOf(sow(today, cfg.ws)).map(dsq)}</div>
          </div>
          <div className="card quote" onClick={nextPhrase}><p>{phrase}</p><span className="mut">اضغط لعبارة أخرى ↻</span></div>
        </>
      )}

      {tab === 'log' && (
        <>
          <h2>سجل الأسابيع</h2>
          <div className="legend"><span><i className="sq ok" /> التزام</span><span><i className="sq bad" /> انتكاسة</span><span><i className="sq" /> بدون تسجيل</span></div>
          <div className="wk7 hd">{head.map((h, i) => <em key={i}>{h}</em>)}</div>
          {Array.from({ length: 12 }, (_, w) => { const s = addD(sow(today, cfg.ws), -7 * w); return (
            <div className="wrow" key={w}><div className="wk7">{weekOf(s).map(dsq)}</div><span className="mut">{s.getDate()} {MONTHS[s.getMonth()]}</span></div>
          ); })}
        </>
      )}

      {tab === 'report' && (
        <>
          <div className="row mhead">
            <button className="ico" onClick={() => setMc(new Date(mc.getFullYear(), mc.getMonth() - 1, 1))}>›</button>
            <h2>{MONTHS[mc.getMonth()]} {mc.getFullYear()}</h2>
            <button className="ico" onClick={() => setMc(new Date(mc.getFullYear(), mc.getMonth() + 1, 1))}>‹</button>
          </div>
          <div className="hero"><span>نسبة الالتزام</span><b>{ms.rate}%</b>
            <small>{ms.elapsed > 0 && pm.elapsed > 0 ? (diff >= 0 ? `▲ ${diff}% عن الشهر الماضي` : `▼ ${-diff}% عن الشهر الماضي`) : verdict}</small></div>
          <div className="stats3">
            <div><b className="g">{ms.ok}</b><span>أيام التزام</span></div>
            <div><b className="r">{ms.bad}</b><span>انتكاسات</span></div>
            <div><b>{ms.best}</b><span>أطول سلسلة</span></div>
          </div>
          <div className="card"><b>الأسابيع</b>
            <div className="bars">{groups.map((g, i) => <div key={g.k}><div className="col"><i style={{ height: (g.t ? (g.n / g.t) * 100 : 0) + '%', animationDelay: i * 80 + 'ms' }} /></div><em>{g.n}/{g.t}</em></div>)}</div>
          </div>
          <div className="card"><b>تقويم الشهر</b>
            <div className="wk7 hd">{head.map((h, i) => <em key={i}>{h}</em>)}</div>
            <div className="wk7">{Array.from({ length: lead }, (_, i) => <span key={'l' + i} />)}{ms.list.map(dsq)}</div>
          </div>
          <p className="mut" style={{ textAlign: 'center' }}>{verdict}</p>
        </>
      )}

      {tab === 'set' && (
        <>
          <h2>الإعدادات</h2>
          <div className="card">
            <label className="lab">المظهر</label><Seg v={cfg.mode} o={[['dark', '🌙 داكن'], ['light', '☀️ فاتح']]} on={(x) => up({ mode: x })} />
            <label className="lab">بداية الأسبوع</label><Seg v={String(cfg.ws)} o={[['6', 'السبت'], ['0', 'الأحد'], ['1', 'الاثنين']]} on={(x) => up({ ws: +x })} />
            <label className="lab">عبارة تحفيزية عند فتح التطبيق</label><Seg v={cfg.splash ? '1' : '0'} o={[['1', 'مفعّلة'], ['0', 'متوقفة']]} on={(x) => up({ splash: x === '1' })} />
          </div>
          <div className="card">
            <label className="lab">تذكير يومي (على الهاتف)</label><Seg v={cfg.remind ? '1' : '0'} o={[['1', 'مفعّل'], ['0', 'متوقف']]} on={(x) => up({ remind: x === '1' })} />
            {cfg.remind && <input type="time" value={cfg.time} onChange={(e) => up({ time: e.target.value })} style={{ marginTop: 10 }} />}
          </div>
          <div className="card">
            <label className="lab">رمز قفل التطبيق {cfg.pin ? '(مفعّل)' : ''}</label>
            <div className="acts">
              <input type="password" inputMode="numeric" maxLength={6} placeholder="4 إلى 6 أرقام" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} />
              <button className="btn" onClick={() => { if (newPin.length < 4) return say('الرمز 4 أرقام على الأقل'); up({ pin: newPin }); setNewPin(''); say('تم حفظ الرمز'); }}>حفظ</button>
              {cfg.pin && <button className="btn sec" onClick={() => { up({ pin: '' }); say('أُزيل الرمز'); }}>إزالة</button>}
            </div>
          </div>
          <div className="card">
            <label className="lab">أضف عبارتك التحفيزية</label>
            <div className="acts"><input value={mine} onChange={(e) => setMine(e.target.value)} /><button className="btn" onClick={() => { if (mine.trim()) { up({ mine: [...cfg.mine, mine.trim()] }); setMine(''); } }}>إضافة</button></div>
            {cfg.mine.map((m, i) => <div className="row mine" key={i}><span>{m}</span><button className="ico" onClick={() => up({ mine: cfg.mine.filter((_, j) => j !== i) })}>✕</button></div>)}
          </div>
          <div className="card">
            <p className="mut">بياناتك تُحفظ على جهازك فقط ولا تُرسل لأي جهة. التطبيق أداة للتنظيم والتحفيز وليس بديلاً عن مختص؛ وإن شعرت بضيق شديد فتحدّث مع شخص تثق به أو مع مختص.</p>
            <button className="btn sec" style={{ width: '100%' }} onClick={() => { if (confirm('حذف كل سجلاتك نهائياً؟')) { setDays({}); try { localStorage.removeItem(KD); } catch { /* ignore */ } say('تم حذف السجل'); } }}>حذف كل السجل</button>
          </div>
        </>
      )}

      <nav className="nav">{([['home', '🏠', 'اليوم'], ['log', '▦', 'السجل'], ['report', '📊', 'التقرير'], ['set', '⚙️', 'الإعدادات']] as const).map(([k, i, l]) => (
        <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><span>{i}</span>{l}</button>
      ))}</nav>
    </>
  );
}

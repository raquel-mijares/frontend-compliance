import { ConsentState } from '../src/consent';
import { TagLoader } from '../src/loader';
import { TagRegistry, type AudienceContext } from '../src/contexts';

const registry = new TagRegistry();
registry.register(
  {
    id: 'ga4',
    category: 'analytics',
    src: 'https://www.googletagmanager.com/gtag/js?id=G-DEMO',
  },
  ['general'],
);
registry.register(
  {
    id: 'meta',
    category: 'advertising',
    src: 'https://connect.facebook.net/en_US/fbevents.js',
  },
  ['general'],
);

const audience: AudienceContext =
  new URLSearchParams(location.search).get('audience') === 'kids' ? 'kids' : 'general';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

const globals = window as Window & { fbq?: Fbq; _fbq?: Fbq };
if (!globals.fbq) {
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as Fbq;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  globals.fbq = fbq;
  globals._fbq ??= fbq;
}

const consent = new ConsentState();
const loader = new TagLoader(consent, registry.for(audience));

const banner = document.getElementById('banner') as HTMLElement;
const state = document.getElementById('state') as HTMLElement;
const form = document.getElementById('signup') as HTMLFormElement;
const settings = document.getElementById('settings') as HTMLButtonElement;
const reject = document.getElementById('reject') as HTMLButtonElement;
const accept = document.getElementById('accept') as HTMLButtonElement;

let dismissed = false;
let returnFocusTo: HTMLElement | null = null;

function open(): void {
  dismissed = false;
  returnFocusTo = document.activeElement as HTMLElement | null;
  render();
  reject.focus();
}

function close(): void {
  dismissed = true;
  render();
  (returnFocusTo ?? settings).focus();
}

function render(): void {
  banner.hidden = consent.resolved || dismissed;
  state.textContent = `consent: analytics=${consent.get('analytics')} advertising=${consent.get('advertising')}`;
}

banner.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  if (e.key !== 'Tab') return;

  const focusable = [reject, accept];
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  const active = document.activeElement;

  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
});

settings.addEventListener('click', () => {
  consent.withdraw();
  loader.reloadOnWithdrawal();
  open();
});

accept.addEventListener('click', () => {
  consent.acceptAll();
  close();
});

reject.addEventListener('click', () => {
  consent.rejectAll();
  close();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  void fetch('/api/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: data.get('email'),
      phone: data.get('phone'),
    }),
  }).catch(() => {});
  history.replaceState(null, '', '/welcome');
});

consent.subscribe(render);
loader.start();
render();

if (!consent.resolved) {
  returnFocusTo = settings;
  reject.focus();
}

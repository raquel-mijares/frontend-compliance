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

const consent = new ConsentState();
const loader = new TagLoader(consent, registry.for(audience));

const banner = document.getElementById('banner') as HTMLElement;
const state = document.getElementById('state') as HTMLElement;
const form = document.getElementById('signup') as HTMLFormElement;

function render(): void {
  banner.hidden = consent.resolved;
  state.textContent = `consent: analytics=${consent.get('analytics')} advertising=${consent.get('advertising')}`;
}

document.getElementById('accept')!.addEventListener('click', () => {
  consent.acceptAll();
  render();
});

document.getElementById('reject')!.addEventListener('click', () => {
  consent.rejectAll();
  render();
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

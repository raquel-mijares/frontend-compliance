import { ConsentState } from '../src/consent';
import { TagLoader, type Tag } from '../src/loader';

const TAGS: Tag[] = [
  {
    id: 'ga4',
    category: 'analytics',
    src: 'https://www.googletagmanager.com/gtag/js?id=G-DEMO',
  },
  {
    id: 'meta',
    category: 'advertising',
    src: 'https://connect.facebook.net/en_US/fbevents.js',
  },
];

const consent = new ConsentState();
const loader = new TagLoader(consent, TAGS);

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

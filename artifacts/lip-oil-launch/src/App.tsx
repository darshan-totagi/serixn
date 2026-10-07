import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateEarlyAccessSignup } from '@workspace/api-client-react';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { brandConfig, primaryCta } from './config';

type SignupFields = { firstName: string; email: string; whatsappNumber: string };
const defaultSignupDestination = '/api/early-access';

function emit(name: string, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function AccessLink({ children = primaryCta, className = '' }: { children?: string; className?: string }) {
  const destination = brandConfig.launchMode === 'prelaunch' ? '#early-access' : '#product';
  return (
    <a className={`cta-link ${className}`} href={destination} onClick={() => emit('lip_oil_cta_click', { label: children, destination })}>
      <span>{children}</span><span aria-hidden="true">↗</span>
    </a>
  );
}

function EarlyAccessForm({ compact = false }: { compact?: boolean }) {
  const signup = useCreateEarlyAccessSignup();
  const [fields, setFields] = useState<SignupFields>({ firstName: '', email: '', whatsappNumber: '' });
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const update = (key: keyof SignupFields) => (event: ChangeEvent<HTMLInputElement>) =>
    setFields((previous) => ({ ...previous, [key]: event.target.value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    const data = {
      firstName: fields.firstName.trim(),
      email: fields.email.trim(),
      ...(fields.whatsappNumber.trim() ? { whatsappNumber: fields.whatsappNumber.trim() } : {}),
    };

    try {
      if (brandConfig.signupDestination === defaultSignupDestination) {
        await signup.mutateAsync({ data });
      } else {
        const response = await fetch(brandConfig.signupDestination, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Signup endpoint returned ${response.status}`);
      }
      setSubmitted(true);
      emit('lip_oil_signup_success', { destination: brandConfig.signupDestination });
    } catch {
      setLocalError('We couldn’t save your details just now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <div className={`success-note ${compact ? 'success-note-compact' : ''}`} role="status" data-testid="status-signup-success">
      <span className="eyebrow">EARLY ACCESS · CONFIRMED</span>
      <h3 className="serif">YOU’RE IN.</h3>
      <p>Watch your inbox. Something beautiful is coming.</p>
    </div>;
  }

  return (
    <form ref={formRef} className={`signup-form ${compact ? 'signup-form-compact' : ''}`} onSubmit={submit}>
      <label className="sr-only" htmlFor={compact ? 'footer-first-name' : 'first-name'}>First name</label>
      <input className="input-line" id={compact ? 'footer-first-name' : 'first-name'} name="firstName" autoComplete="given-name" placeholder="First name" value={fields.firstName} onChange={update('firstName')} required maxLength={80} data-testid="input-first-name" />
      <label className="sr-only" htmlFor={compact ? 'footer-email' : 'email'}>Email address</label>
      <input className="input-line" id={compact ? 'footer-email' : 'email'} name="email" type="email" autoComplete="email" placeholder="Email address" value={fields.email} onChange={update('email')} required maxLength={254} data-testid="input-email" />
      <label className="sr-only" htmlFor={compact ? 'footer-whatsapp' : 'whatsapp'}>WhatsApp number (optional)</label>
      <input className="input-line" id={compact ? 'footer-whatsapp' : 'whatsapp'} name="whatsappNumber" type="tel" autoComplete="tel" placeholder="WhatsApp number (optional)" value={fields.whatsappNumber} onChange={update('whatsappNumber')} maxLength={32} data-testid="input-whatsapp" />
      {(localError || signup.isError) && <p className="form-error" role="alert" data-testid="status-signup-error">{localError || 'We couldn’t save your details just now. Please try again.'}</p>}
      <button className="button-dark form-submit" type="submit" disabled={isSubmitting || signup.isPending} data-testid="button-submit-signup">
        {isSubmitting || signup.isPending ? 'SAVING YOUR PLACE…' : 'JOIN THE LIST'} <ArrowRight size={14} aria-hidden="true" />
      </button>
      <p className="form-privacy">For first-drop updates only. Privacy details will be shared before launch.</p>
    </form>
  );
}

const queryClient = new QueryClient();

function LaunchPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeShade, setActiveShade] = useState(0);
  const pageViewed = useRef(false);

  useEffect(() => {
    const title = `${brandConfig.brandName} — A new kind of lip oil`;
    const description = `Meet ${brandConfig.brandName}: a new generation of lip care, made to be seen. Discover our first luxury lip oil and join the list for early access at launch.`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
    if (brandConfig.publicSiteUrl) {
      const canonicalUrl = `${brandConfig.publicSiteUrl}/`;
      let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = canonicalUrl;
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', `${brandConfig.publicSiteUrl}${brandConfig.images.hero}`);
      document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', `${brandConfig.publicSiteUrl}${brandConfig.images.hero}`);
    }
    if (!pageViewed.current) {
      emit('lip_oil_page_view', { page: '/', brand: brandConfig.brandName });
      pageViewed.current = true;
    }
    const onScroll = () => {
      setScrolled(window.scrollY > 28);
      const available = document.documentElement.scrollHeight - window.innerHeight;
      if (available <= 0) return;
      const depth = Math.floor((window.scrollY / available) * 100);
      [25, 50, 75, 90].forEach((threshold) => {
        const key = `lip-oil-depth-${threshold}`;
        if (depth >= threshold && !sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          emit('lip_oil_scroll_depth', { percent: threshold });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const onInstagramClick = () => emit('lip_oil_instagram_click', { url: brandConfig.instagramUrl });
  const handleShade = (index: number) => {
    setActiveShade(index);
    emit('lip_oil_product_interaction', { interaction: 'shade_focus', shade: brandConfig.shadeName });
  };

  return (
    <div className="grain overflow-hidden">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className={`site-header fixed inset-x-0 top-0 z-30 border-b border-transparent ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="brand-mark" href="#top" aria-label={`${brandConfig.brandName} home`} data-testid="link-home">{brandConfig.logo}</a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a className="nav-link" href="#product">THE LIP OIL</a>
            <a className="nav-link" href="#story">OUR STORY</a>
            <a className="nav-link" href="#journal">JOURNAL</a>
          </nav>
          <div className="nav-right"><AccessLink className="nav-cta" />
            <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && <nav className="mobile-menu" aria-label="Mobile navigation">
          <a href="#product" onClick={closeMenu}>THE LIP OIL</a><a href="#story" onClick={closeMenu}>OUR STORY</a><a href="#journal" onClick={closeMenu}>JOURNAL</a><a href="#early-access" onClick={closeMenu}>{primaryCta}</a>
        </nav>}
      </header>

      <main id="main-content">
        <section className="hero-photo hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow hero-kicker reveal">A NEW BEAUTY RITUAL · COMING SOON</p>
            <h1 id="hero-title" className="serif reveal reveal-delay-1">YOUR LIPS,<br /><em>ELEVATED.</em></h1>
            <p className="hero-sub reveal reveal-delay-2">A new generation of lip care,<br className="desktop-only" /> made to be seen.</p>
            <div className="hero-actions reveal reveal-delay-3">
              <AccessLink />
              <a className="story-link" href="#story"><span>DISCOVER THE STORY</span><ArrowDown size={13} /></a>
            </div>
          </div>
          <div className="hero-caption"><span>THE FIRST LOOK</span><span>01 / {brandConfig.brandName.toUpperCase()}</span></div>
          <a href="#statement" className="scroll-cue" aria-label="Scroll to discover"><span></span></a>
        </section>

        <section className="statement section-pad" id="statement">
          <div className="statement-side eyebrow reveal">A NOTE ON BEAUTY<br />FROM {brandConfig.brandName.toUpperCase()}</div>
          <div className="statement-main reveal reveal-delay-1">
            <p className="eyebrow">LESS, BUT MORE MEANINGFUL.</p>
            <h2 className="serif">WE BELIEVE<br />LIP CARE SHOULD<br /><em>LOOK AS GOOD</em><br />AS IT FEELS.</h2>
          </div>
          <div className="statement-foot"><span className="eyebrow">BEAUTY, EDITED.</span><span className="serif">01—04</span></div>
        </section>

        <section className="product section-pad" id="product" aria-labelledby="product-title">
          <div className="product-heading reveal">
            <div><p className="eyebrow">THE FIRST, AND ONLY FOR NOW</p><h2 id="product-title" className="serif">Meet your<br /><em>new constant.</em></h2></div>
            <p className="product-intro">{brandConfig.productDescription}</p>
          </div>
          <div className="product-layout">
            <div className="product-image image-hover reveal">
              <img src={brandConfig.images.product} alt="A lip oil concept still life in warm light, photographed on natural stone" width="980" height="1190" loading="lazy" />
              <span className="image-note">A STUDY IN SOFT LIGHT</span>
            </div>
            <div className="product-detail reveal reveal-delay-2">
              <span className="eyebrow">{brandConfig.brandName.toUpperCase()} · LIP OIL Nº 01</span>
              <h3 className="serif" id="product-name">{brandConfig.productName}</h3>
              <p className="eyebrow product-category">LUXURY LIP OIL</p>
              <p className="product-description">{brandConfig.productDescription}</p>
              <div className="product-meta"><div><span className="eyebrow">SHADE</span><p>01 — {brandConfig.shadeName}</p></div>{brandConfig.launchMode === 'full' && brandConfig.price && <span className="eyebrow product-price">{brandConfig.price}</span>}</div>
              <button className="shade-choice" type="button" aria-label={`Explore shade ${brandConfig.shadeName}`} aria-pressed={activeShade === 0} onClick={() => handleShade(0)} data-testid="button-shade">
                <span className={`shade-dot ${activeShade === 0 ? 'is-active' : ''}`}></span><span className="eyebrow">01 · {brandConfig.shadeName}</span><ArrowUpRight size={15} />
              </button>
              <a href="#formula" className="cta-link formula-link">MEET THE FORMULA <span>↗</span></a>
              <p className="availability-note">PRE-LAUNCH · JOIN FOR FIRST ACCESS</p>
            </div>
          </div>
        </section>

        <section className="sensory" aria-label="The lip oil experience">
          <div className="sensory-image image-hover">
            <img src={brandConfig.images.texture} alt="Translucent nude lip oil texture catching soft highlights" width="1200" height="1000" loading="lazy" />
            <span className="sensory-index eyebrow">THE FEELING, IN THREE NOTES</span>
          </div>
          <div className="sensory-copy">
            <p className="eyebrow reveal">AN EXERCISE IN RESTRAINT</p>
            <h2 className="serif reveal reveal-delay-1">A little more<br /><em>like you.</em></h2>
            <ul className="sensory-list">
              <li className="reveal"><span>01</span><span>GLASS-LIKE SHINE</span><i></i></li>
              <li className="reveal reveal-delay-1"><span>02</span><span>WEIGHTLESS FEEL</span><i></i></li>
              <li className="reveal reveal-delay-2"><span>03</span><span>EVERYDAY COLOR</span><i></i></li>
            </ul>
            <p className="sensory-disclaimer">A first impression of the experience we’re creating. Final product details are in development.</p>
          </div>
        </section>

        <section className="story section-pad" id="story">
          <div className="story-copy">
            <p className="eyebrow reveal">A SMALLER, MORE PERSONAL KIND OF BEAUTY</p>
            <h2 className="serif reveal reveal-delay-1">BEAUTY,<br /><em>WITHOUT<br />THE NOISE.</em></h2>
            <p className="story-body reveal reveal-delay-2">We’re building a beauty brand around one idea: fewer products, better experiences.</p>
            <p className="story-body story-body-small reveal reveal-delay-2">One considered essential. Made with intention. Designed for the moments that are already yours.</p>
            <a className="cta-link reveal reveal-delay-3" href="#journal">READ OUR JOURNAL <span>↗</span></a>
          </div>
          <figure className="story-figure image-hover reveal reveal-delay-1">
            <img src={brandConfig.images.hero} alt="An intimate beauty portrait in warm natural light" width="850" height="1080" loading="lazy" />
            <figcaption><span className="eyebrow">THE {brandConfig.brandName.toUpperCase()} POINT OF VIEW</span><span className="serif">Quietly considered.</span></figcaption>
          </figure>
          <div className="story-vertical eyebrow">AN OPENING CHAPTER · EST. [YEAR]</div>
        </section>

        <section className="formula section-pad" id="formula">
          <div className="formula-top reveal"><span className="eyebrow">A WORK IN PROGRESS</span><span className="eyebrow">02 / THE FORMULA</span></div>
          <div className="formula-grid">
            <div className="formula-heading reveal"><h2 className="serif">The formula,<br /><em>still unfolding.</em></h2></div>
            <div className="formula-copy reveal reveal-delay-2">
              <p className="eyebrow">THOUGHTFULLY DEVELOPED FOR A COMFORTABLE, GLOSSY FINISH.</p>
              <p>We’re taking the time to get the details right. The final formula and ingredient list will be shared here once confirmed.</p>
              <div className="ingredient-placeholder"><span className="eyebrow">INGREDIENTS</span><span>{brandConfig.ingredients}</span></div>
              <div className="ingredient-placeholder"><span className="eyebrow">FORMULA STATUS</span><span>In development · final details to follow</span></div>
            </div>
          </div>
          <div className="formula-foot eyebrow">NO CLAIMS BEFORE THE FACTS. ALWAYS.</div>
          <div className="faq-strip" id="faq">
            <p className="eyebrow">A FEW THINGS, ANSWERED</p>
            <details>
              <summary>Can I shop the lip oil now?</summary>
              <p>Not yet. The first drop is in preparation. Join the early-access list and we’ll share launch news when it’s confirmed.</p>
            </details>
            <details>
              <summary>What’s in the formula?</summary>
              <p>The final formula and ingredient list are still being confirmed. We’ll share verified details here before launch.</p>
            </details>
            <details>
              <summary>When is the first drop?</summary>
              <p>The launch date has not been announced. Early-access members will hear from us when there’s news to share.</p>
            </details>
          </div>
        </section>

        <section className="shade-story" aria-label="Shade experience">
          <div className="shade-visual image-hover">
            <img src={brandConfig.images.product} alt={`Close view of the first ${brandConfig.brandName} lip oil shade concept`} width="1050" height="1100" loading="lazy" />
            <button className="shade-image-control" type="button" onClick={() => handleShade(activeShade === 0 ? 1 : 0)} aria-label="Explore shade concept" data-testid="button-product-interaction"><span className="eyebrow">TOUCH TO EXPLORE</span><span className="shade-arrow">↗</span></button>
          </div>
          <div className="shade-text">
            <span className="eyebrow reveal">01 — {brandConfig.shadeName}</span>
            <h2 className="serif reveal reveal-delay-1">A shade that<br /><em>feels like yours.</em></h2>
            <p className="reveal reveal-delay-2">One considered color to begin. The shade name and final color description will be confirmed closer to launch.</p>
            <button className="shade-selector reveal reveal-delay-3" type="button" onClick={() => handleShade(0)} data-testid="button-shade-selector"><span className="shade-dot"></span><span><b>01</b> — {brandConfig.shadeName}</span><ArrowRight size={15} /></button>
            <span className="eyebrow shade-footnote">SHADE NAME TO BE CONFIRMED</span>
          </div>
        </section>

        <section className="community section-pad">
          <div className="community-line reveal"><span className="eyebrow">AN INVITATION, NOT A COUNTDOWN</span><span className="serif">THE FIRST 100</span></div>
          <div className="community-center reveal reveal-delay-1">
            <p className="eyebrow">A PLACE IN THE FIRST CHAPTER</p>
            <h2 className="serif">JOIN THE<br /><em>FIRST DROP.</em></h2>
            <p>Be among the first to experience it.</p>
            <p className="community-note">The first 100 is our invitation. No one is counted before they choose to join.</p>
            <AccessLink />
          </div>
          <div className="community-side eyebrow">{brandConfig.brandName.toUpperCase()}<br />CIRCLE Nº 01</div>
        </section>

        <section className="signup section-pad" id="early-access">
          <div className="signup-aside reveal"><span className="eyebrow">A NOTE BEFORE EVERYONE ELSE</span><span className="signup-vertical serif">{brandConfig.brandName.toUpperCase()} · FIRST EDITION</span></div>
          <div className="signup-main">
            <p className="eyebrow reveal">EARLY ACCESS · THE FIRST DROP</p>
            <h2 className="serif reveal reveal-delay-1">BE<br /><em>FIRST.</em></h2>
            <p className="signup-intro reveal reveal-delay-2">Join the first drop and receive early access when we launch.</p>
            <div className="signup-form-wrap reveal reveal-delay-3"><EarlyAccessForm /></div>
          </div>
          <div className="signup-image image-hover reveal"><img src={brandConfig.images.texture} alt="A close study of sheer glossy lip oil texture" width="780" height="1100" loading="lazy" /></div>
        </section>

        <section className="instagram section-pad" id="social">
          <div className="social-heading">
            <div><p className="eyebrow reveal">NOT A FEED. A FIELD NOTE.</p><h2 className="serif reveal reveal-delay-1">FOLLOW THE<br /><em>JOURNEY.</em></h2></div>
            <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="cta-link instagram-link" onClick={onInstagramClick} data-testid="link-instagram">FIND US ON INSTAGRAM <ArrowUpRight size={14} /></a>
          </div>
          <div className="social-grid">
            <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="social-tile tile-one image-hover" onClick={onInstagramClick} aria-label={`See the ${brandConfig.brandName} campaign portrait on Instagram`}><img src={brandConfig.images.hero} alt="Beauty campaign portrait, warm and intimate" loading="lazy" width="620" height="720" /><span className="tile-overlay"></span><span className="tile-label eyebrow">THE FIRST LOOK · 01</span></a>
            <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="social-tile tile-two image-hover" onClick={onInstagramClick} aria-label="See a texture study on Instagram"><img src={brandConfig.images.texture} alt="A close-up study of sheer lip oil texture" loading="lazy" width="620" height="720" /><span className="tile-overlay"></span><span className="tile-label eyebrow">TEXTURE STUDY · 02</span></a>
            <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="social-tile tile-three image-hover" onClick={onInstagramClick} aria-label="See the product still life on Instagram"><img src={brandConfig.images.product} alt="Lip oil campaign still life on pale stone" loading="lazy" width="620" height="720" /><span className="tile-overlay"></span><span className="tile-label eyebrow">OBJECT STUDY · 03</span></a>
            <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="social-tile tile-four image-hover" onClick={onInstagramClick} aria-label="See behind the scenes on Instagram"><img src={brandConfig.images.final} alt="Shadowed beauty campaign image" loading="lazy" width="620" height="720" /><span className="tile-overlay"></span><span className="tile-label eyebrow">AFTER LIGHT · 04</span></a>
            <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="social-tile tile-five image-hover" onClick={onInstagramClick} aria-label="See an editorial detail on Instagram"><img src={brandConfig.images.product} alt="An editorial detail from the lip oil campaign" loading="lazy" width="620" height="720" /><span className="tile-overlay"></span><span className="tile-label eyebrow">STILL LIFE · 05</span></a>
            <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="social-tile tile-six image-hover" onClick={onInstagramClick} aria-label="See a campaign close-up on Instagram"><img src={brandConfig.images.hero} alt="Close-up of glossy lips in golden light" loading="lazy" width="620" height="720" /><span className="tile-overlay"></span><span className="tile-label eyebrow">A MOMENT · 06</span></a>
          </div>
          <a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="mobile-social-link" onClick={onInstagramClick}>FOLLOW THE JOURNEY <ArrowUpRight size={15} /></a>
        </section>

        <section className="journal section-pad" id="journal" aria-labelledby="journal-title">
          <div className="journal-head"><div><p className="eyebrow reveal">A FEW THINGS WE’RE THINKING ABOUT</p><h2 id="journal-title" className="serif reveal reveal-delay-1">The journal.</h2></div><span className="eyebrow journal-count">NOTES FROM THE MAKING</span></div>
          <div className="journal-list">
            {[
              ['01', 'Why we’re starting with one product', 'A point of view on doing less, with more care.'],
              ['02', 'What makes a lip oil different?', 'A small guide to the in-between of care and color.'],
              ['03', 'The art of effortless shine', 'On the details that make a daily ritual feel like yours.'],
              ['04', 'Building a beauty brand from scratch', 'An honest note from the beginning of the story.'],
            ].map(([number, title, summary]) => <article className="journal-entry reveal" key={number}>
              <span className="eyebrow">{number}</span><div><h3 className="serif">{title}</h3><p>{summary}</p></div><span className="journal-arrow" aria-hidden="true">↗</span>
            </article>)}
          </div>
          <p className="journal-note eyebrow">JOURNAL NOTES ARE COMING SOON · FIRST EDITION IN PREPARATION</p>
        </section>

        <section className="final-cta final-image">
          <div className="final-content reveal">
            <p className="eyebrow">YOUR PLACE IN THE BEGINNING</p>
            <h2 className="serif">READY FOR<br /><em>THE FIRST DROP?</em></h2>
            <AccessLink />
          </div>
          <span className="final-caption eyebrow">{brandConfig.brandName.toUpperCase()} · AN OPENING CHAPTER</span>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand"><a className="brand-mark" href="#top">{brandConfig.logo}</a><p className="serif">A quieter kind<br />of beautiful.</p><span className="eyebrow">AN OPENING CHAPTER · [YEAR]</span></div>
        <div className="footer-links"><div><span className="eyebrow">EXPLORE</span><a href="#product">The lip oil</a><a href="#story">Our story</a><a href="#journal">Journal</a><a href="#faq">FAQ</a></div><div><span className="eyebrow">A LITTLE MORE</span><a href="#footer-legal">Contact · details to be confirmed</a><a href="#early-access">Shipping · launching soon</a><a href="#footer-legal">Privacy · coming soon</a><a href="#footer-legal">Terms · coming soon</a><a href={brandConfig.instagramUrl} target="_blank" rel="noopener noreferrer" onClick={onInstagramClick}>Instagram <ArrowUpRight size={12} /></a></div></div>
          <div className="footer-signup"><span className="eyebrow">A NOTE WHEN WE’RE READY</span><p className="serif">Stay close.</p><a href="#early-access" className="footer-join">JOIN THE EARLY ACCESS LIST <ArrowRight size={13} /></a></div>
        </div>
        <div className="footer-bottom" id="footer-legal"><span>© {new Date().getFullYear()} {brandConfig.brandName.toUpperCase()} · ALL RIGHTS RESERVED</span><span>MADE WITH INTENTION</span><a href="#top">BACK TO TOP ↑</a></div>
      </footer>
    </div>
  );
}

function App() {
  return <QueryClientProvider client={queryClient}><LaunchPage /></QueryClientProvider>;
}

export default App;

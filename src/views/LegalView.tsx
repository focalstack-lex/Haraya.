import React from 'react';
import { LargeTitle } from '../components/common/LargeTitle';

export type LegalPage = 'privacy' | 'terms';

/**
 * Privacy Notice and Terms. Statements of fact describe what the code does today; anything that needs a
 * business or legal decision is a bracketed placeholder for Lex and counsel. Do not replace placeholders
 * with guesses, and update the fact sections whenever data handling changes (Supabase, Aya).
 */

const LAST_UPDATED = '28 September 2026';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="ios-title text-[19px] text-[#13191F]">{title}</h2>
    <div className="space-y-2 text-[15px] leading-relaxed text-[#13191F]/85">{children}</div>
  </section>
);

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono text-[13px] text-[#8C3A2E]">[{children}]</span>
);

const DraftNotice: React.FC = () => (
  <p className="rounded-[14px] ios-fill px-4 py-3 text-[14px] text-[#594C3D]">
    This page is being finalized. Items in brackets are still to be confirmed.
  </p>
);

const List: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

const Privacy: React.FC = () => (
  <>
    <LargeTitle title="Privacy Notice" subtitle={`Last updated ${LAST_UPDATED}`} />
    <DraftNotice />

    <Section title="Who we are">
      <p>
        Haraya is operated by <Placeholder>legal name of the operator</Placeholder>,{' '}
        <Placeholder>business address</Placeholder>. For privacy questions or requests, contact our Data Protection
        Officer at <Placeholder>privacy contact email</Placeholder>.
      </p>
    </Section>

    <Section title="What we collect and why">
      <List
        items={[
          <>
            <strong>Saves, ratings, lists, reminders and likes</strong>: kept on your device so the app remembers
            your picks.
          </>,
          <>
            <strong>Cup Check posts</strong>: your display name, caption, cup photo and flavor pins, to show your post
            in the community feed.
          </>,
          <>
            <strong>Reservations</strong>: your name, contact channel, quantity and message, used only so the roaster
            can confirm your order with you.
          </>,
          <>
            <strong>Roaster applications</strong>: business name, storefront handle, city, district, description,
            DTI or Mayor's permit number, contact name, email and password, to verify the business and run the
            Roaster Suite. Passwords are stored only as a salted hash. We do not collect ID photos in this form.
          </>,
          <>
            <strong>Location</strong>: only when you tap Near me, to sort cafes by distance. It is not stored and not
            sent to us.
          </>,
        ]}
      />
    </Section>

    <Section title="Where your data is kept">
      <p>
        Today, the records above are stored in your browser on this device. Clearing this site's data in your browser
        settings removes them. When listings and accounts move to our database, this notice will be updated before
        the change goes live.
      </p>
    </Section>

    <Section title="Services that receive data">
      <List
        items={[
          'Vercel, which hosts the app, receives standard request data such as your IP address.',
          'Google Fonts delivers the typeface and receives your IP address.',
          'OpenStreetMap map tiles are requested from your browser and include your IP address.',
          'Open-Meteo provides the weather hint. We send fixed city coordinates, not your location.',
          'Google Maps and Google Calendar receive details only when you choose to open a route or add a reminder there.',
        ]}
      />
      <p>We do not use analytics, advertising or tracking cookies.</p>
    </Section>

    <Section title="How long we keep it">
      <p>
        <Placeholder>retention period for each category once server storage is live</Placeholder>
      </p>
    </Section>

    <Section title="Your rights">
      <p>
        Under the Data Privacy Act of 2012 (Republic Act No. 10173) you may ask to access, correct or erase your
        personal data, object to its processing, and receive a copy of it. You may also file a complaint with the
        National Privacy Commission. Send requests to <Placeholder>privacy contact email</Placeholder>.
      </p>
    </Section>
  </>
);

const Terms: React.FC = () => (
  <>
    <LargeTitle title="Terms of Use" subtitle={`Last updated ${LAST_UPDATED}`} />
    <DraftNotice />

    <Section title="What Haraya is">
      <p>
        Haraya is a directory of specialty cafes, micro-roasteries and single-origin beans in the Davao Region.
        Roasters and cafes listed here are independent businesses. Haraya does not sell coffee and is not a party to
        any sale between you and a roaster.
      </p>
    </Section>

    <Section title="Reservations">
      <p>
        A reservation or inquiry is a request to the roaster, not a purchase. The roaster confirms the price, payment
        method and pickup or delivery directly with you. Questions about an order go to the roaster.
      </p>
    </Section>

    <Section title="Roasters and cafes">
      <List
        items={[
          'Keep your listing accurate: hours, menu, prices, stock and photos you have the right to use.',
          'You are responsible for your permits, product safety, labeling and any registration your products require.',
          '"Verified" means Haraya reviewed your business permit number. It is not a rating of quality.',
        ]}
      />
    </Section>

    <Section title="Cup Check posts">
      <List
        items={[
          'You keep ownership of the photos and text you post.',
          <>
            By posting, you allow Haraya to display them in the app <Placeholder>scope and duration of this license</Placeholder>.
          </>,
          'Post only photos you took or have permission to share. No hateful, sexual, misleading or unlawful content, and no fake reviews.',
          <>
            To report a post, contact <Placeholder>content report email</Placeholder>.
          </>,
        ]}
      />
    </Section>

    <Section title="Liability and governing law">
      <p>
        <Placeholder>limitation of liability and governing law, to be written with counsel</Placeholder>
      </p>
    </Section>

    <Section title="Contact">
      <p>
        <Placeholder>operator name and contact email</Placeholder>
      </p>
    </Section>
  </>
);

export const LegalView: React.FC<{ page: LegalPage }> = ({ page }) => (
  <article className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-8 sm:pt-4 space-y-6">
    {page === 'privacy' ? <Privacy /> : <Terms />}
  </article>
);

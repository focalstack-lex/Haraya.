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
            <strong>Your account</strong>: your email address, your name, and a password if you choose one, so you
            can sign in. Passwords are handled by Supabase Auth and stored only as a hash; you can also sign in with
            a one-time email link instead. Your role (member, place owner, admin) is stored with your account.
          </>,
          <>
            <strong>Add a Spot</strong>: the details you submit about a place (name, area, landmark, map pin,
            amenities, hours, price range, tip), linked to your account so you can see which spots are yours.
            Approved spots are shown publicly without your email.
          </>,
          <>
            <strong>Place Portal applications</strong>: the name of your place, its type, address and map pin, your
            DTI or Mayor's permit number, a contact name and optional phone number, and a description, used to
            verify the business before its listing goes live. We do not collect ID photos. Once approved, the listing
            details you edit (hours, amenities, menu and the like) are shown publicly; the permit number and phone
            number are not.
          </>,
          <>
            <strong>Location</strong>: read on your device when you tap Near me, Use my current location, or Navigate
            in Haraya. During navigation it updates while the walk is running and stops when you end it or arrive. It
            is not stored and not sent to us. A spot's map pin is the place's location, not yours.
          </>,
        ]}
      />
    </Section>

    <Section title="Where your data is kept">
      <p>
        Your account, the spots you add, place applications and place listings are stored in our database, hosted
        by Supabase. Everything else
        above (saves, ratings, lists, reminders, likes and posts) is stored in your browser on this device, and
        clearing this site's data in your browser settings removes it.
      </p>
    </Section>

    <Section title="Services that receive data">
      <List
        items={[
          'Vercel, which hosts the app, receives standard request data such as your IP address.',
          'Supabase, which runs our database and sign-in, stores your account, the spots you add and place listings, and sends sign-in, confirmation and password-reset emails.',
          'Google Fonts delivers the typeface and receives your IP address.',
          'OpenStreetMap map tiles are requested from your browser and include your IP address.',
          'Open-Meteo provides the weather hint. We send fixed city coordinates, not your location.',
          'Google Maps, Apple Maps, Waze and Google Calendar receive the destination only when you choose to open it there.',
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
        Haraya is a guide to cafes, study spots and hidden gems in the Davao Region. Places listed here are independent
        businesses. Haraya does not sell anything and is not a party to what you buy at a place.
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

    <Section title="Adding a spot">
      <List
        items={[
          'Add only businesses open to the public. Never add a private home or a place that asked not to be listed.',
          'Share details that are true to your knowledge. Haraya reviews every spot and may edit, decline or remove it.',
          'You can add up to 5 spots a day. Spam, fake places and advertising are removed and can end your access.',
          'Walking directions in Haraya are a straight-line guide, not a street route. Watch where you walk and follow local roads and signs.',
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

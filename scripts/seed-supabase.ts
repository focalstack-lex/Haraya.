import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { mockCafes } from '../src/data/mockCafes';
import { mockBeans } from '../src/data/mockBeans';
import { mockDrops } from '../src/data/mockDrops';

// Read .env.local for credentials
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = 'https://mrptyujjpltvazgjxktn.supabase.co';
let serviceKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].replace(/["']/g, '');
    } else if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceKey = trimmed.split('=')[1].replace(/["']/g, '');
    }
  }
}

if (!serviceKey) {
  serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

if (!serviceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required in .env.local to seed data.');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey);

async function seed() {
  console.log(`Seeding Haraya catalog to Supabase (${supabaseUrl})...`);

  // 1. Seed Cafes
  const cafesPayload = mockCafes.map((c) => ({
    id: c.id,
    handle: c.handle,
    name: c.name,
    is_roastery: c.isRoastery,
    city: c.city,
    district: c.district,
    address: c.address,
    lat: c.lat,
    lng: c.lng,
    images: c.images,
    logo_url: c.logoUrl,
    description: c.description,
    signature: c.signature,
    menu: c.menu,
    amenities: c.amenities,
    wifi_mbps: c.wifiMbps,
    brew_methods: c.brewMethods,
    price_level: c.priceLevel,
    hours: c.hours,
    vibe_tags: c.vibeTags,
    verified: c.verified,
    save_count: c.saveCount,
    view_count: c.viewCount,
    created_at: c.dateAdded,
  }));

  const { error: cafeError } = await client.from('cafes').upsert(cafesPayload, { onConflict: 'id' });
  if (cafeError) {
    console.error('Failed to seed cafes:', cafeError.message);
    return;
  }
  console.log(`[v] Seeded ${cafesPayload.length} cafes.`);

  // 2. Seed Beans
  const beansPayload = mockBeans.map((b) => ({
    id: b.id,
    roaster_id: b.roasterId,
    roaster_name: b.roasterName,
    name: b.name,
    origin: b.origin,
    farm: b.farm,
    varietal: b.varietal,
    process: b.process,
    altitude_masl: b.altitudeMasl,
    tasting_notes: b.tastingNotes,
    roast_profile: b.roastProfile,
    price: b.price,
    drip_pack_price: b.dripPackPrice,
    bags_in_stock: b.bagsInStock,
    images: b.images,
    description: b.description,
    is_limited: b.isLimited,
    single_origin: b.singleOrigin,
  }));

  const { error: beanError } = await client.from('beans').upsert(beansPayload, { onConflict: 'id' });
  if (beanError) {
    console.error('Failed to seed beans:', beanError.message);
    return;
  }
  console.log(`[v] Seeded ${beansPayload.length} beans.`);

  // 3. Seed Drops
  const dropsPayload = mockDrops.map((d) => ({
    id: d.id,
    roaster_id: d.roasterId,
    roaster_name: d.roasterName,
    bean_id: d.beanId,
    title: d.title,
    description: d.description,
    drop_at: d.dropAt,
    batch_bags: d.batchBags,
    price: d.price,
    status: d.status,
    remind_count: d.remindCount,
    cover_image: d.coverImage,
  }));

  const { error: dropError } = await client.from('roast_drops').upsert(dropsPayload, { onConflict: 'id' });
  if (dropError) {
    console.error('Failed to seed roast drops:', dropError.message);
    return;
  }
  console.log(`[v] Seeded ${dropsPayload.length} roast drops.`);

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);

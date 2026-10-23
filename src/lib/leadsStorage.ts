import fs from 'node:fs/promises';
import path from 'node:path';

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  service: string;
  budget: string;
  timeline: string;
  message: string;
  status: 'new' | 'contacted' | 'in_progress' | 'won' | 'cancelled';
  notes?: string;
  source?: string;
  createdAt: string;
  formattedDate: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'leads.json');

// In-memory fallback for serverless edge runtimes (e.g. Cloudflare Pages / Workers)
let memoryLeads: Lead[] = [
  {
    id: 'ORD-1792770542936',
    fullName: 'রেদওয়ান আহমেদ (Sample Order)',
    phone: '01560-007230',
    email: 'dev.anwarul@gmail.com',
    service: 'ই-কমার্স ল্যান্ডিং পেজ (৳৫০০ অফার)',
    budget: '৳৯৯৯ - ফুল কন্ট্রোল প্যাক (ড্যাশবোর্ড + পিক্সেল + ফ্রড ব্লকার)',
    timeline: '২৪ ঘণ্টা',
    message: 'Product: Organic Honey & Dry Fruits | Package: ৳999 Full Pack',
    status: 'in_progress',
    notes: 'ডেমো পাঠানো হয়েছে, আগামীকাল পিক্সেল কানেক্ট করা হবে।',
    source: 'Landing Page 500 Taka Campaign',
    createdAt: new Date().toISOString(),
    formattedDate: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
  }
];

// Ensure directory and file exist (when filesystem is accessible)
async function ensureDataFile(): Promise<void> {
  try {
    if (typeof fs?.mkdir === 'function') {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify(memoryLeads, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    // Expected on read-only edge runtimes like Cloudflare Pages
  }
}

export async function getAllLeads(): Promise<Lead[]> {
  await ensureDataFile();
  try {
    if (typeof fs?.readFile === 'function') {
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryLeads = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    // Fall back to memoryLeads
  }
  return memoryLeads;
}

export async function addLead(newLead: Omit<Lead, 'id' | 'status' | 'createdAt' | 'formattedDate'> & Partial<Lead>): Promise<Lead> {
  const fullLead: Lead = {
    id: newLead.id || 'LEAD-' + Date.now(),
    fullName: newLead.fullName || 'Anonymous Client',
    phone: newLead.phone || '',
    email: newLead.email || '',
    service: newLead.service || 'General Consultation',
    budget: newLead.budget || 'Open / Discussion',
    timeline: newLead.timeline || 'Flexible',
    message: newLead.message || '',
    status: (newLead.status as Lead['status']) || 'new',
    notes: newLead.notes || '',
    source: newLead.source || 'Website Form',
    createdAt: newLead.createdAt || new Date().toISOString(),
    formattedDate: newLead.formattedDate || new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
  };

  const leads = await getAllLeads();
  leads.unshift(fullLead);
  memoryLeads = leads;

  try {
    if (typeof fs?.writeFile === 'function') {
      await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    }
  } catch (err) {
    // Gracefully handle read-only edge environments
  }
  return fullLead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const leads = await getAllLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    ...updates,
    id: leads[index].id
  };
  memoryLeads = leads;

  try {
    if (typeof fs?.writeFile === 'function') {
      await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
    }
  } catch (err) {
    // Gracefully handle read-only edge environments
  }
  return leads[index];
}

export async function deleteLead(id: string): Promise<boolean> {
  const leads = await getAllLeads();
  const filtered = leads.filter(l => l.id !== id);
  if (filtered.length === leads.length) return false;

  memoryLeads = filtered;
  try {
    if (typeof fs?.writeFile === 'function') {
      await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    }
  } catch (err) {
    // Gracefully handle read-only edge environments
  }
  return true;
}

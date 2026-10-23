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

// Ensure directory and file exist
async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      // Create initial array with a demo lead if completely fresh
      const initialLeads: Lead[] = [
        {
          id: 'ORD-' + Date.now(),
          fullName: 'রেদওয়ান আহমেদ (Sample Order)',
          phone: '01560-007230',
          email: 'dev.anwarul@gmail.com',
          service: 'ই-কমার্স ল্যান্ডিং পেজ',
          budget: '৳৯৯৯ - ড্যাশবোর্ড + পিক্সেল + ফেক অর্ডার ব্লকার',
          timeline: '২৪ ঘণ্টা',
          message: 'Product: Organic Honey & Dry Fruits | Package: ৳999 Full Pack',
          status: 'new',
          notes: 'কাস্টমার ফেসবুকে অ্যাড চালাবে, পিক্সেল সেটআপ ও কুরিয়ার কানেক্ট করে দিতে হবে।',
          source: 'Landing Page Campaign',
          createdAt: new Date().toISOString(),
          formattedDate: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
        }
      ];
      await fs.writeFile(DATA_FILE, JSON.stringify(initialLeads, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring leads data file:', err);
  }
}

export async function getAllLeads(): Promise<Lead[]> {
  await ensureDataFile();
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const leads: Lead[] = JSON.parse(raw || '[]');
    return leads;
  } catch (err) {
    console.error('Error reading leads:', err);
    return [];
  }
}

export async function addLead(newLead: Omit<Lead, 'id' | 'status' | 'createdAt' | 'formattedDate'> & Partial<Lead>): Promise<Lead> {
  await ensureDataFile();
  const leads = await getAllLeads();

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

  leads.unshift(fullLead);
  await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return fullLead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  await ensureDataFile();
  const leads = await getAllLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    ...updates,
    id: leads[index].id // Ensure ID remains immutable
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return leads[index];
}

export async function deleteLead(id: string): Promise<boolean> {
  await ensureDataFile();
  const leads = await getAllLeads();
  const filtered = leads.filter(l => l.id !== id);
  if (filtered.length === leads.length) return false;

  await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

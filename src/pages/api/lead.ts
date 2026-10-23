import type { APIRoute } from 'astro';
import { getAllLeads, addLead, updateLead, deleteLead } from '../../lib/leadsStorage';

export const prerender = false;

// GET: Fetch all saved leads
export const GET: APIRoute = async () => {
  try {
    const leads = await getAllLeads();
    return new Response(
      JSON.stringify({
        status: 'success',
        count: leads.length,
        leads
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to retrieve leads' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST: Add new lead from web form or WhatsApp trigger
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (!body.fullName && !body.phone && !body.email) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'At least name, phone or email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const savedLead = await addLead({
      fullName: body.fullName || 'Anonymous Visitor',
      phone: body.phone || '',
      email: body.email || '',
      service: body.service || 'Custom Solution',
      budget: body.budget || 'Open / Discussion',
      timeline: body.timeline || 'Flexible',
      message: body.message || '',
      source: body.source || 'Website Discovery Form',
      notes: body.notes || ''
    });

    console.log('[HaqPlus Server] New Lead Recorded:', savedLead.fullName, savedLead.phone);

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Lead recorded successfully into HaqPlus IT Database',
        lead: savedLead
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[HaqPlus Lead POST Error]:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Internal server error while recording lead'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// PATCH: Update lead status or admin notes
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Lead ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await updateLead(id, {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {})
    });

    if (!updated) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Lead not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: 'success', lead: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to update lead' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE: Delete a lead
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Lead ID query param is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const deleted = await deleteLead(id);
    if (!deleted) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Lead not found or already deleted' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: 'success', message: 'Lead removed successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to delete lead' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

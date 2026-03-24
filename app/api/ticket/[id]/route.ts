import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ['unresolved', 'in_progress', 'resolved'] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return new Response(
        JSON.stringify({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', parseInt(id, 10))
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update ticket' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ticket: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

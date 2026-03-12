import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ leads: [], message: "Persistência não configurada." });
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data });
}

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ message: "Persistência não configurada. Leads não foram salvos." });
  }

  const { leads, search_params } = await req.json();

  const rows = leads.map((lead: any) => ({
    external_id: lead.id,
    name: lead.name,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    rating: lead.rating,
    user_rating_count: lead.userRatingCount,
    primary_type: lead.primaryType,
    phone: lead.nationalPhoneNumber,
    website: lead.websiteUri,
    google_maps_uri: lead.googleMapsUri,
    digital_pain_score: lead.digitalPainScore,
    ai_summary: lead.aiSummary,
    search_icp: search_params?.icp,
    search_service: search_params?.service,
    search_location: search_params?.city
      ? `${search_params.city}, ${search_params.state}`
      : search_params?.state,
  }));

  const { data, error } = await supabase.from("leads").insert(rows).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data?.length || 0 });
}

// Supabase Edge Function: Public Booking
// Handles public booking submissions securely using database transactions and exclusion lock validation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const {
      barbershop_id,
      service_id,
      barber_id,
      starts_at,
      customer_name,
      customer_phone,
      honeypot, // Spam honeypot protection
    } = await req.json()

    // Honeypot check
    if (honeypot) {
      return new Response(
        JSON.stringify({ success: false, message: "Requisição inválida." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Call atomic PostgreSQL function
    const { data, error } = await supabaseClient.rpc("book_public_appointment", {
      p_barbershop_id: barbershop_id,
      p_service_id: service_id,
      p_barber_id: barber_id || null,
      p_starts_at: starts_at,
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
    })

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    const status = data.success ? 200 : (data.code === 'SLOT_CONFLICT' ? 409 : 400)
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || "Erro interno do servidor" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})

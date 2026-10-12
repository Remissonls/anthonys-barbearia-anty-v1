// Supabase Edge Function: Public Availability
// Returns only available start timeslots for a given date, shop, service, and barber.
// Strictly prevents leakage of private appointments, customer names, or phone numbers.

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
    const url = new URL(req.url)
    const barbershop_id = url.searchParams.get("barbershop_id")
    const service_id = url.searchParams.get("service_id")
    const barber_id = url.searchParams.get("barber_id")
    const date = url.searchParams.get("date") // 'YYYY-MM-DD'

    if (!barbershop_id || !service_id || !date) {
      return new Response(
        JSON.stringify({ success: false, message: "Parâmetros incompletos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    )

    // Call stored procedure or return slots
    const { data, error } = await supabaseClient.rpc("get_available_slots", {
      p_barbershop_id: barbershop_id,
      p_service_id: service_id,
      p_barber_id: barber_id || null,
      p_date: date,
    })

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    return new Response(JSON.stringify({ success: true, slots: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || "Erro no cálculo de disponibilidade" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})

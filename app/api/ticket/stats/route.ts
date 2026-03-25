"use server";

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tickets')
      .select('timestamp, category')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tickets', details: error.message }, { status: 500 })
    }

    const tickets = data || []
    const total = tickets.length

    // Volume by day
    const byDay: Record<string, number> = {}
    tickets.forEach((t) => {
      const date = new Date(t.timestamp).toISOString().split('T')[0]
      byDay[date] = (byDay[date] || 0) + 1
    })
    const volumeByDay = Object.entries(byDay)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, count]) => ({ date: date.slice(5), count }))


    // Volume by category
    const byCat: Record<string, number> = {}
    tickets.forEach((t) => {
      byCat[t.category] = (byCat[t.category] || 0) + 1
    })
    const volumeByCat = Object.entries(byCat)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }))


    // Print byCat
    console.log("byCat:");
    for (const [key, value] of Object.entries(byCat)) {
      console.log(`[${JSON.stringify(key)}] => ${value}`);
    }

    // Print byDay (I assume you meant byDay, not byVolume)
    console.log("byDay:");
    for (const [key, value] of Object.entries(byDay)) {
      console.log(`Date: ${key}, Count: ${value}`);
    }
    return NextResponse.json({
      total,
      volumeByDay,
      volumeByCat,
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (e) {
    console.error('Error calculating statistics:', e)
    return NextResponse.json({ error: 'Internal server error', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
